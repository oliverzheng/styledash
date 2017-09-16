/** @flow */

import React from 'react';

import loadComponentBundle from '../util/loadComponentBundle';

import {SERVER_ADDRESS} from '../../clientserver/serverConfig';

type PropType = {
  compiledBundleURI: string,
  externalCSSURI: ?string,
};

type StateType = {
  bundledComponent: ?Class<React.Component<*>>,
};

export default class ComponentRenderer extends React.Component<PropType, StateType> {
  state = {
    bundledComponent: null,
  };

  componentDidMount(): void {
    this._loadComponentBundle(this.props.compiledBundleURI);
  }

  componentWillReceiveProps(nextProps: PropType): void {
    const {compiledBundleURI} = nextProps;
    if (
      compiledBundleURI !== this.props.compiledBundleURI
    ) {
      this._loadComponentBundle(compiledBundleURI);
    }
  }

  _loadComponentBundle(bundleURI: string): void {
    loadComponentBundle(`${SERVER_ADDRESS}${bundleURI}`).then(Component => {
      this.setState({
        bundledComponent: Component,
      });
    });
  }

  render(): ?React$Element<*> {
    const BundledComponent = this.state.bundledComponent;
    if (!BundledComponent) {
      return null;
    }

    let externalCSSStyle = null;
    if (this.props.externalCSSURI) {
      externalCSSStyle = (
        <link href={this.props.externalCSSURI} rel="stylesheet" />
      );
    }

    return (
      <div>
        {externalCSSStyle}
        <BundledComponent />
      </div>
    );
  }
}
