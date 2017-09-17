/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import ComponentRenderIFrame from './ComponentRenderIFrame';
import CodeEditor from './CodeEditor';

type PropType = {
  exampleID: string,
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

  render(): React$Node {
    return (
      <div>
        <ComponentRenderIFrame
          ref={c => this._iframe = c}
          title={this.props.exampleID}
          onReady={this._onIFrameReady}
        />
        <CodeEditor onCodeChange={this._onCodeChange} />
      </div>
    );
  }

  _onCodeChange = (transformedCode: ?string) => {
    if (transformedCode != null) {
      this._renderToIFrame(transformedCode);
    }

    this.setState({
      hasCodeChangedSinceTransform: transformedCode == null,
    });
  }

  _onIFrameReady = (iframe: ComponentRenderIFrame) => {
    // initial render
  }

  _renderToIFrame(transformedCode: string) {
    nullthrows(this._iframe).sendMessage({
      type: 'renderComponent',
      transformedCode,
      component: this.props.component,
      repository: this.props.repository,
    });
  }
}
