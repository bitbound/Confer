import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { SessionDto } from '../interfaces/SessionDto';
import { Signaler } from './SignalingService';
import { EventEmitter } from 'events';
import { Peer } from '../interfaces/Peer';
import { EventEmitterEx } from '../utils/EventEmitterEx';


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

      Signaler.onConnectionStateChanged.subscribe(this.signalerStateChanged);
      Signaler.connect();
    }
  }


  public update() {
    this.stateUpdated.publish(this);
  }

  private async sendOffers() {
    const iceServers = await Signaler.getIceServers();
    this.peers.forEach(async x => {
      x.peerConnection = new RTCPeerConnection({
        iceServers: iceServers
      });

      x.localSdp = await x.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: true
      });

      Signaler.sendSdp(x.signalingId, x.peerConnection.localDescription);
    })
  }

  private signalerStateChanged = async (connectionState: HubConnectionState) => {
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

  private updatePeers = async () => {
    var peerIds = await Signaler.getPeers();

    // Remove any peers that are no longer connected to the server.
    this.peers = this.peers.filter(x => 
      peerIds.some(y => x.signalingId == y && x.peerConnection?.connectionState == "connected"));

    // Add missing peers.
    if (peerIds.length > 0) {
      peerIds.forEach(x => {
        if (!this.peers.some(y => y.signalingId == x)) {
          this.peers.push({ signalingId: x });
        }
      })
    }
  }
}

export const SessionContextData = new SessionContextState();
export const SessionContext = React.createContext(SessionContextData);