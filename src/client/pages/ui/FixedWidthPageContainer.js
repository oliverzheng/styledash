/** @flow */

import React from 'react';
import classnames from 'classnames';

import './FixedWidthPageContainer.css';

export type FixedWidthPageContainerProps = {
  wide?: ?boolean,
  className?: ?string,
  children?: React$Node,
};

export default class FixedWidthPageContainer extends React.Component<FixedWidthPageContainerProps> {
  static defaultProps = {
    wide: false,
  };

  render(): React$Element<*> {
    return (
      <div
        className={
          classnames(
            'FixedWidthPageContainer-root',
            this.props.className,
            { 'FixedWidthPageContainer-wide': this.props.wide },
          )
        }>
        {this.props.children}
      </div>
    );
  }
}
