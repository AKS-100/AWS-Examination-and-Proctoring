import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById, syncCognitoIdentity } from '../services/user.service.js';
import { verifyCognitoToken } from '../services/aws/cognitoJwtVerifier.service.js';

/**
 * Authentication Middleware
 * 1. Validates real AWS Cognito JWTs using Cognito JWKS signature, expiration, issuer & audience.
 * 2. Synchronizes verified Cognito claims (sub, email) with user profile.
 * 3. Gracefully supports legacy application session tokens during migration.
 */
export const protect = async (req, res, next) => {
  let token = null;

  // Extract from Authorization header (Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Please provide a valid Bearer token.',
        statusCode: 401,
      },
    });
  }

  // Strategy 1: Validate as AWS Cognito JWT (Signature verified against AWS JWKS)
  try {
    const cognitoClaims = await verifyCognitoToken(token);

    const sub = cognitoClaims.sub;
    const email = cognitoClaims.email || cognitoClaims['cognito:username'] || cognitoClaims.username;
    const name = cognitoClaims.name || cognitoClaims['custom:name'] || (email ? email.split('@')[0] : 'User');
    const groups = cognitoClaims['cognito:groups'] || [];
    const customRole = cognitoClaims['custom:role'];

    // Synchronize or find user based on verified Cognito Sub
    const user = await syncCognitoIdentity({
      sub,
      email,
      name,
      roleGroup: customRole || groups[0],
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'This user account is inactive or has been disabled.',
          statusCode: 403,
        },
      });
    }

    req.user = user;
    req.cognitoClaims = cognitoClaims;
    return next();
  } catch (cognitoErr) {
    // If not a Cognito token, attempt Strategy 2: Legacy/Internal JWT verification for backward compatibility
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await findUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'The user belonging to this token no longer exists.',
            statusCode: 401,
          },
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'This user account has been deactivated.',
            statusCode: 403,
          },
        });
      }

      req.user = user;
      return next();
    } catch (legacyErr) {
      if (cognitoErr?.name === 'JwtExpiredError' || legacyErr?.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Session has expired. Please sign in again.',
            statusCode: 401,
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or unverified authentication token. Please sign in with Amazon Cognito.',
          statusCode: 401,
        },
      });
    }
  }
};

export default { protect };
