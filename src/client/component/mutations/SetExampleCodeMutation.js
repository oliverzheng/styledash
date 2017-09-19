/** @flow */

import Relay from 'react-relay/classic';

export default class SetExampleCodeMutation extends Relay.Mutation {
  static fragments = {
    example: () => Relay.QL`
      fragment on Example {
        id
        exampleID
      }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation {
        setExampleCode
      }
    `;
  }

  getVariables() {
    return {
      exampleID: this.props.example.exampleID,
      code: this.props.code,
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on SetExampleCodePayload {
        example {
          code
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        example: this.props.example.id,
      },
    }];
  }
}
