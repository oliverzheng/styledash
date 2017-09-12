/** @flow */

import React from 'react';
import classnames from 'classnames';

import './SectionHeader.css';

export default class SectionHeader extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <h3
        className={classnames('SectionHeader-root', this.props.className)}>
        {this.props.children}
      </h3>
    );
  }
}
