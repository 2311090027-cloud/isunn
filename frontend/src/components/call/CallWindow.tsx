import { useEffect, useRef } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import UserAvatar from "@/components/chat/UserAvatar";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff } from "lucide-react";

const CallWindow = () => {
  const { activeCall, remoteStream, localStream, isMuted, toggleMute, cleanup } = useCallStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { createOffer } = useWebRTC();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Gắn remote stream
  useEffect(() => {
    if (!remoteStream) return;
    if (activeCall?.callType === "video" && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.callType]);

  // Gắn local stream (camera của mình — hiện góc nhỏ)
  useEffect(() => {
    if (localStream && localVideoRef.current && activeCall?.callType === "video") {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.callType]);

  // Người gọi tạo offer sau khi bên kia bắt máy
  useEffect(() => {
    if (activeCall?.status === "active" && activeCall.caller._id === user?._id) {
      createOffer(activeCall.remoteUser._id, activeCall.callId);
    }
  }, [activeCall?.status]);

  const handleEndCall = () => {
    socket?.emit("call:end", { callId: activeCall?.callId });
    cleanup();
  };

  if (!activeCall || activeCall.status !== "active") return null;

  const isVideo = activeCall.callType === "video";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Audio (dùng cho voice call) */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Video call */}
      {isVideo ? (
        <div className="relative w-full h-full">
          {/* Video đối phương — full màn hình */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Video của mình — góc nhỏ dưới phải */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-4 w-32 h-44 object-cover rounded-xl border-2 border-white"
          />

          {/* Tên đối phương */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-center">
            <p className="text-lg font-semibold drop-shadow">{activeCall.remoteUser.displayName}</p>
            <p className="text-sm opacity-75">{remoteStream ? "Đã kết nối" : "Đang kết nối..."}</p>
          </div>
        </div>
      ) : (
        /* Voice call — hiện avatar */
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <UserAvatar
              type="profile"
              name={activeCall.remoteUser.displayName}
              avatarUrl={activeCall.remoteUser.avatarUrl || undefined}
            />
            {remoteStream && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">{activeCall.remoteUser.displayName}</h2>
            <p className="text-gray-400 mt-1">{remoteStream ? "Đã kết nối" : "Đang kết nối..."}</p>
          </div>
        </div>
      )}

      {/* Thanh điều khiển — luôn hiện ở dưới */}
      <div className={`flex items-center gap-6 ${isVideo ? "absolute bottom-8" : "mt-8"}`}>
        <Button
          size="icon"
          variant="outline"
          className="h-14 w-14 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={toggleMute}
          title={isMuted ? "Bật mic" : "Tắt mic"}
        >
          {isMuted ? <MicOff className="h-5 w-5 text-red-400" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          size="icon"
          variant="destructive"
          className="h-16 w-16 rounded-full"
          onClick={handleEndCall}
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default CallWindow;