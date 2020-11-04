import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { SessionDto } from '../interfaces/SessionDto';
import { Signaler } from './SignalingService';
import { Peer } from '../interfaces/Peer';
import { EventEmitterEx } from '../utils/EventEmitterEx';
import { SdpMessage } from '../interfaces/SdpMessage';
import { getSettings } from './SettingsService';
import { IceCandidateMessage } from '../interfaces/IceCandidateMessage';


export class SessionContextState {
  public isSession: boolean = false;
  public localAudioDeviceId?: string;
  public localVideoDeviceId?: string;
  public localMediaStream: MediaStream = new MediaStream();
  public sessionChecked: boolean = false;
  public sessionId?: string;
  public sessionInfo?: SessionDto;
  public sessionJoined: boolean = false;
  public connectionState: HubConnectionState = HubConnectionState.Connecting;
  public peers: Peer[] = [];
  public readonly stateUpdated: EventEmitterEx<SessionContextState> = new EventEmitterEx();

  constructor() {
    const settings = getSettings();
    this.localAudioDeviceId = settings.defaultAudioInput;
    this.localVideoDeviceId = settings.defaultVideoInput;

    this.isSession = window.location.pathname
      .toLowerCase()
      .includes("/session/");

    if (this.isSession) {
      this.sessionId = window.location.pathname
        .toLowerCase()
        .replace("/session/", "")
        .split("/")
        .join("");


      Signaler.onConnectionStateChanged.subscribe(this.handleConnectionStateChanged);
      Signaler.onSdpReceived.subscribe(this.handleSdpReceived);
      Signaler.onIceCandidateReceived.subscribe(this.handleIceCandidateReceived);
      Signaler.connect();
    }
  }


  public joinSession = async () => {
    this.getSessionInfo(true);

    if (this.sessionInfo) {
      await this.updatePeers();
      await this.sendOffers();
      this.update();
    }
  }

  public update = () => {
    this.stateUpdated.publish(this);
  }

  private addLocalMediaTracks = (pc: RTCPeerConnection) => {
    console.log("Adding tracks");
    this.localMediaStream.getTracks().forEach(track => {
      pc?.addTrack(track, this.localMediaStream);
    });
  }

