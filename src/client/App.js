/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import {
  applyRouterMiddleware,
  browserHistory,
  Route,
  Router,
} from 'react-router';
import useRelay from 'react-router-relay';

import {SERVER_GRAPHQL_ADDRESS} from '../serverConfig';
import {
  genIsLoggedIn,
  genLogOut,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from './authentication';

import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RepositoryPage from './RepositoryPage';
import ComponentPage from './ComponentPage';

export default class App extends React.Component<*> {
  componentWillMount(): void {
    Relay.injectNetworkLayer(
      new Relay.DefaultNetworkLayer(
        SERVER_GRAPHQL_ADDRESS,
        {
          // TODO change this to same-origin when we aren't on react hotloading
          // anymore.
          credentials: 'include',
        },
      ),
    );

    addLoginStatusChangeListener(this._onLoginChange);
  }

  componentWillUnmount() {
    removeLoginStatusChangeListener(this._onLoginChange);
  }

  _onLoginChange = (prevIsLoggedIn: ?boolean, isLoggedIn: boolean) => {
    if (!isLoggedIn) {
      browserHistory.push('/login');
    } else if (prevIsLoggedIn === false) {
      // Just logged in
      browserHistory.push('/');
    } else /* prevIsLoggedIn == null */{
      // Purposely do nothing. This is when we just found out the status of the
      // login
    }
  }

  render(): React$Element<*> {
    return (
      <Router
        history={browserHistory}
        render={applyRouterMiddleware(useRelay)}
        environment={Relay.Store}>
        <Route
          path="/"
          component={HomePage}
          queries={HomePage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path="/login"
          component={LoginPage}
        />
        <Route
          path="/logout"
          component={LoginPage}
          onEnter={this._logout}
        />
        <Route
          path="repository/:repositoryID"
          component={RepositoryPage}
          queries={RepositoryPage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path="component/:componentID"
          component={ComponentPage}
          queries={ComponentPage.queries}
          onEnter={this._requireAuth}
        />
      </Router>
    );
  }

  async _requireAuth(_: Object, replace: Function, callback: Function) {
    const isLoggedIn = await genIsLoggedIn();
    if (!isLoggedIn) {
      replace('/login');
    }
    callback();
  }

  async _logout(_: Object, replace: Function, callback: Function) {
    // We want to logout before navigating to the page, so the page doesn't have
    // a flash of "logged in"
    await genLogOut();
    callback();
  }
}
