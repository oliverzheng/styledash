/** @flow */

import React from 'react';

import loadComponentBundle from '../util/loadComponentBundle';
import getRenderElement from './getRenderElement';

import {SERVER_ADDRESS} from '../../clientserver/serverConfig';

import './ComponentRenderer.css';

export type ComponentRendererProps = {
  transformedCode: string,
  component: {
    name: string,
    compiledBundleURI: string,
  },
  repository: {
    externalCSSURI: ?string,
  },
};

type StateType = {
  bundledComponent: ?Class<React.Component<*>>,
};

export default class ComponentRenderer extends React.Component<ComponentRendererProps, StateType> {
  state = {
    bundledComponent: null,
  };

  componentDidMount(): void {
    this._loadComponentBundle(this.props.component.compiledBundleURI);
  }

  componentWillReceiveProps(nextProps: ComponentRendererProps): void {
    const {compiledBundleURI} = nextProps.component;
    if (
      compiledBundleURI !== this.props.component.compiledBundleURI
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
    const bundledComponent = this.state.bundledComponent;
    if (!bundledComponent) {
      return null;
    }

    const {transformedCode, component, repository} = this.props;

    let externalCSSStyle = null;
    if (repository.externalCSSURI) {
      externalCSSStyle = (
        <link href={repository.externalCSSURI} rel="stylesheet" />
      );
    }

    return (
      <div className="ComponentRenderer-root">
        {externalCSSStyle}
        {getRenderElement(component.name, bundledComponent, transformedCode)}
      </div>
    );
  }
}
