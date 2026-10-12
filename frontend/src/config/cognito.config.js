/**
 * AWS Cognito OIDC Configuration for react-oidc-context & oidc-client-ts
 * User Pool: ap-south-1_zSvNBA2w9
 * App Client: 1oqqmtfarh9pojfgfupblu803h (adaptive-exam-proctoring)
 * Domain: https://ap-south-1zsvnba2w9.auth.ap-south-1.amazoncognito.com
 */

export const COGNITO_CLIENT_ID = '1oqqmtfarh9pojfgfupblu803h';
export const COGNITO_USER_POOL_ID = 'ap-south-1_zSvNBA2w9';
export const COGNITO_REGION = 'ap-south-1';
export const COGNITO_DOMAIN = 'https://ap-south-1zsvnba2w9.auth.ap-south-1.amazoncognito.com';

export const cognitoAuthConfig = {
  authority: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
  client_id: COGNITO_CLIENT_ID,
  redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/',
  response_type: 'code',
  scope: 'email openid phone',
  onSigninCallback: () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
};

export const COGNITO_HOSTED_LOGIN_URL = `${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(
  typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/'
)}`;

export const cognitoSignOutRedirect = () => {
  if (typeof window !== 'undefined') {
    const logoutUri = `${window.location.origin}/`;
    window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }
};
