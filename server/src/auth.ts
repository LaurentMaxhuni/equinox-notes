import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const TOKEN_AUDIENCE = 'equinox';
const TOKEN_ISSUER = 'equinox-server';
const TOKEN_EXPIRATION = '7d';

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
});

type Credentials = z.infer<typeof credentialsSchema>;

export type AuthUser = {
  id: string;
  username: string;
};

const toUser = (username: string): AuthUser => ({
  id: crypto.createHash('sha256').update(username).digest('hex').slice(0, 16),
  username,
});

const signToken = (user: AuthUser) =>
  jwt.sign(
    {
      sub: user.id,
      username: user.username,
      aud: TOKEN_AUDIENCE,
      iss: TOKEN_ISSUER,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION, algorithm: 'HS256' },
  );

const handleAuthSuccess = (user: AuthUser) => ({
  token: signToken(user),
  user,
});

const mapZodError = (error: z.ZodError<Credentials>) => {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') {
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field]?.push(issue.message);
    }
  }
  return fieldErrors;
};

const credentialsHandler: RequestHandler = (req, res) => {
  const result = credentialsSchema.safeParse(req.body ?? {});
  if (!result.success) {
    res.status(400).json({ error: mapZodError(result.error) });
    return;
  }

  const user = toUser(result.data.username);
  res.json(handleAuthSuccess(user));
};

export type AuthenticatedRequest = Request & { user?: AuthUser };

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('authorization') ?? req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      audience: TOKEN_AUDIENCE,
      issuer: TOKEN_ISSUER,
    }) as jwt.JwtPayload;

    const sub = payload.sub;
    const username = payload.username;
    if (typeof sub !== 'string' || typeof username !== 'string') {
      throw new Error('Invalid payload');
    }

    (req as AuthenticatedRequest).user = { id: sub, username };
    next();
  } catch (error) {
    console.warn('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const createAuthRouter = () => {
  const router = Router();

  router.post('/register', credentialsHandler);
  router.post('/login', credentialsHandler);
  router.get('/me', requireAuth, (req: Request, res: Response) => {
    const authenticated = (req as AuthenticatedRequest).user;
    res.json({ user: authenticated });
  });

  return router;
};
