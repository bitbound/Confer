import React, { Component } from 'react';
import { AuthAwareContainer } from './AuthAwareContainer';
import { NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import { ApplicationPaths } from './api-authorization/ApiAuthorizationConstants';

export class Home extends Component {
  static displayName = Home.name;

  render() {
    return (
      <div className="text-center">
        <h1 className="mt-2">Welcome to Confer!</h1>
      </div>
    )
    //return (
    //  <AuthAwareContainer
    //    loggedOutRender={this.renderAnonymousPage()}
    //    loggedInRender='' />
    //);
  }


  renderAnonymousPage() {
    return (
      <div className="text-center">
        <h1 className="mt-2">Welcome to Confer!</h1>

        <div className="mb-3">

        </div>

        <div>
          <div className="d-inline-block">
            <button className="btn btn-secondary w-100 my-2">
              <NavLink tag={Link} className="text-light" to={ApplicationPaths.Login}>Login</NavLink>
            </button>
            <br />
            <button className="btn btn-secondary w-100 my-2">
              <NavLink tag={Link} className="text-light" to={ApplicationPaths.Register}>Register</NavLink>
            </button>
          </div>
        </div>
      </div>
    )
  }
}
