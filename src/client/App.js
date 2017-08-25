/** @flow */

import React from 'react';
import invariant from 'invariant';
import Relay from 'react-relay/classic';
import URI from 'url-parse';

import HomePage from './HomePage';
import RepositoryPage from './RepositoryPage';
import ComponentPage from './ComponentPage';
import {
  HomeRoute,
  RepositoryRoute,
  ComponentRoute,
} from './routes';


function getComponentForRoute(route: Relay.Route) {
  if (route instanceof HomeRoute) {
    return HomePage;
  } else if (route instanceof RepositoryRoute) {
    return RepositoryPage;
  } else if (route instanceof ComponentRoute) {
    return ComponentPage;
  }

  invariant(false, 'Missing route->component mapping');
}

function getRouteFromURI(uriStr: string): ?Relay.Route {
  const uri = new URI(uriStr);
  // TODO
  if (uri.pathname === '/') {
    return new HomeRoute();
  } else if (uri.pathname === '/repository/17/') {
    return new RepositoryRoute({repositoryID: '17'});
  } else if (uri.pathname === '/component/11/') {
    return new ComponentRoute({componentID: '11'});
  }

  return null;
}


type PropType = {
  graphQLURI: string,
};

type StateType = {
  route: Relay.Route,
};

export default class App extends React.Component<PropType, StateType> {
  state = {
    route: new HomeRoute(),
  };

  componentWillMount(): void {
    Relay.injectNetworkLayer(
      new Relay.DefaultNetworkLayer(this.props.graphQLURI),
    );
  }

  render(): React$Element<*> {
    return (
      <div onClick={this._onClick}>
        <Relay.RootContainer
          Component={getComponentForRoute(this.state.route)}
          route={this.state.route}
          renderLoading={this._renderLoading}
          renderFetched={this._renderFetched}
        />
      </div>
    );
  }

  _renderLoading = (): React$Element<*> => {
    return <div>Loading</div>;
  }

  _renderFetched = (data: Object): React$Element<*> => {
    const Component = getComponentForRoute(this.state.route);
    return (
      <Component {...data} />
    );
  }


  _onClick = (e: SyntheticEvent<*>) => {
    const {target} = e;
    if (target instanceof HTMLAnchorElement) {
      const route = getRouteFromURI(target.href);
      if (route) {
        e.preventDefault();
        e.stopPropagation();

        this.setState({route});
      }
    }
  }
}
