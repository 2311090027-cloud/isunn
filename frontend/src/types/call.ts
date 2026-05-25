export type CallType = "audio" | "video";

export type CallStatus =
  | "idle"       // không có cuộc gọi nào
  | "calling"    // đang đổ chuông, chờ bên kia bắt máy
  | "incoming"   // đang có cuộc gọi đến, chưa bắt
  | "active"     // đang trong cuộc gọi
  | "ended";     // cuộc gọi kết thúc

export interface CallParticipant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ActiveCall {
  callId: string;
  callType: CallType;
  conversationId: string;
  status: CallStatus;
  caller: CallParticipant;      // người khởi tạo cuộc gọi
  remoteUser: CallParticipant;  // người còn lại (để hiển thị UI)
  startedAt?: number;
}