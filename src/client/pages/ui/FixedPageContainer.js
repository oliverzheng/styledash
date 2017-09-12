/** @flow */

import React from 'react';
import classnames from 'classnames';

import './FixedPageContainer.css';

export default class FixedPageContainer extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <div
        className={classnames('FixedPageContainer-root', this.props.className)}>
        {this.props.children}
      </div>
    );
  }
}
