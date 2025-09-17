// @ts-nocheck
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const JWT_SECRET = (process.env && process.env.JWT_SECRET) ?? 'dev-secret-change-me';
const TOKEN_AUDIENCE = 'equinox';
const TOKEN_ISSUER = 'equinox-server';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const base64UrlEncode = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
};

const signToken = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', JWT_SECRET).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

const verifyToken = (token) => {
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Malformed token');
  }

  const [encodedHeader, encodedPayload, providedSignature] = segments;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac('sha256', JWT_SECRET).update(data).digest();
  const provided = Buffer.from(providedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error('Invalid signature');
  }

  const payloadRaw = base64UrlDecode(encodedPayload);
  const payload = JSON.parse(payloadRaw);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) {
    throw new Error('Token expired');
  }
  if (payload.aud !== TOKEN_AUDIENCE || payload.iss !== TOKEN_ISSUER) {
    throw new Error('Invalid audience or issuer');
  }
  if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') {
    throw new Error('Invalid payload');
  }

  return {
    id: payload.sub,
    username: payload.username,
  };
};

const usernameRegex = /^[A-Za-z0-9_]+$/;

const collectCredentialErrors = (input) => {
  const errors = {};

  if (!input || typeof input !== 'object') {
    errors.username = ['Username is required'];
    errors.password = ['Password is required'];
    return { ok: false, errors };
  }

  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  const usernameErrors = [];
  if (!username) {
    usernameErrors.push('Username is required');
  } else {
    if (username.length < 3) usernameErrors.push('Username must be at least 3 characters');
    if (username.length > 24) usernameErrors.push('Username must be at most 24 characters');
    if (!usernameRegex.test(username)) usernameErrors.push('Username must be alphanumeric or underscore');
  }

  const passwordErrors = [];
  if (!password) {
    passwordErrors.push('Password is required');
  } else {
    if (password.length < 8) passwordErrors.push('Password must be at least 8 characters');
    if (password.length > 72) passwordErrors.push('Password must be at most 72 characters');
  }

  if (usernameErrors.length) {
    errors.username = usernameErrors;
  }
  if (passwordErrors.length) {
    errors.password = passwordErrors;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, credentials: { username, password } };
};

const buildUser = (username) => {
  const id = createHash('sha256').update(username).digest('hex').slice(0, 16);
  return { id, username };
};

const respondWithAuth = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    username: user.username,
    aud: TOKEN_AUDIENCE,
    iss: TOKEN_ISSUER,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const token = signToken(payload);
  return { status: 200, body: { token, user } };
};

const unauthorized = { status: 401, body: { error: 'Invalid or expired token' } };

export const handleAuth = ({ method, path, headers, body }) => {
  if (method === 'POST' && path === '/auth/register') {
    const result = collectCredentialErrors(body);
    if (!result.ok) {
      return { status: 400, body: { error: result.errors } };
    }
    const user = buildUser(result.credentials.username);
    return respondWithAuth(user);
  }

  if (method === 'POST' && path === '/auth/login') {
    const result = collectCredentialErrors(body);
    if (!result.ok) {
      return { status: 400, body: { error: result.errors } };
    }
    const user = buildUser(result.credentials.username);
    return respondWithAuth(user);
  }

  if (method === 'GET' && path === '/auth/me') {
    const header = headers && (headers.authorization || headers.Authorization);
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return unauthorized;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return unauthorized;
    }

    try {
      const user = verifyToken(token);
      return { status: 200, body: { user } };
    } catch {
      return unauthorized;
    }
  }

  return { status: 404, body: { error: 'Not found' } };
};
