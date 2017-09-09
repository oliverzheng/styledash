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

import HomePage from './HomePage';
import RepositoryPage from './RepositoryPage';
import ComponentPage from './ComponentPage';

type PropType = {
  graphQLURI: string,
};

export default class App extends React.Component<PropType> {
  componentWillMount(): void {
    Relay.injectNetworkLayer(
      new Relay.DefaultNetworkLayer(
        this.props.graphQLURI,
        {
          // TODO change this to same-origin when we aren't on react hotloading
          // anymore.
          credentials: 'include',
        },
      ),
    );
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
        />
        <Route
          path="repository/:repositoryID"
          component={RepositoryPage}
          queries={RepositoryPage.queries}
        />
        <Route
          path="component/:componentID"
          component={ComponentPage}
          queries={ComponentPage.queries}
        />
      </Router>
    );
  }
}
