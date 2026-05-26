import { useEffect, useRef, useCallback } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";

// Cấu hình ICE servers — STUN giúp tìm địa chỉ IP public của peer
// Trong production, thêm TURN server để xử lý trường hợp NAT nghiêm ngặt
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export function useWebRTC() {
  const { socket } = useSocketStore();
  const {
    activeCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    cleanup,
  } = useCallStore();

  // Dùng ref để giữ RTCPeerConnection qua các lần render
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // ── Lấy stream microphone của người dùng ────────────────────────
  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: activeCall?.callType === "Video",
    });
    setLocalStream(stream);
    return stream;
  }, [setLocalStream]);

  // ── Tạo RTCPeerConnection ────────────────────────────────────────
  const createPeerConnection = useCallback(
    (targetUserId: string, callId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      setPeerConnection(pc);

      // Đưa các audio track của mình vào kết nối
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Khi nhận được audio track từ đầu kia
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Khi trình duyệt tìm được ICE candidate, gửi cho đầu kia qua socket
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc:ice", {
            callId,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Log trạng thái kết nối (hữu ích khi debug)
      pc.onconnectionstatechange = () => {
        console.log("WebRTC connection state:", pc.connectionState);
      };

      return pc;
    },
    [socket, setRemoteStream, setPeerConnection]
  );

  // ── Người GỌI: Tạo và gửi Offer ─────────────────────────────────
  // Gọi hàm này sau khi bên kia đã accept (status = "active")
  const createOffer = useCallback(
    async (targetUserId: string, callId: string) => {
      const stream = await getLocalStream();
      const pc = createPeerConnection(targetUserId, callId, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit("webrtc:offer", { callId, targetUserId, offer });
    },
    [socket, getLocalStream, createPeerConnection]
  );

  // ── Lắng nghe các WebRTC events từ socket ───────────────────────
  useEffect(() => {
    if (!socket) return;

    // Người NHẬN nhận được Offer → tạo Answer
    const handleOffer = async ({
      fromUserId,
      callId,
      offer,
    }: {
      fromUserId: string;
      callId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const stream = await getLocalStream();
      const pc = createPeerConnection(fromUserId, callId, stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        callId,
        targetUserId: fromUserId,
        answer,
      });
    };

    // Người GỌI nhận được Answer
    const handleAnswer = async ({
      answer,
    }: {
      answer: RTCSessionDescriptionInit;
    }) => {
      await pcRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    // Cả hai phía nhận ICE candidate từ đầu kia
    const handleIce = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice", handleIce);

    // Cleanup khi component unmount
    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
    };
  }, [socket, getLocalStream, createPeerConnection]);

  return { createOffer, cleanup };
}