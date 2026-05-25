import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import UserAvatar from "@/components/chat/UserAvatar";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const IncomingCallBanner = () => {
  const { activeCall, setActiveCall, cleanup } = useCallStore();
  const { socket } = useSocketStore();

  // Chỉ hiển thị khi đang có cuộc gọi đến chưa bắt máy
  if (!activeCall || activeCall.status !== "incoming") return null;

  const handleAccept = () => {
    // Báo server biết mình đã accept
    socket?.emit("call:accept", { callId: activeCall.callId });
    // Cập nhật status trong store → sẽ trigger CallWindow hiển thị
    setActiveCall({ ...activeCall, status: "active" });
  };

  const handleReject = () => {
    // Báo server biết mình từ chối
    socket?.emit("call:reject", {
      callId: activeCall.callId,
      reason: "rejected",
    });
    // Dọn dẹp state
    cleanup();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border border-border rounded-xl shadow-xl p-4 flex items-center gap-3 w-80">
      {/* Avatar người gọi */}
      <UserAvatar
        type="sidebar"
        name={activeCall.caller.displayName}
        avatarUrl={activeCall.caller.avatarUrl || undefined}
      />

      {/* Thông tin */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {activeCall.caller.displayName}
        </p>
        <p className="text-sm text-muted-foreground">
          {activeCall.callType === "audio" ? "Cuộc gọi thoại" : "Cuộc gọi video"}
        </p>
      </div>

      {/* Nút từ chối */}
      <Button
        size="icon"
        variant="destructive"
        className="rounded-full shrink-0"
        onClick={handleReject}
      >
        <PhoneOff className="h-4 w-4" />
      </Button>

      {/* Nút bắt máy */}
      <Button
        size="icon"
        className="rounded-full shrink-0 bg-green-500 hover:bg-green-600 text-white"
        onClick={handleAccept}
      >
        <Phone className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default IncomingCallBanner;