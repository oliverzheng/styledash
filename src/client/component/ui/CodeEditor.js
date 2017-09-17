/** @flow */

import React from 'react';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/lib/codemirror.css';

import parseCode from '../util/parseCode';

import './CodeEditor.css';

type PropType = {
  onCodeChange: (transformedCode: ?string) => any,
};

type StateType = {
  code: string,
};

export default class CodeEditor extends React.Component<PropType, StateType> {
  state = {
    code: '',
  };

  componentDidMount() {
    this._parseCode();
  }

  _onCodeChange = (code: string) => {
    this.setState({ code }, () => this._parseCode());
  }

  _parseCode(): void {
    const {code} = this.state;
    const {onCodeChange} = this.props;

    let transformedCode = null;
    const parseResult = parseCode(code);
    if (typeof parseResult.transformedCode === 'string') {
      transformedCode = parseResult.transformedCode;
    }
    onCodeChange(transformedCode);
  }

  render(): React$Node {
    const options = {
      lineNumbers: false,
      mode: 'jsx',
      theme: 'code-editor',
    };

    return (
      <CodeMirror
        className="CodeEditor-root"
        value={this.state.code}
        onChange={this._onCodeChange}
        options={options}
      />
    );
  }
}
