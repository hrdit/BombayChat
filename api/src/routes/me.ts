import { Router } from "express";
import { authMiddleware } from "../auth";
import { prisma } from "../db";

const r = Router();

r.get("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id:true, email:true, username:true, avatarUrl:true, bio:true }
  });
  res.json(me);
});

r.patch("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const { email, username, avatarUrl, bio } = req.body || {};
  const data: any = {};
  if (typeof email === "string" && email.trim()) data.email = email.trim();
  if (typeof username === "string" && username.trim()) data.username = username.trim();
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl === null ? null : String(avatarUrl);
  if (bio !== undefined) data.bio = bio === null ? null : String(bio);
  try {
    const me = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id:true, email:true, username:true, avatarUrl:true, bio:true }
    });
    res.json(me);
  } catch {
    return res.status(409).json({ error: "email_or_username_taken" });
  }
});

export default r;
