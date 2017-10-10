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
  },
  repository: {
    externalCSSURI: ?string,
    rootCSS: ?string,
    currentCompilation: {
      compiledBundleURI: string,
    },
  },
  // eslint-disable-next-line no-use-before-define
  onRender: (renderer: ComponentRenderer) => any,
};

type StateType = {
  compiledBundle: ?{[componentName: string]: Class<React.Component<*>>},
};

export default class ComponentRenderer extends React.Component<ComponentRendererProps, StateType> {
  _root: ?HTMLDivElement;

  state = {
    compiledBundle: null,
  };

  componentDidMount(): void {
    this._loadComponentBundle(
      this.props.repository.currentCompilation.compiledBundleURI,
    );
  }

  componentWillReceiveProps(nextProps: ComponentRendererProps): void {
    const {compiledBundleURI} = nextProps.repository.currentCompilation;
    if (
      compiledBundleURI !== this.props.repository.currentCompilation.compiledBundleURI
    ) {
      this._loadComponentBundle(compiledBundleURI);
    }
  }

  _loadComponentBundle(bundleURI: string): void {
    loadComponentBundle(`${bundleURI}`).then(compiledBundle => {
      this.setState({
        compiledBundle,
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
    if (this.state.compiledBundle != null) {
      this.props.onRender(this);
    }
  }

  render(): ?React$Element<*> {
    const compiledBundle = this.state.compiledBundle;
    if (!compiledBundle) {
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
          {getRenderElement(component.name, compiledBundle, transformedCode)}
        </div>
      </div>
    );
  }
}
