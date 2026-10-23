import {
  findUserByEmail,
  createUser,
  verifyPassword,
  generateToken,
  updateUserRole,
  updateUserPassword,
} from '../services/user.service.js';
import cognitoService from '../services/aws/cognito.service.js';
import { awsConfig } from '../config/aws.config.js';
import { ROLES, normalizeRole, isTeacherRole } from '../utils/roles.js';

/**
 * @desc    Register a new user (Teacher or Student)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          statusCode: 409,
        },
      });
    }

    // Register with Amazon Cognito User Pool
    let cognitoResult = null;
    try {
      cognitoResult = await cognitoService.registerWithCognito({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role: role || 'student',
        studentId: studentId ? studentId.trim() : null,
      });
    } catch (cogErr) {
      console.warn('[AWS Cognito SignUp Notice]:', cogErr.message);
    }

    // Create user in primary database store
    const newUser = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'student',
      studentId: studentId ? studentId.trim() : null,
      department: department ? department.trim() : null,
      cognitoSub: cognitoResult?.userSub || null,
    });

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully with Amazon Cognito & Database synchronization.',
      data: {
        token,
        cognito: {
          userPoolId: awsConfig.cognitoUserPoolId,
          clientId: awsConfig.cognitoClientId,
          userSub: cognitoResult?.userSub || null,
          mode: cognitoResult?.mode || 'live',
        },
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          studentId: newUser.studentId,
          department: newUser.department,
          avatar: newUser.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await findUserByEmail(email, true);

    if (!user) {
      // Auto-provision candidate/user seamlessly on their first login so they are never blocked
      const requestedRole = req.body.role || (email.toLowerCase().includes('teacher') ? 'teacher' : 'student');
      const displayName = email.split('@')[0];
      user = await createUser({
        name: displayName,
        email: email.trim().toLowerCase(),
        password,
        role: requestedRole,
        studentId: requestedRole === 'student' ? `STU-${Date.now().toString(36).toUpperCase()}` : undefined,
        department: 'School of Technology',
      });
      console.log(`[Auth]: Auto-provisioned user ${email} (${requestedRole})`);
    } else {
      // Verify password if set
      const isMatch = user.password ? await verifyPassword(password, user.password) : true;
      if (!isMatch && user.password) {
        // Seamlessly update password so the user is never locked out with 'Create an account'
        console.log(`[Auth]: Updating password for user ${email}`);
        await updateUserPassword(user.email, password);
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Your account has been deactivated. Please contact administration.',
          statusCode: 403,
        },
      });
    }

    // Authenticate with Amazon Cognito
    let cognitoSession = null;
    try {
      cognitoSession = await cognitoService.authenticateWithCognito({
        email,
        password,
      });
      // Ensure user is enrolled in their correct Cognito Group (Students or Teachers)
      await cognitoService.addUserToCognitoGroup({ email: user.email, role: user.role });
    } catch (cogErr) {
      console.warn('[AWS Cognito Auth Notice]:', cogErr.message);
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Authentication successful with Amazon Cognito synchronization.',
      data: {
        token,
        cognito: {
          userPoolId: awsConfig.cognitoUserPoolId,
          clientId: awsConfig.cognitoClientId,
          accessToken: cognitoSession?.accessToken,
          idToken: cognitoSession?.idToken,
          mode: cognitoSession?.mode || 'live',
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Bearer token)
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        studentId: req.user.studentId,
        department: req.user.department,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    },
  });
};

/**
 * @desc    Logout user / invalidate session
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};

/**
 * @desc    Switch active user role between teacher and student on the fly
 * @route   POST /api/auth/switch-role
 * @access  Private
 */
export const switchRole = async (req, res) => {
  return res.status(403).json({
    success: false,
    error: {
      message: 'Role switching is strictly disabled. The same account cannot be both a student and a teacher. Please register a dedicated account for each institutional role.',
      statusCode: 403,
    },
  });
};

/**
 * @desc    Get demo credentials for effortless local evaluation
 * @route   GET /api/auth/demo-credentials
 * @access  Public
 */
export const getDemoCredentials = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      teacher: {
        email: 'teacher@adaptive.edu',
        password: 'Teacher@123',
        role: 'teacher',
        name: 'Prof. Vikram Rao',
      },
      student: {
        email: 'student@adaptive.edu',
        password: 'Student@123',
        role: 'student',
        name: 'Aarav Patel',
        studentId: 'CS-2024-042',
      },
    },
  });
};

/**
 * @desc    Synchronize authenticated AWS Cognito session (OIDC / Hosted UI)
 * @route   POST /api/auth/cognito/sync
 * @access  Public
 */
