import React, { Component } from "react"
import "./LoadingAnimation.css"

interface LoadingAnimationProps {
    message: string;
}

export class LoadingAnimation extends Component<LoadingAnimationProps> {
    render() {
        return (
            <div className="signal-container">
                <div className="signal mb-3"></div>
                <h4>
                    {this.props.message}
                </h4>
            </div>
        )
    }
}