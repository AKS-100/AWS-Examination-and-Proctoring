import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../../config/env.js';

/**
 * AWS Cognito JWT Verifier Service
 * Validates Cognito JWTs cryptographically using Cognito's public JWKS.
 * Supports both active user pool (ap-south-1_cu6lzvd5M) and transitional Amplify pool (ap-south-1_zSvNBA2w9).
 */

const KNOWN_POOLS = [
  {
    userPoolId: 'ap-south-1_cu6lzvd5M',
    clientId: '7d25hpuqb2cgv0fc3jljv3s9s5',
    tokenUse: null,
  },
  {
    userPoolId: 'ap-south-1_zSvNBA2w9',
    clientId: '1oqqmtfarh9pojfgfupblu803h',
    tokenUse: null,
  },
];

let multiVerifier = null;

export const getCognitoVerifier = () => {
  if (!multiVerifier) {
    const pools = [...KNOWN_POOLS];
    if (env.AWS_COGNITO_USER_POOL_ID && env.AWS_COGNITO_CLIENT_ID) {
      if (!pools.some((p) => p.userPoolId === env.AWS_COGNITO_USER_POOL_ID)) {
        pools.unshift({
          userPoolId: env.AWS_COGNITO_USER_POOL_ID,
          clientId: env.AWS_COGNITO_CLIENT_ID,
          tokenUse: null,
        });
      }
    }
    multiVerifier = CognitoJwtVerifier.create(pools);
  }
  return multiVerifier;
};

/**
 * Verifies a Cognito token and returns decoded verified claims.
 */
export const verifyCognitoToken = async (token) => {
  const verifier = getCognitoVerifier();
  return await verifier.verify(token);
};

export default {
  getCognitoVerifier,
  verifyCognitoToken,
};
