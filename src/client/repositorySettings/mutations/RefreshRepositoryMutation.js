/** @flow */

import Relay from 'react-relay/classic';

export default class RefreshRepositoryMutation extends Relay.Mutation {
  static fragments = {
    repository: () => Relay.QL`
      fragment on Repository {
        repositoryID
      }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation {
        refreshRepository
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
      fragment on RefreshRepositoryPayload {
        repository {
          id
        }
      }
    `;
  }

  getConfigs() {
    return [];
  }
}
