/** @flow */

import React from 'react';
import classnames from 'classnames';
import {Link as RouterLink} from 'react-router';
import url from 'url';

import TextColor from './TextColor';
import Icon, { type GlyphType } from './Icon';

import './Button.css';

export type ButtonProps = {
  href?: ?string,
  onClick?: ?(() => any),
  disabled?: boolean,
  glyph?: ?GlyphType,
  purpose?: 'primary' | 'secondary',
  glyphPlacement?: 'left' | 'right',

  className?: ?string,
  children?: ?React$Node,
};

export default class Button extends React.Component<ButtonProps> {
  static defaultProps = {
    href: null,
    onClick: null,
    disabled: false,
    glyph: null,
    purpose: 'primary',
    glyphPlacement: 'left',
  };

  render(): React$Node {
    const {
      href,
      onClick,
      disabled,
      glyph,
      purpose,
      glyphPlacement,
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
      const isIconLeft = glyphPlacement === 'left';
      icon = (
        <Icon
          glyph={glyph}
          size={18}
          className={classnames(
            'Button-icon',
            {
              'Button-icon-left': isIconLeft,
              'Button-icon-right': !isIconLeft,
            },
          )}
        />
      );
    }

    let text = children;
    if (isSecondary) {
      text = <span className="Button-text">{children}</span>
    }

    if (href != null) {
      if (url.parse(href).host == null) {
        return (
          <RouterLink to={href} {...forwardProps}>
            {icon}
            {text}
          </RouterLink>
        );
      } else {
        return (
          <a href={href} {...forwardProps}>
            {icon}
            {text}
          </a>
        );
      }
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
