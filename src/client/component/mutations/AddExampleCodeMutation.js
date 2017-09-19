/** @flow */

import Relay from 'react-relay/classic';

export default class AddExampleCodeMutation extends Relay.Mutation {
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
        addExampleCode
      }
    `;
  }

  getVariables() {
    return {
      componentID: this.props.component.componentID,
      exampleName: this.props.exampleName,
      code: this.props.code,
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on AddExampleCodePayload {
        component {
          examples
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
