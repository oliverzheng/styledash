/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';
import classnames from 'classnames';

import ComponentRenderIFrame from './ComponentRenderIFrame';
import CodeEditor from './CodeEditor';
import Card, { CardSection } from '../../common/ui/Card';
import Spacing from '../../common/ui/Spacing';
import Button from '../../common/ui/Button';
import ButtonWithAction from '../../common/ui/ButtonWithAction';
import Icon from '../../common/ui/Icon';
import FontSize from '../../common/ui/FontSize';

import './ComponentExample.css';

type PropType = {
  exampleID: string,
  initialCode: string,
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
  showRevert: boolean,
  canSaveInitialCode: boolean,
  onSave: (newCode: string, serializedElement: ?string) => any,
};

type StateType = {
  hasCodeChanged: boolean,
  hasCodeChangedSinceTransform: boolean,
};

export default class ComponentExample extends React.Component<PropType, StateType> {
  static defaultProps = {
    canSaveInitialCode: false,
  };

  state = {
    hasCodeChanged: false,
    hasCodeChangedSinceTransform: false,
  };
  _code: ?string;
  _serializedElement: ?string;
  _iframe: ?ComponentRenderIFrame;
  _iframeReady: boolean = false;
  _transformedCodeBeforeIFrameReady: ?string = null;
  _ce: ?CodeEditor;

  componentWillReceiveProps(nextProps: PropType) {
    if (nextProps.initialCode === this._code) {
      this.setState({
        hasCodeChanged: false,
        hasCodeChangedSinceTransform: false,
      });
    }
  }

  render(): React$Node {
    let actionButtons = null;
    if (this.state.hasCodeChanged || this.props.canSaveInitialCode) {
      let revertButton = null;
      if (this.props.showRevert) {
        revertButton = (
          <Button
            className={Spacing.margin.right.n12}
            purpose="secondary"
            onClick={this._revertCode}>
            Revert
          </Button>
        );
      }
      actionButtons = (
        <div className="ComponentExample-code-actionButtons">
          {revertButton}
          <ButtonWithAction
            glyph="save"
            purpose="primary"
            onClick={this._saveCode}
            disabled={this.state.hasCodeChangedSinceTransform}>
            Save Example
          </ButtonWithAction>
        </div>
      );
    }

    return (
      <Card>
        <CardSection padding={false} className="ComponentExample-render">
          <ComponentRenderIFrame
            ref={c => this._iframe = c}
            title={this.props.exampleID}
            onReady={this._onIFrameReady}
            onSerializedElement={this._onSerializedElement}
          />
        </CardSection>
        <CardSection className="ComponentExample-codeSection">
          <div
            className={
              classnames('ComponentExample-codeTitle', FontSize.small)
            }>
            <Icon glyph="angle-brackets" className={Spacing.margin.right.n8} />
            Code
          </div>
          {actionButtons}
          <CodeEditor
            className="ComponentExample-code-editor"
            initialCode={this.props.initialCode}
            onCodeTransform={this._onCodeTransform}
            onCodeChange={this._onCodeChange}
            maxHeight={150}
            ref={c => this._ce = c}
          />
        </CardSection>
      </Card>
    );
  }

  _onCodeTransform = (transformedCode: string) => {
    this._renderToIFrame(transformedCode);
  }

  _onCodeChange = (code: string, transformedCode: ?string) => {
    this._code = code;

    this.setState({
      hasCodeChanged: code !== this.props.initialCode,
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

  _revertCode = () => {
    nullthrows(this._ce).setCode(this.props.initialCode);
  }

  _saveCode = () => {
    this.props.onSave(nullthrows(this._code), this._serializedElement);
  }

  _onSerializedElement = (serializedElement: string) => {
    this._serializedElement = serializedElement;
  }
}
