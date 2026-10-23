/**
 * AWS Cognito OIDC Configuration for react-oidc-context & oidc-client-ts
 * User Pool: ap-south-1_cu6lzvd5M
 * App Client: 7d25hpuqb2cgv0fc3jljv3s9s5 (adaptive-exam-users)
 */

export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '7d25hpuqb2cgv0fc3jljv3s9s5';
export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_cu6lzvd5M';
export const COGNITO_REGION = 'ap-south-1';
export const COGNITO_DOMAIN = `https://${COGNITO_USER_POOL_ID.toLowerCase().replace('_', '')}.auth.${COGNITO_REGION}.amazoncognito.com`;

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
