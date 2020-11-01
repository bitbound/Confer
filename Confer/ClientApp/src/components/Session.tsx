import { HubConnectionState } from "@microsoft/signalr";
import React, { Component } from "react";
import { SessionDto } from "../interfaces/SessionDto";
import { LoadingAnimation } from "./LoadingAnimation";
import { SessionContext } from "../services/SessionContext";

interface SessionProps {
  sessionChecked: boolean;
  sessionId?: string;
  sessionInfo?: SessionDto;
  connectionState?: HubConnectionState;
}

interface SessionState {
}

export class Session extends Component<SessionProps, SessionState> {
  static contextType = SessionContext;
  context!: React.ContextType<typeof SessionContext>;

  render() {
    const {
      sessionId,
      sessionChecked,
      sessionInfo,
      connectionState,
      mediaFailure,
      localMediaStream
    } = this.context;

    switch (connectionState) {
      case HubConnectionState.Connecting:
        return (
          <LoadingAnimation message="Connecting"></LoadingAnimation>
        )
      case HubConnectionState.Reconnecting:
        return (
          <LoadingAnimation message="Reconnecting"></LoadingAnimation>
        )
      case HubConnectionState.Disconnected:
        return (
          <div className="text-center">
            <h3>Disconnected.</h3>
            <h5>Please refresh the browser to try again.</h5>
          </div>
        )
      default:
        break;
    }

    if (!sessionChecked) {
      return (
        <h3 className="text-center">Finding session...</h3>
      )
    }

    if (!sessionInfo) {
      return (
        <h3 className="text-center">Session ID not found.</h3>
      )
    }

    if (mediaFailure) {
      return (
        <h3 className="text-center">Failed to retrieve local media devices.</h3>
      )
    }

    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <video
          autoPlay={true}
          onLoadedMetadata={ev => {
            ev.currentTarget.play();
          }}
          ref={ref => {
            if (ref && localMediaStream) {
              console.log("Set local media stream.");
              ref.srcObject = localMediaStream
            }
          }} />
      </div>
    )
  }
}