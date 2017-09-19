/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import ComponentExample from './ui/ComponentExample';
import AddExampleCodeMutation from './mutations/AddExampleCodeMutation';

type PropType = {
  newExampleName: string,
  component: {
    name: string,
    compiledBundleURI: string,
    repository: {
      externalCSSURI: ?string,
    },
  },
  onSave: () => any,
  relay: Object,
};

class ComponentNewExampleWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component, newExampleName} = this.props;
    const {repository} = component;

    return (
      <ComponentExample
        exampleID={newExampleName}
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
    this.props.relay.commitUpdate(
      new AddExampleCodeMutation({
        component: this.props.component,
        exampleName: this.props.newExampleName,
        code,
      }),
      {
        onSuccess: () => this.props.onSave(),
      },
    );
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
          ${AddExampleCodeMutation.getFragment('component')}
        }
      `,
    },
  },
);

export default ComponentNewExampleWithDataContainer;
