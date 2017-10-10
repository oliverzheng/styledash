/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import invariant from 'invariant';

import ComponentExample from './ui/ComponentExample';
import AddExampleCodeMutation from './mutations/AddExampleCodeMutation';

type PropType = {
  newExampleName: string,
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
  onSave: () => any,
  relay: Object,
};

class ComponentNewExampleWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component, newExampleName} = this.props;
    const {repository} = component;
    const {currentCompilation} = repository;

    invariant(currentCompilation, 'Compilation must not be null');

    return (
      <ComponentExample
        exampleID={newExampleName}
        initialCode={
          '// Type an example of how to use <' + component.name + '> here'
        }
        component={{
          name: component.name,
        }}
        repository={{
          externalCSSURI: repository.externalCSSURI,
          rootCSS: repository.rootCSS,
          currentCompilation: currentCompilation,
        }}
        showRevert={false}
        canSaveInitialCode={true}
        onSave={this._saveNewExample}
      />
    );
  }

  _saveNewExample = (code: string, serializedElement: ?string) => {
    this.props.relay.commitUpdate(
      new AddExampleCodeMutation({
        component: this.props.component,
        exampleName: this.props.newExampleName,
        code,
        serializedElement,
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
          repository {
            externalCSSURI
            rootCSS
            currentCompilation {
              compiledBundleURI
            }
          }
          ${AddExampleCodeMutation.getFragment('component')}
        }
      `,
    },
  },
);

export default ComponentNewExampleWithDataContainer;
