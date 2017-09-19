/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/lib/codemirror.css';

import parseCode from '../util/parseCode';

import './CodeEditor.css';

const VERTICAL_PADDING = 10;

type PropType = {
  initialCode: string,
  onCodeTransform: (transformedCode: string) => any,
  onCodeChange: (code: string, transformedCode: ?string) => any,
  maxHeight: number,
  className?: ?string,
};

type StateType = {
  code: string,
};

export default class CodeEditor extends React.Component<PropType, StateType> {
  _cm: ?CodeMirror;

  constructor(props: PropType) {
    super(props);

    this.state = {
      code: props.initialCode,
    };
  }

  componentDidMount() {
    this._parseCode();
    this._resizeEditor();
  }

  setCode(code: string): void {
    nullthrows(this._cm).getCodeMirror().getDoc().setValue(code);
    this.setState({
      code,
    }, () => {
      this._parseCode();
      this._resizeEditor();
    });
  }

  _onCodeChange = (code: string) => {
    this.setState({ code }, () => {
      this._parseCode();
      this._resizeEditor();
    });
  }

  _parseCode(): void {
    const {code} = this.state;
    const {onCodeChange, onCodeTransform} = this.props;

    let transformedCode = null;
    const parseResult = parseCode(code);
    if (typeof parseResult.transformedCode === 'string') {
      transformedCode = parseResult.transformedCode;

      onCodeTransform(transformedCode);
    }

    onCodeChange(code, transformedCode);
  }

  _resizeEditor(): void {
    const cm = nullthrows(this._cm).getCodeMirror();
    const height = Math.min(
      cm.defaultTextHeight() * cm.getDoc().lineCount() + VERTICAL_PADDING,
      this.props.maxHeight,
    );
    cm.setSize(null, height);
  }

  render(): React$Node {
    const options = {
      lineNumbers: false,
      mode: 'jsx',
      theme: 'code-editor',
    };

    return (
      <CodeMirror
        className={classnames('CodeEditor-root', this.props.className)}
        value={this.state.code}
        onChange={this._onCodeChange}
        options={options}
        ref={c => this._cm = c}
      />
    );
  }
}
