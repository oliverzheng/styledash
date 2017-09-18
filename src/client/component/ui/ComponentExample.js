/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import ComponentRenderIFrame from './ComponentRenderIFrame';
import CodeEditor from './CodeEditor';

type PropType = {
  exampleID: string,
  initialCode: string,
  component: {
    name: string,
    compiledBundleURI: string,
  },
  repository: {
    externalCSSURI: ?string,
  },
};

type StateType = {
  hasCodeChangedSinceTransform: boolean,
};

export default class ComponentExample extends React.Component<PropType, StateType> {
  state = {
    hasCodeChangedSinceTransform: false,
  };
  _iframe: ?ComponentRenderIFrame;
  _iframeReady: boolean = false;
  _transformedCodeBeforeIFrameReady: ?string = null;

  render(): React$Node {
    return (
      <div>
        <ComponentRenderIFrame
          ref={c => this._iframe = c}
          title={this.props.exampleID}
          onReady={this._onIFrameReady}
        />
        <CodeEditor
          initialCode={this.props.initialCode}
          onCodeTransform={this._onCodeTransform}
          onCodeChange={this._onCodeChange}
        />
      </div>
    );
  }

  _onCodeTransform = (transformedCode: string) => {
    this._renderToIFrame(transformedCode);
  }

  _onCodeChange = (transformedCode: ?string) => {
    this.setState({
      hasCodeChangedSinceTransform: transformedCode == null,
    });
  }

  _onIFrameReady = (iframe: ComponentRenderIFrame) => {
    this._iframeReady = true;

    if (this._transformedCodeBeforeIFrameReady) {
      this._renderToIFrame(this._transformedCodeBeforeIFrameReady);
      this._transformedCodeBeforeIFrameReady = null;
    }
  }

  _renderToIFrame(transformedCode: string) {
    if (this._iframeReady) {
      nullthrows(this._iframe).sendMessage({
        type: 'renderComponent',
        transformedCode,
        component: this.props.component,
        repository: this.props.repository,
      });
    } else {
      this._transformedCodeBeforeIFrameReady = transformedCode;
    }
  }
}
