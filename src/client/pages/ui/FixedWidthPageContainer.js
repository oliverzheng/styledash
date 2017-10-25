/** @flow */

import React from 'react';
import classnames from 'classnames';

import './FixedWidthPageContainer.css';

export type FixedWidthPageContainerProps = {
  width: 'wide' | 'normal' | 'narrow' | 'supernarrow',
  className?: ?string,
  children?: React$Node,
};

export default class FixedWidthPageContainer extends React.Component<FixedWidthPageContainerProps> {
  static defaultProps = {
    width: 'normal',
  };

  render(): React$Element<*> {
    return (
      <div
        className={
          classnames(
            'FixedWidthPageContainer-root',
            this.props.className,
            'FixedWidthPageContainer-width-' + this.props.width,
          )
        }>
        {this.props.children}
      </div>
    );
  }
}
