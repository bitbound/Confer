import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { PeerConnection } from "../interfaces/PeerConnection";
import { SessionDto } from "../interfaces/SessionDto";

class SignalingService {
  private connection?: HubConnection;
  private initialized: boolean = false;
  private peerConnections: PeerConnection[] = [];
  
  public sessionInfo?: SessionDto;

  public get state(): HubConnectionState | undefined {
    return this.connection && this.connection.state;
  }

  public connect(onStateChange: (state:HubConnectionState) => void): Promise<boolean> {
    if (this.initialized) {
      return Promise.resolve(true);
    }

    this.initialized = true;
    return new Promise<boolean>(resolve => {

      if (this.connection) {
        this.connection.stop();
      }

      this.connection = new HubConnectionBuilder()
        .withUrl("/signaling")
        .withAutomaticReconnect()
        .build();

      this.connection.on("sdp", (peerId: string, description: RTCSessionDescriptionInit) => {
        this.receiveSdp(peerId, description);
      });

      this.connection.onclose(() => onStateChange(HubConnectionState.Disconnected));
      this.connection.onreconnecting(() => onStateChange(HubConnectionState.Reconnecting));
      this.connection.onreconnected(() => onStateChange(HubConnectionState.Connected));

      this.connection.start()
        .then(() => {
          onStateChange(HubConnectionState.Connected);
          resolve(true);
        })
        .catch(reason => {
          console.error(reason);
          onStateChange(HubConnectionState.Disconnected);
          resolve(false);
        });
    })
  }

  public getSessionInfo(sessionId: string) : Promise<SessionDto | undefined> {
    return this.connection?.invoke("GetSessionInfo", sessionId) || Promise.resolve(undefined);
  }
  
  private async receiveSdp(peerId: string, description: RTCSessionDescriptionInit) {
    if (description.type == "offer") {
      // TODO: Get TURN server from signaling connection.
      var pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun: stun.l.google.com:19302"
          },
          {
            urls: "stun: stun4.l.google.com:19302"
          }
        ]
      });
      await pc.setRemoteDescription(description);
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.connection?.invoke("SendSdp", pc.localDescription);
    }
    else {
      var peer = this.peerConnections.find(x=>x.peerId == peerId);
      if (!peer) {
        console.error(`Unable to find peer with ID ${peerId}.`);
        return;
      }
      await peer.peerConnection.setRemoteDescription(description);
    }
  }
}


export const Signaler = new SignalingService();