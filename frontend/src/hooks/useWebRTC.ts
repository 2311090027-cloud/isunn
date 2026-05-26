import { useEffect, useRef, useCallback } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: "turn:freeturn.net:3478",
      username: "free",
      credential: "free",
    },
    {
      urls: "turns:freeturn.net:5349",
      username: "free",
      credential: "free",
    },
  ],
};

export function useWebRTC() {
  const { socket } = useSocketStore();
  const { activeCall, setLocalStream, setRemoteStream, setPeerConnection, cleanup } = useCallStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: activeCall?.callType === "video",
    });
    setLocalStream(stream);
    return stream;
  }, [setLocalStream, activeCall?.callType]);

  const createPeerConnection = useCallback(
    (targetUserId: string, callId: string, stream: MediaStream) => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      pendingCandidates.current = [];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      setPeerConnection(pc);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc:ice", {
            callId,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("WebRTC connection state:", pc.connectionState);
      };

      return pc;
    },
    [socket, setRemoteStream, setPeerConnection]
  );

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

  useEffect(() => {
    if (!socket) return;

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

      // Xử lý pending candidates
      for (const candidate of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { callId, targetUserId: fromUserId, answer });
    };

    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState === "closed") return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Xử lý pending candidates
      for (const candidate of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current = [];
    };

    const handleIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState === "closed") return;

      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice", handleIce);

    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
    };
  }, [socket, getLocalStream, createPeerConnection]);

  return { createOffer, cleanup };
}