/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import invariant from 'invariant';

import ComponentExample from './ui/ComponentExample';
import SetExampleCodeMutation from './mutations/SetExampleCodeMutation';

type PropType = {
  example: {
    name: string,
    exampleID: string,
    code: string,
    component: {
      name: string,
      repository: {
        externalCSSURI: ?string,
        rootCSS: ?string,
        currentCompilation: ?{
          compiledBundleURI: string,
        },
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
    const {currentCompilation} = repository;

    invariant(currentCompilation, 'Compilation must not be null');

    return (
      <ComponentExample
        exampleID={example.exampleID}
        initialCode={example.code}
        component={{
          name: component.name,
        }}
        repository={{
          externalCSSURI: repository.externalCSSURI,
          rootCSS: repository.rootCSS,
          currentCompilation: currentCompilation,
        }}
        showRevert={true}
        onSave={this._onSave}
      />
    );
  }

  _onSave = (code: string, serializedElement: ?string) => {
    this.props.relay.commitUpdate(
      new SetExampleCodeMutation({
        example: this.props.example,
        code,
        serializedElement,
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
            repository {
              externalCSSURI
              rootCSS
              currentCompilation {
                compiledBundleURI
              }
            }
          }
          ${SetExampleCodeMutation.getFragment('example')}
        }
      `,
    },
  },
);

export default ComponentExampleWithDataContainer;
