/** @flow */

import React from 'react';
import classnames from 'classnames';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/lib/codemirror.css';

import parseCode from '../util/parseCode';

import './CodeEditor.css';

type PropType = {
  initialCode: string,
  onCodeTransform: (transformedCode: string) => any,
  onCodeChange: (transformedCode: ?string) => any,
  className?: ?string,
};

type StateType = {
  code: string,
};

export default class CodeEditor extends React.Component<PropType, StateType> {
  constructor(props: PropType) {
    super(props);

    this.state = {
      code: props.initialCode,
    };
  }

  componentDidMount() {
    this._parseCode();
  }

  _onCodeChange = (code: string) => {
    this.setState({ code }, () => this._parseCode());
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
        className={classnames('CodeEditor-root', this.props.className)}
        value={this.state.code}
        onChange={this._onCodeChange}
        options={options}
      />
    );
  }
}
