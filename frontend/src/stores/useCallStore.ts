import { create } from "zustand";
import type { CallState } from "@/types/store";
import type { ActiveCall } from "@/types/call";

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,

  setActiveCall: (call: ActiveCall | null) => set({ activeCall: call }),

  setLocalStream: (stream: MediaStream | null) => set({ localStream: stream }),

  setRemoteStream: (stream: MediaStream | null) =>
    set({ remoteStream: stream }),

  setPeerConnection: (pc: RTCPeerConnection | null) =>
    set({ peerConnection: pc }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    // Bật/tắt từng audio track của stream local
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = isMuted; // nếu đang mute (enabled=false) thì bật lên, và ngược lại
    });
    set({ isMuted: !isMuted });
  },

  cleanup: () => {
    const { localStream, peerConnection } = get();
    // Dừng tất cả các track (giải phóng mic)
    localStream?.getTracks().forEach((track) => track.stop());
    // Đóng kết nối WebRTC
    peerConnection?.close();
    // Reset toàn bộ state
    set({
      activeCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
    });
  },
}));