import { Router } from "express";
import { authMiddleware } from "../auth";
import { prisma } from "../db";

const r = Router();

// list my conversations
r.get("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const convs = await prisma.conversation.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, isGroup: true, title: true, createdAt: true }
  });
  res.json(convs);
});

// create conversation (by userIds)
r.post("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const { userIds = [], title, isGroup = false } = req.body || {};
  const memberIds: string[] = Array.from(new Set([userId, ...userIds]));
  if (memberIds.length < 2) return res.status(400).json({ error: "need_at_least_two_members" });
  const conv = await prisma.conversation.create({
    data: { isGroup, title: title ?? null, memberships: { create: memberIds.map(uid => ({ userId: uid })) } },
    select: { id: true, isGroup: true, title: true }
  });
  res.status(201).json(conv);
});

// create or get 1:1 DM by username
r.post("/dm", authMiddleware, async (req, res) => {
  const me = (req as any).userId as string;
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "missing_username" });

  const other = await prisma.user.findUnique({ where: { username } });
  if (!other) return res.status(404).json({ error: "user_not_found" });
  if (other.id === me) return res.status(400).json({ error: "cannot_dm_self" });

  const existing = await prisma.conversation.findFirst({
    where: { isGroup: false, memberships: { every: { userId: { in: [me, other.id] } } } },
    select: { id: true, title: true, isGroup: true }
  });
  const conv = existing ?? await prisma.conversation.create({
    data: { isGroup: false, title: null, memberships: { create: [{ userId: me }, { userId: other.id }] } },
    select: { id: true, title: true, isGroup: true }
  });

  // notify both users and join their sockets to the conv room
  const io = (req.app.get("io") as import("socket.io").Server);
  io.to(`user:${me}`).emit("conversation:new", conv);
  io.to(`user:${other.id}`).emit("conversation:new", conv);
  io.sockets.sockets.forEach(s => {
    const uid = (s.data as any).userId as string;
    if (uid === me || uid === other.id) s.join(`conv:${conv.id}`);
  });

  res.status(existing ? 200 : 201).json(conv);
});

export default r;
