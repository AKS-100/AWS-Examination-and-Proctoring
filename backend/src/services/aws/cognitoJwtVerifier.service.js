import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../../config/env.js';

/**
 * AWS Cognito JWT Verifier Service
 * Validates Cognito JWTs cryptographically using Cognito's public JWKS.
 * Checks signature, expiration, issuer (https://cognito-idp.{region}.amazonaws.com/{poolId}),
 * and client ID audience.
 */

let verifier = null;
let fallbackVerifier = null;

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

export const getFallbackVerifier = () => {
  if (!fallbackVerifier) {
    fallbackVerifier = CognitoJwtVerifier.create({
      userPoolId: 'ap-south-1_zSvNBA2w9',
      tokenUse: null,
      clientId: '1oqqmtfarh9pojfgfupblu803h',
    });
  }
  return fallbackVerifier;
};

/**
 * Verifies a Cognito token and returns decoded verified claims.
 * Gracefully verifies against the active configured pool or institutional pool fallback.
 */
export const verifyCognitoToken = async (token) => {
  const v = getCognitoVerifier();
  if (v) {
    try {
      return await v.verify(token);
    } catch (primaryErr) {
      // If primary pool throws due to issuer/pool mismatch, try institutional fallback pool
      const fb = getFallbackVerifier();
      try {
        return await fb.verify(token);
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
  }

  const fb = getFallbackVerifier();
  return await fb.verify(token);
};

export default {
  getCognitoVerifier,
  getFallbackVerifier,
  verifyCognitoToken,
};
