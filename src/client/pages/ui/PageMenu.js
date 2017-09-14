/** @flow */

import React from 'react';
import classnames from 'classnames';

import './PageMenu.css';

export type ItemPropType = {
  text: string,
  href: string,
  highlighted?: boolean,
  children?: ?React$Node,
};

export class PageMenuItem extends React.Component<ItemPropType> {
  static defaultProps = {
    highlighted: false,
  };

  render(): React$Element<*> {
    const {text, href, highlighted, children} = this.props;
    return (
      <li className={classnames({ 'PageMenu-highlighted': highlighted })}>
        <a href={href}>{text}</a>
        {children}
      </li>
    );
  }
}

export default class PageMenu extends React.Component<*> {
  render(): React$Element<*> {
    return (
      <ul className={classnames('PageMenu-root', this.props.className)}>
        {this.props.children}
      </ul>
    );
  }
}
