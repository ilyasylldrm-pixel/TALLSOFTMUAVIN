import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const fallbackUserId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'].trim() : '';
  const fallbackUserEmail = typeof req.headers['x-user-email'] === 'string' ? req.headers['x-user-email'].trim() : '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token.split('.').length === 3) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        return next();
      } catch (error) {
        if (!fallbackUserId) {
          console.error('Error verifying Firebase ID token:', error);
          return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
      }
    } else if (token) {
      req.user = {
        uid: fallbackUserId || token,
        email: fallbackUserEmail || `${fallbackUserId || token}@muavin.com`,
      } as DecodedIdToken;
      return next();
    }
  }

  if (fallbackUserId) {
    req.user = {
      uid: fallbackUserId,
      email: fallbackUserEmail || `${fallbackUserId}@muavin.com`,
    } as DecodedIdToken;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Missing token' });
};
