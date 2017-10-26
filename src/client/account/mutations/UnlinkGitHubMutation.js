/** @flow */

import Relay from 'react-relay/classic';
import RelayMutationType from 'react-relay/lib/RelayMutationType';

export default class UnlinkGitHubMutation extends Relay.Mutation {
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
        unlinkGitHub
      }
    `;
  }

  getVariables() {
    return {};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UnlinkGitHubPayload {
        viewer {
          githubAccess {
            id
          }
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: RelayMutationType.FIELDS_CHANGE,
      fieldIDs: {
        viewer: this.props.viewer.id,
      },
    }];
  }
}
