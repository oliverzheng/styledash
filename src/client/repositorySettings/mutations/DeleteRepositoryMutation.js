/** @flow */

import Relay from 'react-relay/classic';

export default class DeleteRepositoryMutation extends Relay.Mutation {
  static fragments = {
    repository: () => Relay.QL`
      fragment on Repository {
        repositoryID
      }
    `,
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation {
        deleteRepository
      }
    `;
  }

  getVariables() {
    return {
      repositoryID: this.props.repository.repositoryID,
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on DeleteRepositoryPayload {
        viewer {
          repositories {
            id
          }
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        viewer: this.props.viewer.id,
      },
    }];
  }
}
