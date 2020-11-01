export interface Peer {
    signalingId: string;
    displayName?: string;
    mediaStream?: MediaStream;
    peerConnection?: RTCPeerConnection;
    localSdp?: RTCSessionDescriptionInit;
}