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
  purpose: 'primary' | 'secondary',

  className?: ?string,
  children?: ?React$Node,
};

export default class Button extends React.Component<PropType> {
  static defaultProps = {
    href: null,
    onClick: null,
    disabled: false,
    glyph: null,
    purpose: 'primary',
  };

  render(): React$Node {
    const {
      href,
      onClick,
      disabled,
      glyph,
      purpose,
      className,
      children,
    } = this.props;

    const isPrimary = purpose === 'primary';
    const isSecondary = purpose === 'secondary';
    const forwardProps = {
      className: classnames(
        'Button-root',
        {
          'Button-disabled': disabled,
          'Button-primary': isPrimary,
          'Button-secondary': isSecondary,
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

    let text = children;
    if (isSecondary) {
      text = <span className="Button-text">{children}</span>
    }

    if (href != null) {
      return (
        <a href={href} {...forwardProps}>
          {icon}
          {text}
        </a>
      );
    } else {
      return (
        <button {...forwardProps} disabled={disabled}>
          {icon}
          {text}
        </button>
      );
    }
  };
}
