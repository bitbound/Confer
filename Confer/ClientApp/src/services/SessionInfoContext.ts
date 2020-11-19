import React from 'react';
import { SessionDto } from '../interfaces/SessionDto';
import { Signaler } from './SignalingService';
import { EventEmitterEx } from '../utils/EventEmitterEx';

export class SessionInfoContextState {
  public isSession: boolean = false;
  public sessionChecked: boolean = false;
  public sessionId?: string;
  public sessionInfo?: SessionDto;
  public sessionJoined: boolean = false;
  public readonly stateUpdated: EventEmitterEx<SessionInfoContextState> = new EventEmitterEx();

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
    }
  }

  public getSessionInfo = async () => {
    var sessionInfo = await Signaler.getSessionInfo(String(this.sessionId));
    this.setSessionInfo(false, sessionInfo);
  }

  public joinSession = async () => {
    var sessionInfo = await Signaler.joinSession(String(this.sessionId));
    this.setSessionInfo(true, sessionInfo);
  }

  private setSessionInfo = (joined: boolean, sessionInfo?: SessionDto) => {
    if (this.isSession && sessionInfo) {
      document.body.style.backgroundColor = sessionInfo.pageBackgroundColor;
      document.body.style.color = sessionInfo.pageTextColor;
    }
    this.sessionInfo = sessionInfo;
    this.sessionChecked = true;
    this.sessionJoined = joined;
    this.update();
  }

  public update = () => {
    this.stateUpdated.publish(this);
  }
}

export const SessionInfoContextData = new SessionInfoContextState();
export const SessionInfoContext = React.createContext(SessionInfoContextData);