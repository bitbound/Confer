import React, { Component } from 'react';
import { Sidebar } from './Sidebar';
import { getWindowSize, WindowSize } from '../utils/UI';
import { FaBars } from 'react-icons/fa';
import './Layout.css';
import { Navbar } from 'reactstrap';
import authService from './api-authorization/AuthorizeService';
import { If } from './If';

interface LayoutProps { }
interface LayoutState {
  isSidebarOpen: boolean;
  isSidebarFixed: boolean;
  username?: string;
}

export class Layout extends Component<LayoutProps, LayoutState> {
  static displayName = Layout.name;
  subscription: number = 1;

  constructor(props: LayoutProps) {
    super(props);

    this.state = {
      isSidebarOpen: this.shouldSidebarBeFixed(),
      isSidebarFixed: this.shouldSidebarBeFixed()
    }
  }

  componentDidMount() {
    window.addEventListener("resize", this.onWindowResized);
    //this.subscription = authService.subscribe(() => this.setUser());
    //this.setUser();
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
    if (window.location.pathname.includes("/session/")) {
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
    var menuButtonClass = this.state.isSidebarOpen ?
      "navbar-toggler menu-button hidden" :
      "navbar-toggler menu-button";

    return (
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gridRowGap: "10px" }}>
        <header>
          <Navbar className="ng-white box-shadow mb-3 justify-content-start" light>
            <If condition={menuVisible}>
              <button type="button" className={menuButtonClass} onClick={() => {
                this.setState({ isSidebarOpen: true });
              }}>
                <FaBars></FaBars>
              </button>
            </If>

          </Navbar>
        </header>

        <div className="container" style={{ maxWidth: "unset" }}>
          {this.props.children}
        </div>
      </div>
    )
  }

  private async setUser() {
    var user = await authService.getUser();
    console.log(user);
    this.setState({
      username: user && user.name
    })
  }
}
