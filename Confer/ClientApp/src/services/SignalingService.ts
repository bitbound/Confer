import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { ChatMessage } from "../interfaces/ChatMessage";
import { IceCandidateMessage } from "../interfaces/IceCandidateMessage";
import { SdpMessage } from "../interfaces/SdpMessage";
import { SessionDto } from "../interfaces/SessionDto";
import { EventEmitterEx } from "../utils/EventEmitterEx";

class SignalingService {
  private connection?: HubConnection;
  private initialized: boolean = false;

  public readonly onChatMessageReceived = new EventEmitterEx<ChatMessage>();
  public readonly onConnectionStateChanged = new EventEmitterEx<HubConnectionState>();
  public readonly onSdpReceived = new EventEmitterEx<SdpMessage>();
  public readonly onIceCandidateReceived = new EventEmitterEx<IceCandidateMessage>();
  
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
      this.connection.on("IceCandidate", (peerId: string, jsonCandidate: string) => {
        if (!jsonCandidate) {
          return;
        }
        this.onIceCandidateReceived.publish({
          iceCandidate: JSON.parse(jsonCandidate),
          peerId: peerId
        })
      });
      this.connection.on("ChatMessage", (message: string, displayName: string, peerId: string) => {
        this.onChatMessageReceived.publish({
          message: message,
          senderDisplayName: displayName,
          senderSignalingId: peerId,
          timestamp: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
        })
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

  public getSessionInfo(sessionId: string) : Promise<SessionDto | undefined> {
    return this.connection?.invoke("GetSessionInfo", sessionId) || Promise.resolve(undefined);
  }

  public joinSession(sessionId: string) : Promise<SessionDto | undefined> {
    return this.connection?.invoke("JoinSession", sessionId) || Promise.resolve(undefined);
  }

  public sendIceCandidate(peerId: string, candidate: RTCIceCandidate | null) {
    var jsonCandidate = candidate ? JSON.stringify(candidate) : candidate;
    return this.connection?.invoke("SendIceCandidate", peerId, jsonCandidate);
  }

  public sendChatMessage(message: string, displayName: string) {
    this.connection?.invoke("SendChatMessage", message, displayName);
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