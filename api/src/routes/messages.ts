import { Router } from "express";
import { authMiddleware } from "../auth";
import { prisma } from "../db";

const r = Router();

r.get("/:id/messages", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  const member = await prisma.membership.findFirst({ where: { conversationId: id, userId } });
  if (!member) return res.status(403).json({ error: "forbidden" });

  const msgs = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, conversationId: true, authorId: true, body: true, createdAt: true,
      author: { select: { username: true } }
    }
  });
  res.json(msgs);
});

r.post("/:id/messages", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  const member = await prisma.membership.findFirst({ where: { conversationId: id, userId } });
  if (!member) return res.status(403).json({ error: "forbidden" });

  const { body, attachmentUrl } = req.body || {};
  const msg = await prisma.message.create({
    data: { conversationId: id, authorId: userId, body: body ?? null, attachmentUrl: attachmentUrl ?? null },
    select: {
      id: true, conversationId: true, authorId: true, body: true, createdAt: true,
      author: { select: { username: true } }
    }
  });

  const io = (req.app.get("io") as import("socket.io").Server);
  // existing conv room (for users already joined)
  io.to(`conv:${id}`).emit("message:new", msg);
  // notify all members via their personal rooms (covers users not yet joined)
  const members = await prisma.membership.findMany({ where: { conversationId: id }, select: { userId: true } });
  members.forEach(m => io.to(`user:${m.userId}`).emit("message:new", msg));

  res.status(201).json(msg);
});

export default r;
