/** @flow */

import React from 'react';
import classnames from 'classnames';

import './Card.css';

export default class Card extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <div
        className={classnames('Card-root', this.props.className)}>
        {this.props.children}
      </div>
    );
  }
}
