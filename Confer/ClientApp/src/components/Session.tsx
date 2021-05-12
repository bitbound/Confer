import { HubConnectionState } from "@microsoft/signalr";
import React, { Component } from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { SessionInfoContext } from "../services/SessionInfoContext";
import { If } from "./If";
import { getSettings } from "../services/SettingsService";
import { Signaler } from "../services/SignalingService";
import { ChatMessage } from "../interfaces/ChatMessage";
import "./Session.css";
import { SettingsComp } from "./Settings";
import { Col, Row } from "reactstrap";
import { Peer } from "../interfaces/Peer";
import { IceCandidateMessage } from "../interfaces/IceCandidateMessage";
import { SdpMessage } from "../interfaces/SdpMessage";

interface SessionProps {

}

interface SessionState {
  mainViewingStream?: MediaStream;
  selectedName?: string;
  connectionState: HubConnectionState;
  localMediaStream: MediaStream;
  peers: Peer[];
  isScreenSharing: boolean;
  chatMessages: ChatMessage[];
}

export class Session extends Component<SessionProps, SessionState> {
  static contextType = SessionInfoContext;
  context!: React.ContextType<typeof SessionInfoContext>;

  constructor(props: SessionProps) {
    super(props);
    this.state = {
      selectedName: "",
      chatMessages: [],
      connectionState: Signaler.connectionState,
      isScreenSharing: false,
      peers: [],
      localMediaStream: new MediaStream()
    }
  }

  async componentDidMount() {
    Signaler.onConnectionStateChanged.subscribe(this.handleConnectionStateChanged);
    Signaler.onSdpReceived.subscribe(this.handleSdpReceived);
    Signaler.onIceCandidateReceived.subscribe(this.handleIceCandidateReceived);
    Signaler.onChatMessageReceived.subscribe(this.handleChatMessageReceived);
    Signaler.onPeerLeft.subscribe(this.handlePeerLeft);

    if (Signaler.connectionState == HubConnectionState.Connecting) {
      await Signaler.connect();
    }
    else if (this.context.sessionInfo && this.context.sessionJoined) {
      await this.initLocalMedia();
      await this.updatePeers();
      await this.sendOffers();
    }
  }

  componentWillUnmount() {
    Signaler.onConnectionStateChanged.unsubscribe(this.handleConnectionStateChanged);
    Signaler.onSdpReceived.unsubscribe(this.handleSdpReceived);
    Signaler.onIceCandidateReceived.unsubscribe(this.handleIceCandidateReceived);
    Signaler.onChatMessageReceived.unsubscribe(this.handleChatMessageReceived);
    Signaler.onPeerLeft.unsubscribe(this.handlePeerLeft);
  }
  
  public toggleShareScreen = async () => {
    const {
      localMediaStream,
      isScreenSharing,
      peers
    } = this.state;

    try {
      if (!(navigator.mediaDevices as any).getDisplayMedia) {
        alert("Screen sharing is not supported on this browser/device.");
        return;
      }
      
      localMediaStream.getVideoTracks().forEach(x => {
        localMediaStream.removeTrack(x);
        x.stop();
      });
  
      if (!isScreenSharing) {
        var displayMedia = await (navigator.mediaDevices as any).getDisplayMedia({
          video:true
        });
        displayMedia.getVideoTracks().forEach((x:any) => {
          localMediaStream.addTrack(x);
        })
      }
      else {
        await this.loadVideoStream();
      }
  
      var newVideoTrack = localMediaStream.getVideoTracks()[0];
  
      peers.forEach(peer => {
        peer.peerConnection?.getSenders().forEach(sender =>{
          if (sender.track?.kind == "video") {
            sender.replaceTrack(newVideoTrack);
          }
        })
      })
    }
    catch (ex) {
      console.error(ex);
    }
    finally {
      this.setState({
        isScreenSharing: !isScreenSharing
      });
    }
  }


  private addLocalMediaTracks = (pc: RTCPeerConnection) => {
    console.log("Adding tracks");
    this.state.localMediaStream.getTracks().forEach(track => {
      pc?.addTrack(track, this.state.localMediaStream);
    });
  }

  private configurePeerConnection = (pc: RTCPeerConnection, peerId: string) => {
    const {
      peers
    } = this.state;

    console.log("Configure peer connection for ID: ", peerId);
    pc.addEventListener("icecandidate", ev => {
      if (ev.candidate) {
        Signaler.sendIceCandidate(peerId, ev.candidate);
      }
    });
    pc.addEventListener("connectionstatechange", ev => {
      console.log(`PeerConnection state changed to ${pc.connectionState} for peer ${peerId}.`);
      if (pc.connectionState == "closed" || 
          pc.connectionState == "failed") {
            // TODO: Check with signaling server if peer is still there.
          }
    });
    pc.addEventListener("iceconnectionstatechange", ev => {
      console.log(`ICE connection state changed to ${pc.iceConnectionState} for peer ${peerId}.`);
      if (pc.iceConnectionState == "failed" || 
          pc.iceConnectionState == "closed") {
            // TOD: Check with signaling server if peer is still there.
          }
    })
    pc.addEventListener("negotiationneeded", async (ev) => {
      // TODO: Handle offer collisions politely.
      console.log("Negotation needed.");
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Sending renegotiation offer: ", pc.localDescription);
      await Signaler.sendSdp(peerId, getSettings().displayName, pc.localDescription);
    });
    pc.addEventListener("track", ev => {
      console.log("Track received: ", ev.track);
      let peer = peers.find(x => x.signalingId == peerId);
      if (!peer){
       console.error("Peer not found for ID ", peerId);
       return;
      }
      if (peer.remoteMediaStream) {
        peer.remoteMediaStream.addTrack(ev.track);
      }
      else {
        peer.remoteMediaStream = new MediaStream([ev.track]);
      }
      this.forceUpdate();
    });
  }

