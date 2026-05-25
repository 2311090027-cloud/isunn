import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: socketId}
const activeCalls = new Map(); // {callId: { callId, callType, conversationId, initiatorId, participants[] }}

io.on("connection", async (socket) => {
  const user = socket.user;

  // console.log(`${user.displayName} online với socket ${socket.id}`);

  onlineUsers.set(user._id.toString(), socket.id);

  io.emit("online-users", Array.from(onlineUsers.keys()));

  try {
    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach((id) => {
      socket.join(id.toString());
    });
  } catch (error) {
    console.error("Error joining conversations on connect:", error);
  }

  socket.join(user._id.toString());

  socket.on("join-conversation", (conversationId) => {
    if (conversationId) {
      socket.join(conversationId.toString());
    }
  });
// ── VOICE CALL: Người gọi khởi tạo cuộc gọi 
socket.on("call:initiate", ({ conversationId, callType, targetUserIds }) => {
  // Tạo ID duy nhất cho cuộc gọi này
  const callId = `${conversationId}_${Date.now()}`;

  // Lưu thông tin cuộc gọi vào memory
  activeCalls.set(callId, {
    callId,
    callType,            // "audio" hoặc "video"
    conversationId,
    initiatorId: user._id.toString(),
    participants: [user._id.toString()],
    startedAt: Date.now(),
  });

  // Gửi thông báo "đang có cuộc gọi đến" cho từng người nhận
  targetUserIds.forEach((targetUserId) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:incoming", {
        callId,
        callType,
        conversationId,
        caller: {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
        },
      });
    }
  });

  // Báo lại cho người gọi biết callId để lưu vào store
  socket.emit("call:initiated", { callId });
});

// ── VOICE CALL: Người nhận chấp nhận cuộc gọi 
socket.on("call:accept", ({ callId }) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  // Thêm người nhận vào danh sách participants
  call.participants.push(user._id.toString());

  // Báo cho người gọi biết có người vừa bắt máy
  const initiatorSocketId = onlineUsers.get(call.initiatorId);
  if (initiatorSocketId) {
    io.to(initiatorSocketId).emit("call:accepted", {
      callId,
      acceptedBy: {
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      },
    });
  }
});

// ── VOICE CALL: Từ chối / Huỷ cuộc gọi 
socket.on("call:reject", ({ callId, reason }) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  // Thông báo cho tất cả mọi người liên quan
  const notifyIds = [...new Set([...call.participants, call.initiatorId])];
  notifyIds.forEach((uid) => {
    const sid = onlineUsers.get(uid);
    if (sid) {
      io.to(sid).emit("call:ended", { callId, reason: reason || "rejected" });
    }
  });

  activeCalls.delete(callId);
});

// ── VOICE CALL: Kết thúc cuộc gọi đang active 
socket.on("call:end", ({ callId }) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  const notifyIds = [...new Set([...call.participants, call.initiatorId])];
  notifyIds.forEach((uid) => {
    const sid = onlineUsers.get(uid);
    if (sid) {
      io.to(sid).emit("call:ended", { callId, reason: "ended" });
    }
  });

  activeCalls.delete(callId);
});

// ── WEBRTC SIGNALLING: Relay Offer 
// Server chỉ chuyển tiếp gói tin, không xử lý nội dung
socket.on("webrtc:offer", ({ callId, targetUserId, offer }) => {
  const targetSocketId = onlineUsers.get(targetUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("webrtc:offer", {
      callId,
      fromUserId: user._id.toString(),
      offer,
    });
  }
});

// ── WEBRTC SIGNALLING: Relay Answer 
socket.on("webrtc:answer", ({ callId, targetUserId, answer }) => {
  const targetSocketId = onlineUsers.get(targetUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("webrtc:answer", {
      callId,
      fromUserId: user._id.toString(),
      answer,
    });
  }
});

// ── WEBRTC SIGNALLING: Relay ICE Candidate 
socket.on("webrtc:ice", ({ callId, targetUserId, candidate }) => {
  const targetSocketId = onlineUsers.get(targetUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("webrtc:ice", {
      callId,
      fromUserId: user._id.toString(),
      candidate,
    });
  }
});

  socket.on("disconnect", () => {
    onlineUsers.delete(user._id.toString());
    io.emit("online-users", Array.from(onlineUsers.keys()));
    /* console.log(`socket disconnected: ${socket.id}`); */
  });
});

export { io, app, server };
