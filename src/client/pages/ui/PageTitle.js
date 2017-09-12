/** @flow */

import React from 'react';
import classnames from 'classnames';

import './PageTitle.css';

export default class PageTitle extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <h2
        className={classnames('PageTitle-root', this.props.className)}>
        {this.props.children}
      </h2>
    );
  }
}
