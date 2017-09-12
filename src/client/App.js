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
import window from 'global/window';

import {SERVER_GRAPHQL_ADDRESS} from '../clientserver/serverConfig';
import {
  genIsLoggedIn,
  genLogOut,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from './util/authentication';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RepositoryPage from './pages/RepositoryPage';
import ComponentPage from './pages/ComponentPage';

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
    if (prevIsLoggedIn == null) {
      // Just found out if we are logged in or not

      if (!isLoggedIn) {
        // Turns out we aren't logged in
        browserHistory.push('/login');
      }
      // If we are logged in, everything is fine.

    } else {
      // Already knew if we were logged in. Login status changed.

      if (!prevIsLoggedIn) {
        // Just logged in. Use replace() instead of push() here, so the /login
        // in the history is removed.
        browserHistory.replace('/');
      } else {
        // Just got logged out. We want to do a full page refresh here, because
        // we want to clear all JS in-memory caches. If Relay actually supported
        // clearing the cache, we could do that here too instead of a full page
        // reload.
        // Use .replace() here, since we are already on the /logout url. Remove
        // that from the stack history.
        window.location.replace('/');
      }
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
    await genLogOut();

    // Purposely not call callback() so that the window-based replace happens
    // first, and the logout screen isn't flashed twice.
  }
}
