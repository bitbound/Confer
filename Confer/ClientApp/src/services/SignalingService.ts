import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";

class SignalingService {
  private connection?: HubConnection;

  public get state(): HubConnectionState | undefined {
    return this.connection && this.connection.state;
  }

  public connect(onStateChange: (state:HubConnectionState) => void): Promise<boolean> {
    return new Promise<boolean>(resolve => {

      if (this.connection) {
        this.connection.stop();
      }

      this.connection = new HubConnectionBuilder()
        .withUrl("/signaling")
        .withAutomaticReconnect()
        .build();

      this.connection.on("sdp", (description: RTCSessionDescriptionInit) => {
        this.receiveSdp(description);
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

  public validateSessionId(sessionId: string) : Promise<boolean> {
    return this.connection?.invoke("ValidateSession", sessionId) || Promise.resolve(false);
  }
  
  private receiveSdp(description: RTCSessionDescriptionInit) {
    throw new Error("Method not implemented.");
  }
}


export const Signaler = new SignalingService();