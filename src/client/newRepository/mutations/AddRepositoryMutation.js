/** @flow */

import Relay from 'react-relay/classic';
import RelayMutationType from 'react-relay/lib/RelayMutationType';

export default class AddRepositoryMutation extends Relay.Mutation {
  static fragments = {
  };

  getMutation() {
    return Relay.QL`
      mutation {
        addRepository
      }
    `;
  }

  getVariables() {
    return {
      name: this.props.name,
      githubUser: this.props.githubUser,
      githubRepo: this.props.githubRepo,
      githubToken: this.props.githubToken,
      rootCSS: this.props.rootCSS,
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on AddRepositoryPayload {
        repository {
          id
          repositoryID
        }
      }
    `;
  }

  static getRepositoryIDFromResponse(response: Object): ?string {
    const repo = response.addRepository.repository;
    if (!repo) {
      return null;
    }
    return repo.repositoryID;
  }

  getConfigs() {
    return [{
      type: RelayMutationType.REQUIRED_CHILDREN,
      children: [
        Relay.QL`
          fragment on AddRepositoryPayload {
            repository {
              repositoryID
            }
          }
        `,
      ],
    }];
  }
}
