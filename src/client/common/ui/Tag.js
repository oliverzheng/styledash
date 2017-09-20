/** @flow */

import React from 'react';
import classnames from 'classnames';

import TextColor from './TextColor';

import './Tag.css';

export default class Tag extends React.Component<*> {
  render(): React$Node {
    return (
      <span
        className={
          classnames('Tag-root', TextColor.light, this.props.className)
        }>
        {this.props.children}
      </span>
    );
  }
}
