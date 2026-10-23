import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_cu6lzvd5M',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '7d25hpuqb2cgv0fc3jljv3s9s5',
};

export const userPool = new CognitoUserPool(poolData);

/**
 * Get a CognitoUser instance for an email
 */
export const getCognitoUser = (email) => {
  return new CognitoUser({
    Username: email.trim().toLowerCase(),
    Pool: userPool,
  });
};

/**
 * Real AWS Cognito Sign-In (SRP Protocol)
 * Direct cryptographic authentication against AWS User Pool without Hosted UI redirect.
 */
export const signInCognito = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    const normalizedEmail = email.trim().toLowerCase();
    const authenticationDetails = new AuthenticationDetails({
      Username: normalizedEmail,
      Password: password,
    });

    const cognitoUser = getCognitoUser(normalizedEmail);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();
        const payload = session.getIdToken().decodePayload();

        resolve({
          success: true,
          idToken,
          accessToken,
          refreshToken,
          sub: payload.sub,
          email: payload.email || normalizedEmail,
          name: payload.name || normalizedEmail.split('@')[0],
          cognitoUser,
        });
      },
      onFailure: (err) => {
        let userFriendlyMsg = err.message || 'Authentication failed';
        let isUnconfirmed = false;

        if (err.code === 'UserNotConfirmedException') {
          isUnconfirmed = true;
          userFriendlyMsg = 'Your account has not been confirmed yet. Please enter the verification code sent to your email.';
        } else if (err.code === 'NotAuthorizedException') {
          userFriendlyMsg = 'Incorrect email or password. Please verify your credentials.';
        } else if (err.code === 'UserNotFoundException') {
          userFriendlyMsg = 'No account found with this email address.';
        }

        resolve({
          success: false,
          code: err.code || 'AUTH_ERROR',
          message: userFriendlyMsg,
          isUnconfirmed,
          email: normalizedEmail,
        });
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        resolve({
          success: false,
          code: 'NEW_PASSWORD_REQUIRED',
          message: 'Password reset required by administrator.',
          cognitoUser,
        });
      },
    });
  });
};

/**
 * Real AWS Cognito Registration
 */
export const signUpCognito = ({ name, email, password, role = 'student' }) => {
  return new Promise((resolve, reject) => {
    const normalizedEmail = email.trim().toLowerCase();
    const attributeList = [
      new CognitoUserAttribute({ Name: 'name', Value: name.trim() }),
      new CognitoUserAttribute({ Name: 'email', Value: normalizedEmail }),
    ];

    userPool.signUp(
      normalizedEmail,
      password,
      attributeList,
      null,
      (err, result) => {
        if (err) {
          let msg = err.message || 'Registration failed';
          if (err.code === 'UsernameExistsException') {
            msg = 'An account with this email address already exists. Please sign in or confirm your account.';
          } else if (err.code === 'InvalidPasswordException') {
            msg = 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.';
          }
          return resolve({
            success: false,
            code: err.code || 'SIGNUP_ERROR',
            message: msg,
          });
        }

        resolve({
          success: true,
          userSub: result.userSub,
          userConfirmed: result.userConfirmed,
          email: normalizedEmail,
        });
      }
    );
  });
};

/**
 * Confirm user registration using 6-digit email code
 */
export const confirmSignUpCognito = ({ email, code }) => {
  return new Promise((resolve) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.confirmRegistration(code.trim(), true, (err, result) => {
      if (err) {
        return resolve({
          success: false,
          code: err.code || 'CONFIRM_ERROR',
          message: err.message || 'Failed to confirm account. Please check the code.',
        });
      }
      resolve({
        success: true,
        message: 'Account confirmed successfully! You can now sign in.',
      });
    });
  });
};

/**
 * Resend 6-digit confirmation code
 */
export const resendConfirmationCodeCognito = ({ email }) => {
  return new Promise((resolve) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        return resolve({
          success: false,
          code: err.code || 'RESEND_ERROR',
          message: err.message || 'Failed to resend confirmation code.',
        });
      }
      resolve({
        success: true,
        message: 'A fresh verification code has been dispatched to your email.',
      });
    });
  });
};

/**
 * Forgot password request (sends reset code to email)
 */
export const forgotPasswordCognito = ({ email }) => {
  return new Promise((resolve) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve({ success: true, message: 'Password reset code sent to email.' });
      },
      onFailure: (err) => {
        resolve({
          success: false,
          message: err.message || 'Failed to initiate password reset.',
        });
      },
      inputVerificationCode: () => {
        resolve({ success: true, message: 'Verification code sent to email.' });
      },
    });
  });
};

/**
 * Confirm new password with reset code
 */
export const confirmNewPasswordCognito = ({ email, code, newPassword }) => {
  return new Promise((resolve) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => {
        resolve({ success: true, message: 'Password updated successfully! Please sign in.' });
      },
      onFailure: (err) => {
        resolve({
          success: false,
          message: err.message || 'Failed to reset password. Please verify the code.',
        });
      },
    });
  });
};

/**
 * Sign out current Cognito user
 */
export const signOutCognito = () => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
};

export default {
  userPool,
  signInCognito,
  signUpCognito,
  confirmSignUpCognito,
  resendConfirmationCodeCognito,
  forgotPasswordCognito,
  confirmNewPasswordCognito,
  signOutCognito,
};
