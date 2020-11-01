export interface SdpMessage {
    signalingId: string;
    description: RTCSessionDescriptionInit;
    displayName: string;
}