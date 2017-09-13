/** @flow */

import React from 'react';
import classnames from 'classnames';

import './SubText.css';

export default class SubText extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <p
        className={classnames('SubText-root', this.props.className)}>
        {this.props.children}
      </p>
    );
  }
}
