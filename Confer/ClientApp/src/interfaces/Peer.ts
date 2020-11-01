export interface Peer {
    signalingId: string;
    displayName?: string;
    remoteMediaStream?: MediaStream;
    peerConnection?: RTCPeerConnection;
    localSdp?: RTCSessionDescriptionInit;
}