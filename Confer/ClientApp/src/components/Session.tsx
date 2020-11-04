import { HubConnectionState } from "@microsoft/signalr";
import React, { Component, CSSProperties } from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { SessionContext } from "../services/SessionContext";
import { If } from "./If";
import { getSettings } from "../services/SettingsService";

interface SessionProps {

}

interface SessionState {
  mainViewingStream?: MediaStream;
  selectedName?: string;
}

export class Session extends Component<SessionProps, SessionState> {
  static contextType = SessionContext;
  context!: React.ContextType<typeof SessionContext>;

  constructor(props: SessionProps) {
    super(props);
    this.state = {
      mainViewingStream: undefined,
      selectedName: ""
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

    let {
      mainViewingStream,
      selectedName
    } = this.state;

    if (!mainViewingStream && peers?.length > 0) {
      mainViewingStream = peers[0].remoteMediaStream
      selectedName = peers[0].displayName;
    }

    let settings = getSettings();

    return (
      <div style={{ color: sessionInfo?.pageTextColor, ...SessionGrid }}>
        <div style={ThumbnailBanner}>
          <div style={ThumbnailVideoWrapper}>
            <video
              key={"thumbnail-self"}
              style={ThumbnailVideo}
              autoPlay={true}
              onLoadedMetadata={ev => {
                ev.currentTarget.play();
              }}
              onClick={ev => {
                this.setState({
                  mainViewingStream: ev.currentTarget.srcObject as MediaStream,
                  selectedName: settings.displayName
                })
              }}
              ref={ref => {
                if (ref && localMediaStream) {
                  console.log("Set local media stream.");
                  ref.srcObject = localMediaStream
                }
              }} />
            <div style={Nameplate}>
              <span style={{}}>
                {settings.displayName}
              </span>
            </div>
          </div>


          {peers.map(x => (
            <div style={ThumbnailVideoWrapper}>
              <video
                key={`thumbnail-${x.signalingId}`}
                style={ThumbnailVideo}
                autoPlay={true}
                onLoadedMetadata={ev => {
                  ev.currentTarget.play();
                }}
                onClick={ev => {
                  this.setState({
                    mainViewingStream: ev.currentTarget.srcObject as MediaStream,
                    selectedName: x.displayName
                  })
                }}
                ref={ref => {
                  if (ref && x.remoteMediaStream) {
                    console.log("Set remote media stream for peer ", x.signalingId);
                    ref.srcObject = x.remoteMediaStream
                  }
                }} />
              <div style={Nameplate}>
                {x.displayName}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <If condition={!!mainViewingStream}>
            <video
              autoPlay={true}
              onLoadedMetadata={ev => {
                ev.currentTarget.play();
              }}
              ref={ref => {
                if (ref && mainViewingStream) {
                  ref.srcObject = mainViewingStream;
                }
              }}
              placeholder="Something"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            <div style={Nameplate}>
              {selectedName}
            </div>
          </If>

          <If condition={!mainViewingStream}>
            <h4 className="text-center" style={{ marginTop: "100px" }}>
              Select a video feed.
            </h4>
          </If>
        </div>

        <div style={{ display: "grid", gridTemplateRows: "1fr auto", rowGap: "5px" }}>
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

const ThumbnailBanner = {
  display: "flex",
  flexDirection: "row",
  overflowX: "auto",
  gridColumn: "1 / span 2"
} as CSSProperties;

const ThumbnailVideoWrapper = {
  position: "relative",
  height: "100px",
  width: "130px",
  marginRight: "10px",
} as CSSProperties;

const ThumbnailVideo = {
  position: "absolute",
  height: "100px",
  width: "130px",
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

const Nameplate = {
  position: "absolute",
  bottom: "2px",
  right: "2px",
  textAlign: "center",
  color: "white",
  backgroundColor: "rgba(0,0,0, 0.7)",
  padding: "1px 4px",
  userSelect: "none",
  pointerEvents: "none",
  borderRadius: "3px"
} as CSSProperties;