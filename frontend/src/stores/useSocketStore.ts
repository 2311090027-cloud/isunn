import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      try {
        useChatStore.getState().addConvo(conversation);
        socket.emit("join-conversation", conversation._id);
        console.log("New group chat received:", conversation._id);
      } catch (error) {
        console.error("Error handling new-group event:", error);
      }
    });

    // group deleted
    socket.on("group-deleted", ({ conversationId }) => {
      try {
        const chatStore = useChatStore.getState();
        chatStore.set = (updater: any) => {
          updater((state: any) => ({
            conversations: state.conversations.filter(
              (c: any) => c._id !== conversationId
            ),
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId,
          }));
        };
        console.log("Group chat deleted:", conversationId);
      } catch (error) {
        console.error("Error handling group-deleted event:", error);
      }
    });

    // ── Nhận cuộc gọi đến ──────────────────────────────────────────────
    socket.on("call:incoming", ({ callId, callType, conversationId, caller }) => {
      useCallStore.getState().setActiveCall({
        callId,
        callType,
        conversationId,
        status: "incoming",
        caller,
        remoteUser: caller,
      });
    });

    // ── Người gọi biết bên kia đã bắt máy ─────────────────────────────
    socket.on("call:accepted", ({ callId, acceptedBy }) => {
      const current = useCallStore.getState().activeCall;
      if (!current || current.callId !== callId) return;

      useCallStore.getState().setActiveCall({
        ...current,
        status: "active",
        remoteUser: acceptedBy,
      });
    });

    // ── Cuộc gọi kết thúc (từ bất kỳ phía nào) ────────────────────────
    socket.on("call:ended", ({ callId }) => {
      const current = useCallStore.getState().activeCall;
      if (!current || current.callId !== callId) return;

      useCallStore.getState().cleanup();
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));