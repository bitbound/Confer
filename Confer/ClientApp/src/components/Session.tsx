import { HubConnectionState } from "@microsoft/signalr";
import React, { Component, CSSProperties } from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { SessionContext } from "../services/SessionContext";
import { If } from "./If";
import { getSettings } from "../services/SettingsService";
import { Signaler } from "../services/SignalingService";
import { ChatMessage } from "../interfaces/ChatMessage";
import "./Session.css";
import { SettingsComp } from "./Settings";
import { Col, Row } from "reactstrap";

interface SessionProps {

}

interface SessionState {
  mainViewingStream?: MediaStream;
  selectedName?: string;
  messages: ChatMessage[];
}

export class Session extends Component<SessionProps, SessionState> {
  static contextType = SessionContext;
  context!: React.ContextType<typeof SessionContext>;

  constructor(props: SessionProps) {
    super(props);
    this.state = {
      mainViewingStream: undefined,
      selectedName: "",
      messages: []
    }
  }

  componentDidMount() {
    Signaler.onChatMessageReceived.subscribe(message => {
      console.log("Chat message received.");
      this.setState({
        messages: [...this.state.messages, message]
      })
    })
  }

  componentWillUnmount() {
    Signaler.onChatMessageReceived.removeAllListeners();
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
        <div className="mt-4">
          <Row className="mb-5 text-center">
            <Col sm={12} md={10} lg={8} xl={6}>
              <h5 className="mb-3">
                Adjust your settings below, then join!
              </h5>
              <div>
                <button className="btn btn-lg btn-primary"
                  onClick={this.context.joinSession}>
                  Join Chat
              </button>
              </div>
            </Col>
          </Row>

          <SettingsComp />
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
      <div style={{ color: sessionInfo?.pageTextColor }} className="session-grid">
        <div className="thumbnail-banner">
          <div className="thumbnail-video-wrapper">
            <video
              key={"thumbnail-self"}
              className="thumbnail-video"
              muted={true}
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
                if (ref && localMediaStream && ref.srcObject != localMediaStream) {
                  console.log("Set local media stream.");
                  ref.srcObject = localMediaStream
                }
              }} />
            <div className="nameplate">
              <span style={{}}>
                {settings.displayName}
              </span>
            </div>
          </div>


          {peers.map((x, index) => (
            <div
              key={`thumbnail-${x.signalingId}-${index}`}
              className="thumbnail-video-wrapper">
              <video
                className="thumbnail-video"
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
                ref={async ref => {
                  if (ref && x.remoteMediaStream && ref.srcObject != x.remoteMediaStream) {
                    console.log("Set remote media stream for peer ", x.signalingId);
                    ref.srcObject = x.remoteMediaStream;
                    var mediaElement = ref as unknown as any;
                    if (mediaElement.setSinkId) {
                      await mediaElement.setSinkId(settings.defaultAudioOutput);
                      console.log("SetSinkId successful.  ID: ", settings.defaultAudioOutput);
                    }
                    else {
                      console.warn("SetSinkId is not supported.  Cannot set audio output.");
                    }
                  }
                }} />
              <div className="nameplate">
                {x.displayName}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <If condition={!!mainViewingStream}>
            <video
              muted={true}
              autoPlay={true}
              onLoadedMetadata={ev => {
                ev.currentTarget.play();
              }}
              ref={ref => {
                if (ref && mainViewingStream && ref.srcObject != mainViewingStream) {
                  ref.srcObject = mainViewingStream;
                }
              }}
              placeholder="Something"
              className="main-viewing-video"
            />
            <div className="nameplate">
              {selectedName}
            </div>
          </If>

          <If condition={!mainViewingStream}>
            <h4 className="text-center" style={{ marginTop: "100px" }}>
              Select a video feed.
            </h4>
          </If>
        </div>

        <div className="chat-messages-wrapper">
          <div style={{ position: "relative" }}>
            <div
              ref={ref => {
                if (ref) {
                  ref.scrollTo(0, ref.scrollHeight);
                }
              }}
              className="chat-messages-window">
              {this.state.messages.map((x, index) => (
                <div key={`chat-message-${index}`}>
                  <span style={{ fontWeight: "bold" }}>
                    {x.senderDisplayName}
                  </span>
                  <small>
                    {` (${x.timestamp}): `}
                  </small>
                  {x.message}
                </div>
              ))}
            </div>

          </div>

          <input
            placeholder="Type a chat message"
            className="form-control"
            onKeyPress={ev => {
              if (ev.key.toLowerCase() == "enter") {
                var messageText = ev.currentTarget.value;
                Signaler.sendChatMessage(messageText, settings.displayName);
                ev.currentTarget.value = "";
              }
            }} />
        </div>
      </div>
    )
  }
}