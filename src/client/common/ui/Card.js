/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import './Card.css';

type CardSectionPropType = {
  fillHeight: boolean,
  padding: boolean,
  border: boolean,
  align: 'left' | 'right',
  className?: ?string,
  children: React$Node,
};

export class CardSection extends React.Component<CardSectionPropType> {
  static defaultProps = {
    fillHeight: false,
    padding: true,
    border: true,
    align: 'left',
  };

  render(): React$Element<*> {
    let {children} = this.props;
    const hasAlign = this.props.align !== 'left';
    if (hasAlign) {
      children = (
        <div className={'Card-section-align-' + this.props.align}>
          {children}
        </div>
      );
    }

    return (
      <div
        className={classnames(
          'Card-section',
          this.props.className,
          {
            'Card-section-fillHeight': this.props.fillHeight,
            'Card-section-padding': this.props.padding,
            'Card-section-border': this.props.border,
            'Card-section-hasAlign': hasAlign,
          },
        )}>
        {children}
      </div>
    );
  }
}

export default class Card extends React.Component<*> {
  render(): React$Element<*> {
    let {children} = this.props;

    let hasCardSection = null;
    React.Children.forEach(children, child => {
      const isChildCardSection =
        typeof child === 'object' &&
        child.type === CardSection;

      if (hasCardSection == null) {
        hasCardSection = isChildCardSection;
      } else {
        invariant(
          hasCardSection === isChildCardSection,
          'Children must either all be card sections or none at all',
        );
      }
    });
    if (!hasCardSection) {
      children = <CardSection>{children}</CardSection>;
    }

    return (
      <div
        className={classnames('Card-root', this.props.className)}>
        {children}
      </div>
    );
  }
}
