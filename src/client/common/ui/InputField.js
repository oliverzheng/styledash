/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';

import './InputField.css';

type PropType = {
  className?: ?string,
};

export default class InputField extends React.Component<PropType> {
  _input: ?HTMLInputElement;

  render(): React$Node {
    const {
      className,
      ...rest
    } = this.props;

    return (
      <input
        ref={c => this._input = c}
        type="text"
        className={classnames('InputField-root', className)}
        {...rest}
      />
    );
  }

  getElement(): HTMLInputElement {
    return nullthrows(this._input);
  }
}
