import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import UserAvatar from "@/components/chat/UserAvatar";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

const OutgoingCallOverlay = () => {
  const { activeCall, cleanup } = useCallStore();
  const { socket } = useSocketStore();

  if (!activeCall || activeCall.status !== "calling") return null;

  const handleCancel = () => {
    socket?.emit("call:reject", {
      callId: activeCall.callId,
      reason: "cancelled",
    });
    cleanup();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
      {/* Vòng tròn animation "đang đổ chuông" */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <UserAvatar
          type="profile"
          name={activeCall.remoteUser.displayName}
          avatarUrl={activeCall.remoteUser.avatarUrl || undefined}
        />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          {activeCall.remoteUser.displayName}
        </h2>
        <p className="text-muted-foreground mt-1">Đang gọi...</p>
      </div>

      {/* Nút huỷ gọi */}
      <Button
        size="icon"
        variant="destructive"
        className="h-16 w-16 rounded-full"
        onClick={handleCancel}
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default OutgoingCallOverlay;