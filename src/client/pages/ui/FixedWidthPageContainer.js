/** @flow */

import React from 'react';
import classnames from 'classnames';

import './FixedWidthPageContainer.css';

export default class FixedWidthPageContainer extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <div
        className={
          classnames('FixedWidthPageContainer-root', this.props.className)
        }>
        {this.props.children}
      </div>
    );
  }
}
