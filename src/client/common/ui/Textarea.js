/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';

import './Textarea.css';

type PropType = {
  code: boolean,
  className?: ?string,
};

export default class Textarea extends React.Component<PropType> {
  static defaultProps = {
    code: false,
  };

  _textarea: ?HTMLTextAreaElement;

  render(): React$Node {
    const {
      className,
      code,
      ...rest
    } = this.props;

    return (
      <textarea
        ref={c => this._textarea = c}
        className={
          classnames('Textarea-root', className, {'Textarea-code': code})
        }
        {...rest}
      />
    );
  }

  getElement(): HTMLTextAreaElement {
    return nullthrows(this._textarea);
  }
}
