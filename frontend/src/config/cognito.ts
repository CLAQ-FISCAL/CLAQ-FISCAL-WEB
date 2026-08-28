// CLAQ Fiscal Alert — Cognito Configuration (af-south-1)
// Gateway: https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1 (stage v1)
// Issuer: https://cognito-idp.af-south-1.amazonaws.com/af-south-1_d2nFLYfwU
// JWKS: https://cognito-idp.af-south-1.amazonaws.com/af-south-1_d2nFLYfwU/.well-known/jwks.json
// Hosted UI: https://demo-auth.auth.af-south-1.amazoncognito.com
//
// CRITICAL: Gateway uses 401 Authorizer on all routes except GET /v1/health.
// Auth NEVER goes through Gateway /v1/auth/* — use Cognito IDP directly via Amplify SRP.
// Stage is /v1 (NOT /api/v1). Local backend uses /api/v1 — frontend must handle both via VITE_API_URL.

import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'af-south-1_d2nFLYfwU';
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '3jrv9m1l2o6iqjiq8qhg8tsj48';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      // identityPoolId not used
      // Allow SRP auth flow; Amplify v6 defaults to USER_SRP_AUTH
    },
  },
});

export const cognitoConfig = {
  userPoolId,
  userPoolClientId,
  region: 'af-south-1',
  issuer: `https://cognito-idp.af-south-1.amazonaws.com/${userPoolId}`,
  jwksUri: `https://cognito-idp.af-south-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  // Gateway now is /v1; keep /api/v1 for local dev
  apiBaseUrl: import.meta.env.VITE_API_URL || 'https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1',
};
