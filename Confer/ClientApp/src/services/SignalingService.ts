import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { SdpMessage } from "../interfaces/SdpMessage";
import { SessionDto } from "../interfaces/SessionDto";
import { EventEmitterEx } from "../utils/EventEmitterEx";

class SignalingService {
  private connection?: HubConnection;
  private initialized: boolean = false;

  public readonly onConnectionStateChanged = new EventEmitterEx<HubConnectionState>();
  public readonly onSdpReceived = new EventEmitterEx<SdpMessage>();
  public readonly onPeerLeft = new EventEmitterEx<string>();
  
  public connect(): Promise<boolean> {
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

      this.connection.on("Sdp", (peerId: string, displayName: string, description: RTCSessionDescriptionInit) => {
        this.onSdpReceived.publish({
          description: description,
          displayName: displayName,
          signalingId: peerId
        })
      });
      this.connection.on("PeerLeft", (peerId: string) => {
        this.onPeerLeft.publish(peerId);
      });

      this.connection.onclose(() => this.onConnectionStateChanged.publish(HubConnectionState.Disconnected));
      this.connection.onreconnecting(() => this.onConnectionStateChanged.publish(HubConnectionState.Reconnecting));
      this.connection.onreconnected(() => this.onConnectionStateChanged.publish(HubConnectionState.Connected));

      this.connection.start()
        .then(() => {
          this.onConnectionStateChanged.publish(HubConnectionState.Connected);
          resolve(true);
        })
        .catch(reason => {
          console.error(reason);
          this.onConnectionStateChanged.publish(HubConnectionState.Disconnected);
          resolve(false);
        });
    })
  }

  public getIceServers() : Promise<RTCIceServer[]> {
    return this.connection?.invoke("GetIceServers") || Promise.resolve([]);
  }

  public getPeers() : Promise<string[]> {
    return this.connection?.invoke("GetPeers") || Promise.resolve([]);
  }

  public joinSession(sessionId: string) : Promise<SessionDto | undefined> {
    return this.connection?.invoke("JoinSession", sessionId) || Promise.resolve(undefined);
  }

  public sendSdp(signalingId: string, displayName: string, localDescription: RTCSessionDescription | null) {
    if (localDescription == null){
      console.error("Session description is null.");
      return;
    }

    return this.connection?.invoke("SendSdp", signalingId, displayName, localDescription);
  }
}


export const Signaler = new SignalingService();