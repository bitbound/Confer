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
  public mediaFailure: boolean = false;
  public sessionChecked: boolean = false;
  public sessionId?: string;
  public sessionInfo?: SessionDto;
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



  public update() {
    this.stateUpdated.publish(this);
  }

  private configurePeerConnection = (pc: RTCPeerConnection, peerId: string) => {
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
            this.update();
          }
    });
    pc.addEventListener("negotiationneeded", async () => {
      console.log("Negotation needed.");
      const iceServers = await Signaler.getIceServers();
      const peer = this.peers.find(x => x.signalingId == peerId);
      if (peer) {
        //this.sendOffer(peer, iceServers);
      }
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

    this.localMediaStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localMediaStream);
    });
  }

  private async getLocalMedia() {
    try {
      this.localMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.localAudioDeviceId
        },
        video: {
          deviceId: this.localVideoDeviceId
        }
      });
      return true;
    }
    catch {
      return false;
    }
  }
  
  private handleConnectionStateChanged = async (connectionState: HubConnectionState) => {
    console.log("WebSocket connection state changed: ", connectionState);
    this.connectionState = connectionState;
    this.update();

    if (connectionState == HubConnectionState.Connected) {
      this.peers.splice(0);

      var result = await this.getLocalMedia();

      if (!result || !this.localMediaStream) {
        this.mediaFailure = true;
        this.update();
        return;
      }

      this.update();

      var sessionInfo = await Signaler.joinSession(String(this.sessionId));
      if (this.isSession && sessionInfo) {
        document.body.style.backgroundColor = sessionInfo.pageBackgroundColor;
        document.body.style.color = sessionInfo.pageTextColor;
      }
      this.sessionInfo = sessionInfo;
      this.sessionChecked = true;
      this.update();

      await this.updatePeers();
      await this.sendOffers();
    }
  }

  private handleIceCandidateReceived = (iceMessage: IceCandidateMessage) => {
    console.log("ICE candidate received: ", iceMessage);
    var peer = this.peers.find(x => x.signalingId == iceMessage.peerId);
    if (peer && peer.peerConnection) {
      peer.peerConnection.addIceCandidate(iceMessage.iceCandidate);
    }
  }

  private handleSdpReceived = async (sdpMessage: SdpMessage) => {
    console.log("Received SDP: ", sdpMessage);
    if (sdpMessage.description.type == "offer") {
      var iceServers = await Signaler.getIceServers();

      var pc = new RTCPeerConnection({
        iceServers: iceServers
      });
    
      await pc.setRemoteDescription(sdpMessage.description);
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.peers.push({
        signalingId: sdpMessage.signalingId,
        displayName: sdpMessage.displayName

      })
      
      this.configurePeerConnection(pc, sdpMessage.signalingId);

      Signaler.sendSdp(sdpMessage.signalingId, getSettings().displayName, pc.localDescription);
    }
    else if (sdpMessage.description.type == "answer") {
      var peer = this.peers.find(x=>x.signalingId == sdpMessage.signalingId);
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

  private async sendOffer(x: Peer, iceServers: RTCIceServer[]) {
    x.peerConnection = new RTCPeerConnection({
      iceServers: iceServers
    });

    this.configurePeerConnection(x.peerConnection, x.signalingId);

    x.localSdp = await x.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
      voiceActivityDetection: true
    });

    await x.peerConnection?.setLocalDescription(x.localSdp);

    console.log("Creating offer for: ", x);
    Signaler.sendSdp(x.signalingId, getSettings().displayName, x.peerConnection.localDescription);
  }

  private async sendOffers() {
    const iceServers = await Signaler.getIceServers();
    this.peers.forEach(async x => {
      this.sendOffer(x, iceServers);
    })
  }

  private updatePeers = async () => {
    var peerIds = await Signaler.getPeers();

    // Remove any peers that are no longer connected to the server.
    this.peers = this.peers.filter(x => 
      peerIds.some(y => x.signalingId == y && x.peerConnection?.connectionState == "connected"));

    // Add missing peers.
    peerIds.forEach(x => {
      if (!this.peers.some(y => y.signalingId == x)) {
        this.peers.push({ signalingId: x });
      }
    })
  }
}

export const SessionContextData = new SessionContextState();
export const SessionContext = React.createContext(SessionContextData);