import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";

export enum ConnectionType {
  Host,
  Client
}

class SignalingService {
  private connection?: HubConnection;

  public get state(): HubConnectionState | undefined {
    return this.connection && this.connection.state;
  }

  public connect(): Promise<boolean> {
    return new Promise<boolean>(resolve => {

      if (this.connection) {
        this.connection.stop();
      }

      this.connection = new HubConnectionBuilder()
        .withUrl("/signaling")
        .build();

      this.connection.on("sdp", (description: RTCSessionDescriptionInit) => {
        this.receiveSdp(description);
      });

      this.connection.start()
        .then(() => {
          resolve(true);
        })
        .catch(reason => {
          console.error(reason);
          resolve(false);
        });
    })
  }

  public validateSessionId(sessionId: string, connectionType: ConnectionType) {
    
  }
  
  private receiveSdp(description: RTCSessionDescriptionInit) {
    throw new Error("Method not implemented.");
  }
}


export const Signaler = new SignalingService();