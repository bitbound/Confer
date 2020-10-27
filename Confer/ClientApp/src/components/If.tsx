import { Component } from "react";

interface IfProps {
    condition: boolean;
}

export class If extends Component<IfProps> {
    render() {
        if (this.props.condition) {
            return this.props.children;
        }
        return '';
    }
}