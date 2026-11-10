import type { Request, Response, NextFunction } from 'express';
import { readCookie, SESSION_COOKIE, verifySession, type SessionUser } from '../lib/serverAuth.ts';

export interface AuthRequest extends Request {
  user?: SessionUser;
}

/** İstekteki oturumu (çerez veya `Authorization: Bearer ms1...`) çözer. */
export function resolveSessionUser(req: Request): SessionUser | null {
  const fromCookie = verifySession(readCookie(req.headers.cookie, SESSION_COOKIE));
  if (fromCookie) return fromCookie;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifySession(authHeader.slice(7).trim());
  }
  return null;
}

/**
 * Geçerli bir sunucu oturumu ister. Eskiden kabul edilen `x-user-id` başlığı ve
 * imzasız Bearer değerleri artık kabul edilmez.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Oturum bulunamadı veya süresi doldu. Lütfen tekrar giriş yapın.' });
  }
  req.user = user;
  return next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user || resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Oturum bulunamadı veya süresi doldu. Lütfen tekrar giriş yapın.' });
  }
  if (!user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Bu işlem için Sistem Yöneticisi yetkisi gerekir.' });
  }
  req.user = user;
  return next();
};

/** Kullanıcının belirtilen şirketin verisine erişip erişemeyeceği. */
export function canAccessCompany(user: SessionUser | undefined, companyId: string): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const own = user.companyId || 'comp_default';
  return companyId === own;
}
