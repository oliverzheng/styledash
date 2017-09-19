/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import ComponentExample from './ui/ComponentExample';

type PropType = {
  newExampleTitle: string,
  component: {
    name: string,
    compiledBundleURI: string,
    repository: {
      externalCSSURI: ?string,
    },
  },
  relay: Object,
};

class ComponentNewExampleWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component, newExampleTitle} = this.props;
    const {repository} = component;

    return (
      <ComponentExample
        exampleID={newExampleTitle}
        initialCode={
          '// Type an example of how to use <' + component.name + '> here'
        }
        component={{
          name: component.name,
          compiledBundleURI: component.compiledBundleURI,
        }}
        repository={{
          externalCSSURI: repository.externalCSSURI,
        }}
        showRevert={false}
        canSaveInitialCode={true}
        onSave={this._saveNewExample}
      />
    );
  }

  _saveNewExample = (code: string) => {
  }
}

const ComponentNewExampleWithDataContainer = Relay.createContainer(
  ComponentNewExampleWithData,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
          name
          compiledBundleURI
          repository {
            externalCSSURI
          }
        }
      `,
    },
  },
);

export default ComponentNewExampleWithDataContainer;
