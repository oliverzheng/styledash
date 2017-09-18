/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import ComponentRenderIFrame from './ComponentRenderIFrame';
import CodeEditor from './CodeEditor';
import Card, { CardSection, CardFooterSection } from '../../common/ui/Card';
import Button from '../../common/ui/Button';

import './ComponentExample.css';

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
      <Card>
        <CardSection noPadding={true} className="ComponentExample-render">
          <ComponentRenderIFrame
            ref={c => this._iframe = c}
            title={this.props.exampleID}
            onReady={this._onIFrameReady}
          />
        </CardSection>
        <CardFooterSection>
          <Button glyph="save">
            Save Example
          </Button>
          <Button glyph="save" disabled>
            Save Example
          </Button>
          <Button href="#">
            Save Example
          </Button>
          <CodeEditor
            initialCode={this.props.initialCode}
            onCodeTransform={this._onCodeTransform}
            onCodeChange={this._onCodeChange}
          />
        </CardFooterSection>
      </Card>
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
