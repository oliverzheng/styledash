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
        repository(id: $repositoryID)
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
