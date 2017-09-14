/** @flow */

import React from 'react';
import classnames from 'classnames';

import './PageMenu.css';

export type ItemPropType = {
  text: string,
  highlighted?: boolean,
  onClick?: () => any,
  children?: ?React$Node,
};

export class PageMenuItem extends React.Component<ItemPropType> {
  static defaultProps = {
    highlighted: false,
  };

  render(): React$Element<*> {
    const {text, highlighted, children} = this.props;
    const href = '#'; // es-lint complains about this if it was inline.
    return (
      <li className={classnames({ 'PageMenu-highlighted': highlighted })}>
        <a href={href} onClick={this._onClick}>{text}</a>
        {children}
      </li>
    );
  }

  _onClick = (e: SyntheticEvent<*>) => {
    e.preventDefault();

    const {onClick} = this.props;
    if (onClick) {
      onClick();
    }
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
