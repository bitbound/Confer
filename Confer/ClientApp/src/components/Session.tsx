import React, { Component } from "react";
import { match } from "react-router-dom";
import { SessionParams } from "../interfaces/SessionParams";
import { LoadingAnimation } from "./LoadingAnimation";

interface SessionProps {
  match?: match<SessionParams>;
}

interface SessionState {
  sessionChecked: boolean;
  sessionId?: string;
  sessionValid: boolean;
  signalingConnected: boolean;
}

export class Session extends Component<SessionProps, SessionState> {
  constructor(props: SessionProps) {
    super(props);

    const sessionId = this.props.match
      && this.props.match.params.sessionId;

    this.state = {
      sessionId: sessionId,
      sessionChecked: false,
      sessionValid: false,
      signalingConnected: false
    }
  }

  componentDidMount() {

  }

  render() {
    const {
      sessionId,
      sessionChecked,
      sessionValid,
      signalingConnected
    } = this.state;

    if (!signalingConnected) {
      return (
        <LoadingAnimation message="Connecting"></LoadingAnimation>
      )
    }

    if (!sessionChecked) {
      return (
        <h2>Finding session...</h2>
      )
    }

    if (!sessionValid) {
      return (
        <h2>Session ID not found.</h2>
      )
    }

    return (
      <div>

      </div>
    )
  }
}