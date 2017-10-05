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

import {
  SERVER_GRAPHQL_PATH,
  MAIN_SITE_PATH,
  REPOSITORY_LIST_PATH,
  REPOSITORY_PATH,
  NEW_REPOSITORY_PATH,
  COMPONENT_PATH,
  LOGIN_PATH,
  LOGOUT_PATH,
} from '../clientserver/urlPaths';
import {
  genIsLoggedIn,
  genLogOut,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from './util/authentication';

import RepositoryListPage from './pages/RepositoryListPage';
import LoginPage from './pages/LoginPage';
import RepositoryPage from './pages/RepositoryPage';
import RepositorySettingsPage from './pages/RepositorySettingsPage';
import NewRepositoryPage from './pages/NewRepositoryPage';
import ComponentPage from './pages/ComponentPage';

import './App.css';

export default class App extends React.Component<*> {

  static htmlBodyClassName = 'App-htmlBody';

  componentWillMount(): void {
    Relay.injectNetworkLayer(
      new Relay.DefaultNetworkLayer(
        SERVER_GRAPHQL_PATH,
        {
          credentials: 'same-origin',
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
        browserHistory.push(LOGIN_PATH);
      }
      // If we are logged in, everything is fine.

    } else {
      // Already knew if we were logged in. Login status changed.

      if (!prevIsLoggedIn) {
        // Just logged in. Use replace() instead of push() here, so the /login
        // in the history is removed.
        browserHistory.replace(REPOSITORY_LIST_PATH);
      } else {
        // Just got logged out. We want to do a full page refresh here, because
        // we want to clear all JS in-memory caches. If Relay actually supported
        // clearing the cache, we could do that here too instead of a full page
        // reload.
        // Use .replace() here, since we are already on the /logout url. Remove
        // that from the stack history.
        window.location.replace(MAIN_SITE_PATH);
      }
    }
  }

  render(): React$Element<*> {
    return (
      <Router
        history={browserHistory}
        render={applyRouterMiddleware(useRelay)}
        onUpdate={this._onUpdate}
        environment={Relay.Store}>
        <Route
          path={REPOSITORY_LIST_PATH}
          component={RepositoryListPage}
          queries={RepositoryListPage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path={LOGIN_PATH}
          component={LoginPage}
        />
        <Route
          path={LOGOUT_PATH}
          component={LoginPage}
          onEnter={this._logout}
        />
        {
          /* This has to be before :repositoryID, otherwise it'll take
           * precedence. It's janky because now this component needs to actually
           * know what the path of this is. But the url looks nice. */
        }
        <Route
          path={`${NEW_REPOSITORY_PATH}`}
          component={NewRepositoryPage}
          queries={NewRepositoryPage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path={`${REPOSITORY_PATH}/:repositoryID`}
          component={RepositoryPage}
          queries={RepositoryPage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path={`${REPOSITORY_PATH}/:repositoryID/settings`}
          component={RepositorySettingsPage}
          queries={RepositorySettingsPage.queries}
          onEnter={this._requireAuth}
        />
        <Route
          path={`${COMPONENT_PATH}/:componentID`}
          component={ComponentPage}
          queries={ComponentPage.queries}
          onEnter={this._requireAuth}
        />
      </Router>
    );
  }

  _onUpdate() {
    // React-router doesn't scroll to top on page navigations. :|
    // `this` is actually the router for this callback
    const {action} = (this: any).state.location;
    if (action !== 'POP') {
      window.scrollTo(0, 0);
    }
  }

  async _requireAuth(_: Object, replace: Function, callback: Function) {
    const isLoggedIn = await genIsLoggedIn();
    if (!isLoggedIn) {
      replace(LOGIN_PATH);
    }
    callback();
  }

  async _logout(_: Object, replace: Function, callback: Function) {
    await genLogOut();

    // Purposely not call callback() so that the window-based replace happens
    // first, and the logout screen isn't flashed twice.
  }
}
