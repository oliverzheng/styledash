/** @flow */

import React from 'react';
import classnames from 'classnames';

import './Paragraph.css';

export default class Paragraph extends React.Component<*> {
  render(): React$Node {
    const {className, children, ...rest} = this.props;
    return (
      <p
        className={classnames(className, 'Paragraph')}
        {...rest}>
        {this.props.children}
      </p>
    );
  }
}
