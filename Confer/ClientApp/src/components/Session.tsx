import { HubConnectionState } from "@microsoft/signalr";
import React, { Component } from "react";
import { SessionDto } from "../interfaces/SessionDto";
import { LoadingAnimation } from "./LoadingAnimation";

interface SessionProps {
    sessionChecked: boolean;
    sessionId?: string;
    sessionInfo?: SessionDto;
    connectionState?: HubConnectionState;
}

interface SessionState {
}

export class Session extends Component<SessionProps, SessionState> {
    render() {
        const {
            sessionId,
            sessionChecked,
            sessionInfo,
            connectionState
        } = this.props;

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
                <h2 className="text-center">Session ID not found.</h2>
            )
        }

        return (
            <div>

            </div>
        )
    }
}