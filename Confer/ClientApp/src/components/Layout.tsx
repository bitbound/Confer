import React, { Component } from 'react';
import { Sidebar } from './Sidebar';
import { getWindowSize, WindowSize } from '../utils/UI';
import { FaBars } from 'react-icons/fa';
import './Layout.css';
import { Navbar, NavbarBrand } from 'reactstrap';
import authService from './api-authorization/AuthorizeService';
import { If } from './If';
import { Session } from './Session';
import { Route } from 'react-router-dom';
import { SessionContext } from '../services/SessionContext';

interface LayoutProps { }
interface LayoutState {
  isSidebarOpen: boolean;
  isSidebarFixed: boolean;
  username?: string;
}

export class Layout extends Component<LayoutProps, LayoutState> {
  static displayName = Layout.name;
  static contextType = SessionContext;
  context!: React.ContextType<typeof SessionContext>;
  
  subscription: number = 1;

  constructor(props: LayoutProps) {
    super(props);

    this.state = {
      isSidebarOpen: this.shouldSidebarBeFixed(),
      isSidebarFixed: this.shouldSidebarBeFixed()
    }
  }

  componentDidMount() {
    //this.subscription = authService.subscribe(() => this.setUser());
    //this.setUser();

    window.addEventListener("resize", this.onWindowResized);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResized);
    //authService.unsubscribe();
  }

  shouldSidebarBeFixed() {
    return getWindowSize() !== WindowSize.Small;
  }

  onWindowResized = () => {
    this.setState({
      isSidebarOpen: this.shouldSidebarBeFixed(),
      isSidebarFixed: this.shouldSidebarBeFixed()
    });
  }


  render() {
    if (this.context?.isSession) {
      return this.renderMainContent(false);
    }

    var gridTemplate = this.state.isSidebarFixed ?
      "auto 1fr" :
      "1fr";

    return (
      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gridColumnGap: "5px", height: "100%" }}>
        <Sidebar
          isOpen={this.state.isSidebarOpen}
          isFixed={this.state.isSidebarFixed}
          onSidebarClosed={() => this.setState({ isSidebarOpen: false })} />

        {this.renderMainContent(true)}
      </div>
    );
  }

  private renderMainContent(menuVisible: boolean) {
    const {
      isSession,
      sessionId,
      sessionChecked,
      sessionInfo,
      connectionState
    } = this.context;

    const {
      logoUrl,
      pageBackgroundColor,
      titleBackgroundColor,
      titleText,
      titleTextColor
    } = this.context.sessionInfo || {};

    var menuButtonClass = this.state.isSidebarOpen ?
      "navbar-toggler menu-button hidden" :
      "navbar-toggler menu-button";

    return (
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gridRowGap: "10px" }}>
        <header>
          <Navbar
            className="ng-white box-shadow mb-3 justify-content-start"
            light
            style={{ backgroundColor: titleBackgroundColor }}>
            <If condition={menuVisible}>
              <button type="button" className={menuButtonClass} onClick={() => {
                this.setState({ isSidebarOpen: true });
              }}>
                <FaBars></FaBars>
              </button>
            </If>

            <NavbarBrand>
              <If condition={!!logoUrl}>
                <img src={logoUrl} style={{ height: "40px" }} alt="Branding Logo" />
              </If>
              <If condition={!!titleText}>
                <span style={{
                  color: titleTextColor,
                  fontWeight: "bold",
                  marginLeft: "10px"
                }}>
                  {titleText}
                </span>
              </If>
            </NavbarBrand>

          </Navbar>
        </header>

        <div className="container" style={{ maxWidth: "unset", backgroundColor: pageBackgroundColor }}>
          <If condition={!isSession}>
            {this.props.children}
          </If>

          <If condition={isSession}>
            <Route path='/session/:sessionId' component={(props: any) =>
              <Session
                sessionId={sessionId}
                sessionChecked={sessionChecked}
                connectionState={connectionState}
                sessionInfo={sessionInfo}
                {...props} />
            } />
          </If>
        </div>
      </div>
    )
  }


  private async setUser() {
    var user = await authService.getUser();
    this.setState({
      username: user && user.name
    })
  }
}
