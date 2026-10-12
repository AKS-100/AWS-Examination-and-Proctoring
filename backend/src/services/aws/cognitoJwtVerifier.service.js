import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../../config/env.js';

/**
 * AWS Cognito JWT Verifier Service
 * Validates Cognito JWTs cryptographically using Cognito's public JWKS.
 * Checks signature, expiration, issuer (https://cognito-idp.{region}.amazonaws.com/{poolId}),
 * and client ID audience.
 */

let verifier = null;

export const getCognitoVerifier = () => {
  if (!verifier && env.AWS_COGNITO_USER_POOL_ID && env.AWS_COGNITO_CLIENT_ID) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: env.AWS_COGNITO_USER_POOL_ID,
      tokenUse: null, // Verify both ID and Access tokens safely
      clientId: env.AWS_COGNITO_CLIENT_ID,
    });
  }
  return verifier;
};

/**
 * Verifies a Cognito token and returns decoded verified claims.
 * Throws an error if invalid, expired, or signature does not match Cognito JWKS.
 */
export const verifyCognitoToken = async (token) => {
  const v = getCognitoVerifier();
  if (!v) {
    throw new Error('Cognito JWT Verifier not initialized (missing User Pool or Client ID).');
  }
  return await v.verify(token);
};

export default {
  getCognitoVerifier,
  verifyCognitoToken,
};
