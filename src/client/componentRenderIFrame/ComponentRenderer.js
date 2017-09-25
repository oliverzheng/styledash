/** @flow */

import React from 'react';

import loadComponentBundle from '../util/loadComponentBundle';
import getRenderElement from './getRenderElement';
import {
  type SerializedElement,
  serializeElementWithStyles,
} from '../util/elementWithStylesSerialization';

import './ComponentRenderer.css';

export type ComponentRendererProps = {
  transformedCode: string,
  component: {
    name: string,
    compiledBundleURI: string,
  },
  repository: {
    externalCSSURI: ?string,
    rootCSS: ?string,
  },
  // eslint-disable-next-line no-use-before-define
  onRender: (renderer: ComponentRenderer) => any,
};

type StateType = {
  bundledComponent: ?Class<React.Component<*>>,
};

export default class ComponentRenderer extends React.Component<ComponentRendererProps, StateType> {
  _root: ?HTMLDivElement;

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
    loadComponentBundle(`${bundleURI}`).then(Component => {
      this.setState({
        bundledComponent: Component,
      });
    });
  }

  serializeRender(): ?SerializedElement {
    if (this._root == null) {
      console.log('no root');
      return null;
    }
    const child = this._root.childNodes[0];
    if (child instanceof HTMLElement) {
      return serializeElementWithStyles(child);
    }
    console.log('child weird', this._root.childNodes);
    return null;
  }

  componentDidUpdate() {
    if (this.state.bundledComponent != null) {
      this.props.onRender(this);
    }
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
    let rootCSSStyle = null;
    if (repository.rootCSS) {
      rootCSSStyle = (
        <style dangerouslySetInnerHTML={{__html: repository.rootCSS}} />
      );
    }

    return (
      <div className="Styledash-render-root">
        {externalCSSStyle}
        {rootCSSStyle}
        <div className="ComponentRenderer-root" ref={c => this._root = c}>
          {getRenderElement(component.name, bundledComponent, transformedCode)}
        </div>
      </div>
    );
  }
}