  private configurePeerConnection = (pc: RTCPeerConnection, peerId: string) => {
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
            console.log("Peer left: ", peerId);
            this.peers = this.peers.filter(x => x.signalingId != peerId);
          }
      this.update();
    });
    pc.addEventListener("iceconnectionstatechange", ev => {
      console.log(`ICE connection state changed to ${pc.iceConnectionState} for peer ${peerId}.`);
      if (pc.iceConnectionState == "failed" || 
          pc.iceConnectionState == "closed") {
            console.log("Peer left: ", peerId);
            this.peers = this.peers.filter(x => x.signalingId != peerId);
          }
      this.update();
    })
    pc.addEventListener("negotiationneeded", async (ev) => {
      // TODO: This can be re-enabled when offer collisions are handled.
      //console.log("Negotation needed.");
      //var offer = await pc.createOffer();
      //await pc.setLocalDescription(offer);
      //console.log("Sending renegotiation offer: ", pc.localDescription);
      //await Signaler.sendSdp(peerId, getSettings().displayName, pc.localDescription);
    });
    pc.addEventListener("track", ev => {
      console.log("Track received: ", ev.track);
      let peer = this.peers.find(x => x.signalingId == peerId);
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
      this.update();
    });
  }

  private getLocalMedia = async () => {
    this.localMediaStream = new MediaStream();
    try {
      let audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.localAudioDeviceId
        }
      });
      audioStream.getTracks().forEach(x => {
        this.localMediaStream.addTrack(x);
      })
    }
    catch {
      console.warn("Failed to get audio device.");
    }

    try {
      let videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: this.localVideoDeviceId
        }
      });
      videoStream.getTracks().forEach(x => {
        this.localMediaStream.addTrack(x);
      })
    }
    catch {
      console.warn("Failed to get video device.");
    }
  }

  private getSessionInfo = async (join: boolean) => {
    var sessionInfo = join ? 
      await Signaler.joinSession(String(this.sessionId)):
      await Signaler.getSessionInfo(String(this.sessionId));

    if (this.isSession && sessionInfo) {
      document.body.style.backgroundColor = sessionInfo.pageBackgroundColor;
      document.body.style.color = sessionInfo.pageTextColor;
    }
    this.sessionInfo = sessionInfo;
    this.sessionChecked = true;
    this.sessionJoined = join;
    this.update();
  }
  
  private handleConnectionStateChanged = async (connectionState: HubConnectionState) => {
    console.log("WebSocket connection state changed: ", connectionState);
    this.connectionState = connectionState;
    this.update();

    if (connectionState == HubConnectionState.Connected) {
      this.peers.splice(0);

      await this.getLocalMedia();

      this.update();
      if (!this.localMediaStream?.getTracks()) {
        return;
      }

      this.getSessionInfo(false);
    }
  }

  private handleIceCandidateReceived = (iceMessage: IceCandidateMessage) => {
    console.log("ICE candidate received: ", iceMessage);
    var peer = this.peers.find(x => x.signalingId == iceMessage.peerId);
    if (peer && peer.peerConnection) {
      try {
        peer.peerConnection.addIceCandidate(iceMessage.iceCandidate);
      }
      catch (ex) {
        console.warn("Failed to set ICE candidate. ", ex);
      }
    }
    else {
      console.log(`Peer ID ${iceMessage.peerId} not found in `, this.peers);
    }
  }

  private handleSdpReceived = async (sdpMessage: SdpMessage) => {
    console.log("Received SDP: ", sdpMessage);
    if (sdpMessage.description.type == "offer") {
      var iceServers = await Signaler.getIceServers();

      var peer = this.peers.find(x=>x.signalingId == sdpMessage.signalingId);
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
  
        this.peers.push(peer);

        this.configurePeerConnection(pc, sdpMessage.signalingId);
      }

      await pc.setRemoteDescription(sdpMessage.description);
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("Sending SDP answer to: ", sdpMessage.signalingId);
      await Signaler.sendSdp(sdpMessage.signalingId, getSettings().displayName, pc.localDescription);
      
      this.update();
    }
    else if (sdpMessage.description.type == "answer") {
      var peer = this.peers.find(x => x.signalingId == sdpMessage.signalingId);
      if (!peer) {
        console.error(`Unable to find peer with ID ${sdpMessage.signalingId}.`);
        return;
      }
      await peer.peerConnection?.setRemoteDescription(sdpMessage.description);
    }
    else {
      console.error("Unhandled SDP type.", sdpMessage);
    }
  }

  private sendOffer = async (x: Peer, iceServers: RTCIceServer[]) => {
    x.peerConnection = new RTCPeerConnection({
      iceServers: iceServers
    });
    this.addLocalMediaTracks(x.peerConnection);

    this.configurePeerConnection(x.peerConnection, x.signalingId);
    
    var offer = await x.peerConnection.createOffer();
    
    await x.peerConnection?.setLocalDescription(offer);
    
    console.log("Sending SDP offer to: ", x);
    await Signaler.sendSdp(x.signalingId, getSettings().displayName, x.peerConnection.localDescription);
  }

  private sendOffers = async () => {
    const iceServers = await Signaler.getIceServers();
    this.peers.forEach(async x => {
      await this.sendOffer(x, iceServers);
    })
  }

  private updatePeers = async () => {
    var peerIds = await Signaler.getPeers();

    peerIds.forEach(x => {
      if (!this.peers.some(y => y.signalingId == x)) {
        this.peers.push({ signalingId: x });
      }
    })
  }
}

export const SessionContextData = new SessionContextState();
export const SessionContext = React.createContext(SessionContextData);