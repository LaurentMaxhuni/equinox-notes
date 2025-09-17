import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const credentialsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9_]+$/, 'Username must be alphanumeric or underscore'),
  password: z.string().min(8).max(72),
});

type Credentials = z.infer<typeof credentialsSchema>;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
  token?: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

const signToken = (user: { id: string; username: string }) => {
  return jwt.sign(
    { sub: user.id, username: user.username, aud: 'equinox', iss: 'equinox-server' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' },
  );
};

const buildUser = (username: string) => {
  const id = createHash('sha256').update(username).digest('hex').slice(0, 16);
  return { id, username };
};

const respondWithAuth = (res: Response, user: { id: string; username: string }) => {
  const token = signToken(user);
  return res.json({ token, user });
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'equinox',
      issuer: 'equinox-server',
    }) as jwt.JwtPayload;

    if (!decoded || typeof decoded.sub !== 'string' || typeof decoded.username !== 'string') {
      throw new Error('Invalid token payload');
    }

    const user = {
      id: decoded.sub,
      username: decoded.username,
    };

    req.user = user;
    req.token = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const handleCredentials = (body: unknown): Credentials => {
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
};

export const authRouter = express.Router();

authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { username } = handleCredentials(req.body);
    const user = buildUser(username);
    return respondWithAuth(res, user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.flatten().fieldErrors });
    }
    return res.status(500).json({ error: 'Unable to register' });
  }
});

authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { username } = handleCredentials(req.body);
    const user = buildUser(username);
    return respondWithAuth(res, user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.flatten().fieldErrors });
    }
    return res.status(500).json({ error: 'Unable to login' });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  return res.json({ user: req.user });
});

export default authRouter;
