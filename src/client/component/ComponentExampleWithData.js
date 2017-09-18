/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import ComponentExample from './ui/ComponentExample';

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
      />
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
        }
      `,
    },
  },
);

export default ComponentExampleWithDataContainer;
