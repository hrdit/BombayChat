import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { setAuthCookie, clearAuthCookie, signToken, authMiddleware } from "../auth";

const r = Router();

r.post("/register", async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) return res.status(400).json({ error: "missing_fields" });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, username, passwordHash } });
    return res.status(201).json({ id: user.id, email: user.email, username: user.username });
  } catch { return res.status(409).json({ error: "email_or_username_taken" }); }
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  const token = signToken(user.id);
  setAuthCookie(res, token);
  return res.json({ id: user.id, email: user.email, username: user.username });
});

r.post("/logout", (_req, res) => { clearAuthCookie(res); return res.json({ ok: true }); });

r.post("/change-password", authMiddleware as any, async (req: any, res) => {
  const userId = req.userId as string;
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "missing_fields" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_old_password" });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return res.json({ ok: true });
});

export default r;