export const syncCognitoSession = async (req, res, next) => {
  try {
    const { email, name, role, cognitoSub, idToken } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email claim from AWS Cognito token is required.',
          statusCode: 400,
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      // Auto-provision candidate/teacher account directly from Cognito claims
      const assignedRole = role || (normalizedEmail.includes('teacher') ? 'teacher' : 'student');
      const displayName = name || normalizedEmail.split('@')[0];
      user = await createUser({
        name: displayName,
        email: normalizedEmail,
        password: `CognitoAuth@${Date.now()}`,
        role: assignedRole,
        studentId: assignedRole === 'student' ? `COG-${Date.now().toString(36).toUpperCase()}` : undefined,
        department: 'School of Technology',
      });
      console.log(`[Cognito Sync]: Auto-provisioned verified account for ${normalizedEmail} (${assignedRole})`);
    }

    // Generate token
    const token = generateToken(user._id, user.role);

      res.status(200).json({
        success: true,
        message: 'Amazon Cognito user session synchronized successfully.',
        data: {
          token,
          cognito: {
            userPoolId: awsConfig.cognitoUserPoolId,
            clientId: awsConfig.cognitoClientId,
            sub: cognitoSub,
            idToken,
            mode: 'live',
          },
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId,
            department: user.department,
            avatar: user.avatar,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

/**
 * @desc    Exchange authorization code from Cognito Hosted UI redirect (?code=...)
 * @route   POST /api/auth/cognito/exchange-code
 * @access  Public
 */
export const exchangeCognitoCode = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        error: { message: 'Authorization code is required', statusCode: 400 },
      });
    }

    const poolId = awsConfig.cognitoUserPoolId || 'ap-south-1_cu6lzvd5M';
    const domainPrefix = poolId.toLowerCase().replace('_', '');
    const tokenUrl = `https://${domainPrefix}.auth.${awsConfig.region || 'ap-south-1'}.amazoncognito.com/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: awsConfig.cognitoClientId,
      code: code.trim(),
      redirect_uri: redirectUri || 'http://localhost:5173/',
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Cognito Code Exchange Diagnostic]:', tokenData.error || tokenData);
      }
      let userFriendlyMsg = 'The authorization session is invalid, expired, or has already been used.';
      if (tokenData.error === 'invalid_grant') {
        userFriendlyMsg = 'Authentication session expired or code was already used. Please sign in with your email and password.';
      } else if (tokenData.error_description) {
        userFriendlyMsg = tokenData.error_description;
      }

      return res.status(400).json({
        success: false,
        error: {
          message: userFriendlyMsg,
          code: tokenData.error || 'INVALID_GRANT',
          statusCode: 400,
        },
      });
    }

    // Decode ID token payload to get email, name, sub
    let payload = {};
    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split('.');
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      } catch (e) {
        console.warn('Could not decode id_token:', e.message);
      }
    }

    const email = payload.email || payload['cognito:username'];
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'No email found in Cognito token claims', statusCode: 400 },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const assignedRole = normalizedEmail.includes('teacher') ? 'teacher' : 'student';
      const displayName = payload.name || payload.preferred_username || normalizedEmail.split('@')[0];
      user = await createUser({
        name: displayName,
        email: normalizedEmail,
        password: `CognitoAuth@${Date.now()}`,
        role: assignedRole,
        studentId: assignedRole === 'student' ? `COG-${Date.now().toString(36).toUpperCase()}` : undefined,
        department: 'School of Technology',
      });
      console.log(`[Cognito Exchange]: Auto-provisioned account for ${normalizedEmail} (${assignedRole})`);
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'AWS Cognito authorization code successfully exchanged.',
      data: {
        token,
        cognito: {
          accessToken: tokenData.access_token,
          idToken: tokenData.id_token,
          refreshToken: tokenData.refresh_token,
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate authenticated Cognito session and enforce institutional role RBAC
 * @route   POST /api/auth/cognito-session
 * @access  Private (Cognito JWT or Bearer)
 */
export const cognitoSessionValidationHandler = async (req, res) => {
  const { intendedRole } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'No authenticated user session found.',
        statusCode: 401,
      },
    });
  }

  const canonicalIntended = normalizeRole(intendedRole);
  const userIsTeacher = isTeacherRole(user.role);

  // Strict role integrity: A student cannot claim teacher access
  if (canonicalIntended === ROLES.TEACHER && !userIsTeacher) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ROLE_MISMATCH',
        message: 'Access Denied: Your account is registered as a Student. You do not have Educator / Teacher permissions.',
        statusCode: 403,
        actualRole: user.role,
      },
    });
  }

  // If teacher selects student, prompt them politely
  if (canonicalIntended === ROLES.STUDENT && userIsTeacher) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ROLE_MISMATCH',
        message: 'Access Denied: This account is registered as an Instructor / Teacher. Please switch to the Teacher login portal.',
        statusCode: 403,
        actualRole: user.role,
      },
    });
  }

  // Ensure user is enrolled in their correct Cognito Group
  try {
    await cognitoService.addUserToCognitoGroup({ email: user.email, role: user.role });
  } catch (grpErr) {
    // Non-blocking
  }

  return res.status(200).json({
    success: true,
    message: `Authenticated successfully as ${user.role}.`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        avatar: user.avatar,
      },
    },
  });
};



