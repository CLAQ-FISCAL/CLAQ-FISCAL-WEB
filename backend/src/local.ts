import http from 'http';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { openValue, sealValue } from './lib/crypto';
import { db } from './lib/db';
import { createHandler } from './router';

const PORT = Number(process.env.PORT) || 4000;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

let verifier: any = null;

async function initVerifier() {
  if (COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID) {
    try {
      verifier = CognitoJwtVerifier.create({
        userPoolId: COGNITO_USER_POOL_ID,
        tokenUse: 'access',
        clientId: COGNITO_CLIENT_ID,
      });
      console.log(`[auth] Cognito verifier created for pool ${COGNITO_USER_POOL_ID} (JWKS fetches lazily)`);
    } catch (err: any) {
      console.warn(`[auth] Failed to create Cognito verifier: ${err.message}`);
      verifier = null;
    }
  } else {
    console.warn('[auth] No COGNITO config — all requests will be unauthenticated');
  }
}

const handler = createHandler(db, { sealValue, openValue });

async function getCognitoClaims(authorization: string | undefined): Promise<Record<string, unknown>> {
  if (!verifier || !authorization) return {};
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return {};
  try {
    const payload = await verifier.verify(token);
    return payload as Record<string, unknown>;
  } catch (err: any) {
    console.warn(`[auth] JWT verify failed: ${err.message?.slice(0, 100)}`);
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const method = req.method || 'GET';
    const path = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': req.headers['origin'] || '*',
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization, X-Tenant-Id',
        'access-control-max-age': '86400',
      });
      res.end();
      return;
    }

    // Collect body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 100000) { res.writeHead(413); res.end('Too large'); return; }
    }

    // Parse query string
    const query: Record<string, string | undefined> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });

    // Extract auth
    const authorization = req.headers['authorization'];
    const claims = await getCognitoClaims(authorization);

    // Build synthetic Lambda event
    const event = {
      requestContext: {
        requestId: `local_${Date.now()}`,
        http: { method, path },
        authorizer: Object.keys(claims).length > 0 ? { jwt: { claims } } : undefined,
      },
      rawPath: path,
      rawBody: body,
      headers: req.headers as Record<string, string>,
      queryStringParameters: Object.keys(query).length > 0 ? query : undefined,
      body: body || undefined,
    };

    const result = await handler(event as any);

    const origin = req.headers['origin'] || '*';
    res.writeHead(result.statusCode, {
      ...result.headers,
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization, X-Tenant-Id',
    });
    res.end(result.body);
  } catch (err) {
    console.error('[server] Unhandled:', err);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ code: 'INTERNAL', message: 'Unexpected server error.' }));
  }
});

async function main() {
  await initVerifier();
  server.listen(PORT, () => {
    console.log(`[server] CLAQ Backend running on http://localhost:${PORT}`);
    console.log(`[server] Health: http://localhost:${PORT}/v1/health`);
    console.log(`[server] Cognito: ${COGNITO_USER_POOL_ID || 'DISABLED'}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
