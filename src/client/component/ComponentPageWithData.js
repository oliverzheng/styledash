/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import ComponentPageWithMenu from './ui/ComponentPageWithMenu';

import OverrideComponentReactDocMutation from './mutations/OverrideComponentReactDocMutation';

type PropType = {
  component: ?{
    componentID: string,
    name: string,
    repository: {
      name: string,
      externalCSSURI: ?string,
    },
    filepath: string,
    compiledBundleURI: string,
    reactDoc: string,
    overrideReactDoc: ?string,
  },
  relay: Object,
};

class ComponentPageWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component} = this.props;
    if (!component) {
      // TODO 404
      return null;
    }

    return (
      <ComponentPageWithMenu
        component={component}
        updateComponentOverrideReactDoc={this._updateComponentOverrideReactDoc}
      />
    );
  }

  _updateComponentOverrideReactDoc = (override: string) => {
    this.props.relay.commitUpdate(
      new OverrideComponentReactDocMutation({
        component: this.props.component,
        overrideReactDoc: override,
      }),
    );
  }
}

const ComponentPageWithDataContainer = Relay.createContainer(
  ComponentPageWithData,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
          ${OverrideComponentReactDocMutation.getFragment('component')}
          componentID
          name
          repository {
            name
            externalCSSURI
          }
          filepath
          compiledBundleURI
          reactDoc
          overrideReactDoc
        }
      `,
    },
  },
);

export default ComponentPageWithDataContainer;