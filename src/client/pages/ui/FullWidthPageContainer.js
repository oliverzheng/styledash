/** @flow */

import React from 'react';
import classnames from 'classnames';

import './FullWidthPageContainer.css';

export default class FullWidthPageContainer extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <div
        className={
          classnames('FullWidthPageContainer-root', this.props.className)
        }>
        {this.props.children}
      </div>
    );
  }
}
