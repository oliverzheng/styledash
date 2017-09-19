/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import ComponentExample from './ui/ComponentExample';
import SetExampleCodeMutation from './mutations/SetExampleCodeMutation';

type PropType = {
  example: {
    name: string,
    exampleID: string,
    code: string,
    component: {
      name: string,
      compiledBundleURI: string,
      repository: {
        externalCSSURI: ?string,
      },
    },
  },
  relay: Object,
};

class ComponentExampleWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {example} = this.props;
    const {component} = example;
    const {repository} = component;

    return (
      <ComponentExample
        exampleID={example.exampleID}
        initialCode={example.code}
        component={{
          name: component.name,
          compiledBundleURI: component.compiledBundleURI,
        }}
        repository={{
          externalCSSURI: repository.externalCSSURI,
        }}
        showRevert={true}
        onSave={this._onSave}
      />
    );
  }

  _onSave = (code: string) => {
    this.props.relay.commitUpdate(
      new SetExampleCodeMutation({
        example: this.props.example,
        code,
      }),
    );
  }
}

const ComponentExampleWithDataContainer = Relay.createContainer(
  ComponentExampleWithData,
  {
    fragments: {
      example: () => Relay.QL`
        fragment on Example {
          name
          exampleID
          code
          component {
            name
            compiledBundleURI
            repository {
              externalCSSURI
            }
          }
          ${SetExampleCodeMutation.getFragment('example')}
        }
      `,
    },
  },
);

export default ComponentExampleWithDataContainer;
