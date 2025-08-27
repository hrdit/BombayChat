import jwt from "jsonwebtoken";
import type { Response, Request, NextFunction } from "express";

const COOKIE = "access";
const MAX_AGE = 60 * 60 * 24 * 7;

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: `${MAX_AGE}s` });
}
export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: MAX_AGE * 1000, path: "/" });
}
export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try { const p = jwt.verify(token, process.env.JWT_SECRET!) as any; (req as any).userId = p.sub as string; next(); }
  catch { return res.status(401).json({ error: "unauthorized" }); }
}
