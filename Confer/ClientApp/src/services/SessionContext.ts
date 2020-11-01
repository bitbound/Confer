import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { SessionDto } from '../interfaces/SessionDto';
import { Signaler } from './SignalingService';
import { EventEmitter } from 'events';
import { Peer } from '../interfaces/Peer';
import { EventEmitterEx } from '../utils/EventEmitterEx';
import { SdpMessage } from '../interfaces/SdpMessage';
import { getSettings } from './SettingsService';
import { loadVideoDevice } from '../utils/MediaHelper';


export class SessionContextState {
  public isSession: boolean = false;
  public sessionChecked: boolean = false;
  public sessionId?: string;
  public sessionInfo?: SessionDto;
  public connectionState: HubConnectionState = HubConnectionState.Connecting;
  public peers: Peer[] = [];
  public readonly stateUpdated: EventEmitterEx<SessionContextState> = new EventEmitterEx();

  constructor() {
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
      Signaler.onPeerLeft.subscribe(this.handlePeerLeft);
      Signaler.onSdpReceived.subscribe(this.handleSdpReceived);
      Signaler.connect();
    }
  }



  public update() {
    this.stateUpdated.publish(this);
  }

  private configurePeerConnection = (pc: RTCPeerConnection, peerId: string) => {
    pc.addEventListener("icecandidate", candidate => {

    });
    pc.addEventListener("connectionstatechange", state => {
      console.log("PeerConnection state changed to: ", state);
    });
    pc.addEventListener("negotiationneeded", () => {

    });
    pc.addEventListener("track", ev => {
      
    });
  }

  
  private handleConnectionStateChanged = async (connectionState: HubConnectionState) => {
    console.log("Connection state changed: ", connectionState);
    this.connectionState = connectionState;
    this.update();

    if (connectionState == HubConnectionState.Connected) {
      this.peers.splice(0);
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

  private handlePeerLeft = (peerId: string) => {
    console.log("Peer left: ", peerId);
  }

  private handleSdpReceived = async (sdpMessage: SdpMessage) => {
    console.log("Received SDP: ", sdpMessage);
    if (sdpMessage.description.type == "offer") {
      var iceServers = await Signaler.getIceServers();

      var pc = new RTCPeerConnection({
        iceServers: iceServers
      });
      
      this.configurePeerConnection(pc, sdpMessage.signalingId);

      await pc.setRemoteDescription(sdpMessage.description);
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.peers.push({
        signalingId: sdpMessage.signalingId,
        displayName: sdpMessage.displayName

      })
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

  private async sendOffers() {
    const iceServers = await Signaler.getIceServers();
    this.peers.forEach(async x => {
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