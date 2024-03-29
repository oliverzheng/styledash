/** @flow */

import Relay from 'react-relay/classic';
import RelayMutationType from 'react-relay/lib/RelayMutationType';

export default class AddRepositoryMutation extends Relay.Mutation {
  static fragments = {
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,
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
      githubRepoID: this.props.githubRepoID,
      githubRepoOwner: this.props.githubRepoOwner,
      githubRepoName: this.props.githubRepoName,
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
        viewer {
          id
          repositories {
            id
          }
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
    }, {
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        viewer: this.props.viewer.id,
      },
    }];
  }
}
