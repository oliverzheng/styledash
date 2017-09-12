/** @flow */

import Relay from 'react-relay/classic';

export default class OverrideComponentReactDocMutation extends Relay.Mutation {
  static fragments = {
    component: () => Relay.QL`
      fragment on Component {
        id
        componentID
      }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation {
        overrideComponentReactDoc
      }
    `;
  }

  getVariables() {
    return {
      componentID: this.props.component.componentID,
      overrideReactDoc: this.props.overrideReactDoc,
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on OverrideComponentReactDocPayload {
        component {
          overrideReactDoc
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        component: this.props.component.id,
      },
    }];
  }
}
