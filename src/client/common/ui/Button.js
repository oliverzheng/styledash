/** @flow */

import React from 'react';
import classnames from 'classnames';

import TextColor from './TextColor';
import Icon, { type GlyphType } from './Icon';

import './Button.css';

type PropType = {
  href: ?string,
  onClick: ?(() => any),
  disabled: boolean,
  glyph: ?GlyphType,

  className?: ?string,
  children?: ?React$Node,
};

export default class Button extends React.Component<PropType> {
  static defaultProps = {
    href: null,
    onClick: null,
    disabled: false,
    glyph: null,
  };

  render(): React$Node {
    const {
      href,
      onClick,
      disabled,
      glyph,
      className,
      children,
    } = this.props;

    const forwardProps = {
      className: classnames(
        'Button-root',
        {
          'Button-disabled': disabled,
        },
        TextColor.normal,
        className,
      ),
      onClick,
    };

    let icon = null;
    if (glyph) {
      icon = (
        <Icon glyph={glyph} size={18} className="Button-icon" />
      );
    }

    if (href != null) {
      return (
        <a href={href} {...forwardProps}>
          {icon}
          {children}
        </a>
      );
    } else {
      return (
        <button {...forwardProps} disabled={disabled}>
          {icon}
          {children}
        </button>
      );
    }
  };
}
