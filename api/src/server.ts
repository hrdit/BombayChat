import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import convRoutes from "./routes/conversations";
import msgRoutes from "./routes/messages";
import publicRoutes from "./routes/public";
import { prisma } from "./db";

console.log("[BOOT] starting api...");

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/conversations", convRoutes);
app.use("/api/conversations", msgRoutes);
app.use("/api/conversations/public", publicRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }
});
app.set("io", io);

// cookie-JWT auth for sockets
io.use((socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const token = cookies["access"];
    if (!token) return next(new Error("unauthorized"));
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (socket.data as any).userId = payload.sub as string;
    next();
  } catch { next(new Error("unauthorized")); }
});

io.on("connection", async (socket) => {
  const userId = (socket.data as any).userId as string;

  // auto-join all existing conv rooms
  const convs = await prisma.membership.findMany({ where: { userId }, select: { conversationId: true }});
  convs.forEach(c => socket.join(`conv:${c.conversationId}`));

  // allow joining newly created convs from client
  socket.on("conv:join", async (convId: string) => {
    try {
      const m = await prisma.membership.findFirst({ where: { conversationId: convId, userId } });
      if (m) socket.join(`conv:${convId}`);
    } catch {}
  });
});

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, "0.0.0.0", () => console.log(`[UP] API on http://localhost:${PORT}`));
