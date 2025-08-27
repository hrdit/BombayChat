import { Router } from "express";
import { authMiddleware } from "../auth";
import { prisma } from "../db";

const r = Router();

// Ensure a global "Public" conversation exists and that the caller is a member
r.post("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;

  const conv = await prisma.$transaction(async (tx) => {
    let pub = await tx.conversation.findFirst({
      where: { isGroup: true, title: "Public" },
      select: { id: true, isGroup: true, title: true }
    });
    if (!pub) {
      pub = await tx.conversation.create({
        data: { isGroup: true, title: "Public" },
        select: { id: true, isGroup: true, title: true }
      });
    }
    await tx.membership.upsert({
      where: { userId_conversationId: { userId, conversationId: pub.id } },
      create: { userId, conversationId: pub.id },
      update: {}
    });
    return pub;
  });

  res.json(conv);
});

export default r;
