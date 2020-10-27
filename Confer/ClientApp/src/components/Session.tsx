import { HubConnectionState } from "@microsoft/signalr";
import React, { Component } from "react";
import { match } from "react-router-dom";
import { SessionParams } from "../interfaces/SessionParams";
import { Signaler } from "../services/SignalingService";
import { LoadingAnimation } from "./LoadingAnimation";

interface SessionProps {
    match?: match<SessionParams>;
}

interface SessionState {
    sessionChecked: boolean;
    sessionId?: string;
    sessionValid: boolean;
    connectionState: HubConnectionState;
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
            connectionState: HubConnectionState.Connecting
        }
    }

    async componentDidMount() {
        await Signaler.connect(this.signalerStateChanged);
    }

    render() {
        const {
            sessionId,
            sessionChecked,
            sessionValid,
            connectionState
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

        if (!sessionValid) {
            return (
                <h2 className="text-center">Session ID not found.</h2>
            )
        }

        return (
            <div>

            </div>
        )
    }

    signalerStateChanged = async (state: HubConnectionState) => {
        this.setState({
            connectionState: state,
        })

        if (state == HubConnectionState.Connected) {
            this.setState({
                sessionChecked: false,
                sessionValid: false
            })
            // TODO: Clear previous MediaStreams.
            var isSessionValid = await Signaler.validateSessionId(String(this.state.sessionId));
            this.setState({
                sessionChecked: true,
                sessionValid: isSessionValid
            })
        }
    }
}