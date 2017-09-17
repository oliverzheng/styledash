/** @flow */

import React from 'react';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/lib/codemirror.css';

import './CodeEditor.css';

type StateType = {
  code: string,
};

export default class CodeEditor extends React.Component<*, StateType> {
  state = {
    code: '',
  };

  _onCodeChange = (code: string) => {
    this.setState({ code });
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
