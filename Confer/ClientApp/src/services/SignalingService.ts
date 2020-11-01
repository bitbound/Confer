import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { SessionDto } from "../interfaces/SessionDto";
import { EventEmitterEx } from "../utils/EventEmitterEx";

class SignalingService {
  private connection?: HubConnection;
  private initialized: boolean = false;

  public readonly onConnectionStateChanged = new EventEmitterEx<HubConnectionState>();
  
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

      this.connection.on("Sdp", (peerId: string, description: RTCSessionDescriptionInit) => {
        this.receiveSdp(peerId, description);
      });
      this.connection.on("ParticipantLeft", (peerId: string) => {
        // TODO
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
  
  private async receiveSdp(peerId: string, description: RTCSessionDescriptionInit) {
    // TODO: Emit
    if (description.type == "offer") {
      // var iceServers = await Signaler.getIceServers();
      // var pc = new RTCPeerConnection({
      //   iceServers: iceServers
      // });
      // await pc.setRemoteDescription(description);
      // var answer = await pc.createAnswer();
      // await pc.setLocalDescription(answer);
      // this.connection?.invoke("Sdp", pc.localDescription);
      
    }
    else {
      // var peer = this.peerConnections.find(x=>x.peerId == peerId);
      // if (!peer) {
      //   console.error(`Unable to find peer with ID ${peerId}.`);
      //   return;
      // }
      // await peer.peerConnection.setRemoteDescription(description);
    }
  }
  
  public async sendSdp(signalingId: string, localDescription: RTCSessionDescription | null) {
    throw new Error('Method not implemented.');
  }
}


export const Signaler = new SignalingService();