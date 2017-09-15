/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import './Card.css';

type CardSectionPropType = {
  fillHeight?: boolean,
  className?: ?string,
  children: React$Node,
};

// TODO add borders
export class CardSection extends React.Component<CardSectionPropType> {
  static defaultProps = {
    fillHeight: false,
  };

  render(): React$Element<*> {
    return (
      <div
        className={classnames(
          'Card-section',
          this.props.className,
          { 'Card-section-fillHeight': this.props.fillHeight },
        )}>
        {this.props.children}
      </div>
    );
  }
}

export class CardFooterSection extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <div
        className={classnames(
          'Card-section',
          'Card-section-footer',
          this.props.className,
        )}>
        {this.props.children}
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
        (child.type === CardSection || child.type === CardFooterSection);

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
