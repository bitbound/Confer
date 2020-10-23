import { Component } from "react";
import authService from "./api-authorization/AuthorizeService";

interface AuthAwareContainerProps {
    loggedInRender: React.ReactNode;
    loggedOutRender: React.ReactNode;
}
interface AuthAwareContainerState {
    authCheckCompleted: boolean;
    isAuthenticated: boolean;
    userName?: string;
};

export class AuthAwareContainer extends Component<AuthAwareContainerProps, AuthAwareContainerState> {
    constructor(props: AuthAwareContainerProps) {
        super(props);
        
        this.state = {
            authCheckCompleted: false,
            isAuthenticated: false
        };
    }

    _subscription: number = -1;

    componentDidMount() {
        this._subscription = authService.subscribe(() => this.populateState());
        this.populateState();
    }

    componentWillUnmount() {
        authService.unsubscribe(this._subscription);
    }

    async populateState() {
        const [isAuthenticated, user] = await Promise.all([authService.isAuthenticated(), authService.getUser()])
        this.setState({
            authCheckCompleted: true,
            isAuthenticated,
            userName: user && user.name
        });
    }

    render() {
        if (!this.state.authCheckCompleted){
            return null;
        }

        if (this.state.isAuthenticated){
            return this.props.loggedInRender;
        }

        return this.props.loggedOutRender;
    }
}