  private handleChatMessageReceived = async (message: ChatMessage) => {
    console.log("Chat message received.");
    this.setState({
      chatMessages: [...this.state.chatMessages, message]
    })
  }
  
  private handleConnectionStateChanged = async (connectionState: HubConnectionState) => {
    console.log("WebSocket connection state changed: ", connectionState);
    this.setState({
      connectionState: connectionState
    });

    if (connectionState == HubConnectionState.Connected) {
      this.setState({
        peers: []
      })

      if (!this.state.localMediaStream?.getTracks()) {
        return;
      }

      this.context.getSessionInfo();
    }
  }

  private handleIceCandidateReceived = (iceMessage: IceCandidateMessage) => {
    console.log("ICE candidate received: ", iceMessage);
    var peer = this.state.peers.find(x => x.signalingId == iceMessage.peerId);
    if (peer && peer.peerConnection) {
      try {
        peer.peerConnection.addIceCandidate(iceMessage.iceCandidate);
      }
      catch (ex) {
        console.warn("Failed to set ICE candidate. ", ex);
      }
    }
    else {
      console.log(`Peer ID ${iceMessage.peerId} not found in `, this.state.peers);
    }
  }

  private handlePeerLeft = (peerId: string) => {
    console.log("Peer left: ", peerId);
    this.setState({
      peers: this.state.peers.filter(x => x.signalingId != peerId)
    });
  }

  private handleSdpReceived = async (sdpMessage: SdpMessage) => {
    console.log("Received SDP: ", sdpMessage);
    var peer = this.state.peers.find(x=>x.signalingId == sdpMessage.signalingId);

    if (sdpMessage.description.type == "offer") {
      var iceServers = await Signaler.getIceServers();

      var pc = peer?.peerConnection || new RTCPeerConnection({
        iceServers: iceServers
      });
      
      if (!peer || !peer.peerConnection) {
        this.addLocalMediaTracks(pc);
        peer = {
          signalingId: sdpMessage.signalingId,
          displayName: sdpMessage.displayName,
          peerConnection: pc
        };
  
        this.setState({
          peers: [...this.state.peers, peer]
        })

        this.configurePeerConnection(pc, sdpMessage.signalingId);
      }

      await pc.setRemoteDescription(sdpMessage.description);
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("Sending SDP answer to: ", sdpMessage.signalingId);
      await Signaler.sendSdp(sdpMessage.signalingId, getSettings().displayName, pc.localDescription);
    }
    else if (sdpMessage.description.type == "answer") {
      if (!peer) {
        console.error(`Unable to find peer with ID ${sdpMessage.signalingId}.`);
        return;
      }
      peer.displayName = sdpMessage.displayName;
      peer.signalingId = sdpMessage.signalingId;
      await peer.peerConnection?.setRemoteDescription(sdpMessage.description);
    }
    else {
      console.error("Unhandled SDP type.", sdpMessage);
    }
  }

  private initLocalMedia = async () => {
    await this.loadAudioStream();
    await this.loadVideoStream();
  }

  private loadAudioStream = async () => {
    try {
      let settings = getSettings();
      let audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: {
            ideal: settings.defaultAudioInput
          }
        }
      });
      audioStream.getTracks().forEach(x => {
        this.state.localMediaStream.addTrack(x);
      })
    }
    catch {
      console.warn("Failed to get audio device.");
    }
  }

  private loadVideoStream = async () => {
    try {
      let settings = getSettings();
      let videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: {
            ideal: settings.defaultVideoInput
          }
        }
      });
      videoStream.getTracks().forEach(x => {
        this.state.localMediaStream.addTrack(x);
      })
    }
    catch {
      console.warn("Failed to get video device.");
    }
  }


  private sendOffers = async () => {
    const iceServers = await Signaler.getIceServers();
    this.state.peers.forEach(x => {
        x.peerConnection = new RTCPeerConnection({
            iceServers: iceServers
        });

        this.configurePeerConnection(x.peerConnection, x.signalingId);

        this.addLocalMediaTracks(x.peerConnection);
    })
  }

  private updatePeers = async () => {
    var peerIds = await Signaler.getPeers();

    peerIds.forEach(x => {
      if (!this.state.peers.some(y => y.signalingId == x)) {
        this.setState({
          peers: [...this.state.peers, {signalingId: x}]
        })
      }
    })
  }

  render() {
    const {
      sessionChecked,
      sessionInfo,
      sessionJoined,
    } = this.context;

    const {
      chatMessages,
      connectionState,
      localMediaStream,
      peers,
      isScreenSharing
    } = this.state;

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

    if (!sessionJoined) {
      return (
        <div className="mt-4 ml-4">
          <Row className="mb-5 text-center">
            <Col sm={12} md={10} lg={8} xl={6}>
              <h5 className="mb-3">
                Adjust your settings below, then join!
              </h5>
              <div>
                <button className="btn btn-lg btn-primary"
                  onClick={async () => {
                    await this.context.joinSession();
                  }}>
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
              style={{transform: !isScreenSharing ? "scaleX(-1)" : "unset"}}
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
              style={{
                transform: !isScreenSharing && mainViewingStream == localMediaStream ? 
                  "scaleX(-1)" : 
                  "unset"
              }}
              className="main-viewing-video"
            />
            <div className="nameplate">
              {selectedName}
            </div>
          </If>

          <button 
            className={`share-screen-button btn btn-sm ${isScreenSharing ? "btn-danger" : "btn-info"}`}
            onClick={() => {
              this.toggleShareScreen()
            }}>
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </button>

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
              {chatMessages.map((x, index) => (
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