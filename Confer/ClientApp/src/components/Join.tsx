import React, { Component } from "react";
import { match } from "react-router-dom";
import { SessionParams } from "../interfaces/SessionParams";

interface JoinProps {
    match?: match<SessionParams>;
}

interface JoinState {
    sessionChecked: boolean;
    sessionId?: string;
    sessionValid: boolean;
    signalingConnected: boolean;
}


export class Join extends Component<JoinProps, JoinState> {
    constructor(props: JoinProps) {
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
                <h2>Connecting...</h2>
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