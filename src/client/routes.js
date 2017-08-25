/** @flow */

import Relay from 'react-relay/classic';

export class HomeRoute extends Relay.Route {
  static queries = {
    viewer: () => Relay.QL`
      query {
        viewer
      }
    `,
  };
  static paramDefinitions = {};
  static routeName = 'HomeRoute';
}

export class RepositoryRoute extends Relay.Route {
  static queries = {
    repository: () => Relay.QL`
      query {
        repository(repositoryID: $repositoryID)
      }
    `,
    viewer: () => Relay.QL`
      query {
        viewer
      }
    `,
  };
  static paramDefinitions = {
    repositoryID: {required: true},
  };
  static routeName = 'RepositoryRoute';
}

export class ComponentRoute extends Relay.Route {
  static queries = {
    component: () => Relay.QL`
      query {
        component(componentID: $componentID)
      }
    `,
    viewer: () => Relay.QL`
      query {
        viewer
      }
    `,
  };
  static paramDefinitions = {
    componentID: {required: true},
  };
  static routeName = 'ComponentRoute';
}
