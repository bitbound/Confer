import { HubConnectionState } from "@microsoft/signalr";
import React, { Component, CSSProperties } from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { SessionContext } from "../services/SessionContext";
import { If } from "./If";

interface SessionProps {

}

interface SessionState {
  mainViewingStream?: MediaStream;
}

export class Session extends Component<SessionProps, SessionState> {
  static contextType = SessionContext;
  context!: React.ContextType<typeof SessionContext>;

  constructor(props: SessionProps) {
    super(props);
    this.state = {
      mainViewingStream: undefined
    }
  }

  render() {
    const {
      sessionChecked,
      sessionInfo,
      connectionState,
      sessionJoined: joinedSession,
      localMediaStream,
      peers
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

    if (!joinedSession) {
      return (
        <div className="text-center mt-5">
          <button className="btn btn-lg btn-primary"
            onClick={this.context.joinSession}>
            Join
            </button>
        </div>
      )
    }

    let viewStream = this.state.mainViewingStream;

    if (!viewStream && peers?.length > 0) {
      viewStream = peers[0].remoteMediaStream
    }

    return (
      <div style={{color: sessionInfo?.pageTextColor, ...SessionGrid}}>
        <div style={ThumbnailWrapper}>
          <video
            key={"thumbnail-self"}
            style={ThumbnailVideo}
            autoPlay={true}
            onLoadedMetadata={ev => {
              ev.currentTarget.play();
            }}
            onClick={ev => {
              this.setState({
                mainViewingStream: ev.currentTarget.srcObject as MediaStream
              })
            }}
            ref={ref => {
              if (ref && localMediaStream) {
                console.log("Set local media stream.");
                ref.srcObject = localMediaStream
              }
            }} />

          {peers.map(x => (
            <video
              key={`thumbnail-${x.signalingId}`}
              style={ThumbnailVideo}
              autoPlay={true}
              onLoadedMetadata={ev => {
                ev.currentTarget.play();
              }}
              onClick={ev => {
                this.setState({
                  mainViewingStream: ev.currentTarget.srcObject as MediaStream
                })
              }}
              ref={ref => {
                if (ref && x.remoteMediaStream) {
                  console.log("Set remote media stream for peer ", x.signalingId);
                  ref.srcObject = x.remoteMediaStream
                }
              }} />
          ))}
        </div>

        <div>
          <If condition={!!viewStream}>
            <video
              autoPlay={true}
              onLoadedMetadata={ev => {
                ev.currentTarget.play();
              }}
              ref={ref => {
                if (ref && viewStream) {
                  ref.srcObject = viewStream;
                }
              }}
              placeholder="Something"
              style={{
                maxWidth: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </If>

          <If condition={!viewStream}>
            <h4 className="text-center" style={{ marginTop: "100px"}}>
              Select a video feed.
            </h4>
          </If>
        </div>

        <div style={{ display: "grid", gridTemplateRows: "1fr 50px", rowGap: "5px" }}>
          <div style={ChatMessagesWindow} />
          <input placeholder="Type a chat message" className="form-control"></input>
        </div>
      </div>
    )
  }
}


const SessionGrid = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  gridTemplateColumns: "3fr 2fr",
  height: "100%",
  paddingBottom: "30px",
  rowGap: "10px",
  columnGap: "10px"
} as CSSProperties;

const ThumbnailWrapper = {
  display: "flex",
  flexDirection: "row",
  overflowX: "auto",
  gridColumn: "1 / span 2"
} as CSSProperties;

const ThumbnailVideo = {
  height: "100px",
  width: "130px",
  marginRight: "10px",
  objectFit: "cover",
  cursor: "pointer"
} as CSSProperties;

const ChatMessagesWindow = {
  height: "100%",
  width: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  backgroundColor: "whitesmoke",
  borderRadius: "5px"
} as CSSProperties;