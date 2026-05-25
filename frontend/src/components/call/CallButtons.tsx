import { Phone, Video } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { Button } from "@/components/ui/button";

interface CallButtonsProps {
  chat: Conversation;
}

const CallButtons = ({ chat }: CallButtonsProps) => {
  const { activeCall, setActiveCall } = useCallStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  if (!user || chat.type !== "direct") return null;

  const otherUser = chat.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const initiateCall = (callType: "audio" | "video") => {
    if (activeCall) return; // đang có cuộc gọi rồi

    socket?.emit("call:initiate", {
      conversationId: chat._id,
      callType,
      targetUserIds: [otherUser._id],
    });

    socket?.once("call:initiated", ({ callId }: { callId: string }) => {
      setActiveCall({
        callId,
        callType,
        conversationId: chat._id,
        status: "calling",
        caller: {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
        },
        remoteUser: {
          _id: otherUser._id,
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl ?? null,
        },
      });
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={!!activeCall}
        onClick={() => initiateCall("audio")}
        title="Gọi thoại"
      >
        <Phone className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!!activeCall}
        onClick={() => initiateCall("video")}
        title="Gọi video"
      >
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default CallButtons;