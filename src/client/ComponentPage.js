/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeader';
import loadComponentBundle from './loadComponentBundle';

import {SERVER_ADDRESS} from '../serverConfig';

type PropType = {
  component: {
    id: string,
    name: string,
    repository: {
      name: string,
    },
    filepath: string,
    compiledBundleURI: string,
  },
  viewer: Object,
};

type StateType = {
  bundledComponent: ?Class<React.Component<*>>,
};

class ComponentPage extends React.Component<PropType, StateType> {
  state = {
    bundledComponent: null,
  };

  componentWillMount(): void {
    this._loadComponentBundle(this.props.component.compiledBundleURI);
  }

  componentWillReceiveProps(nextProps: PropType): void {
    this._loadComponentBundle(nextProps.component.compiledBundleURI);
  }

  _loadComponentBundle(bundleURI: string): void {
    loadComponentBundle(`${SERVER_ADDRESS}${bundleURI}`).then(Component => {
      this.setState({
        bundledComponent: Component,
      });
    });
  }

  render(): React$Element<*> {
    const {component} = this.props;

    const BundledComponent = this.state.bundledComponent;
    let example = null;
    if (BundledComponent) {
      // TODO automatic props
      example = [
        <p key="example-title">Example:</p>,
        <div key="example-render">
          <BundledComponent />
        </div>
      ];
    }

    return (
      <div>
        <PageHeader viewer={this.props.viewer} />
        <h1>
          {component.repository.name} > {component.name}
        </h1>
        <p>Location: {component.filepath}</p>
        {example}
      </div>
    );
  }
}

export default Relay.createContainer(
  ComponentPage,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
          id
          name
          repository {
            name
          }
          filepath
          compiledBundleURI
        }
      `,
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${PageHeader.getFragment('viewer')}
        }
      `,
    },
  },
);
