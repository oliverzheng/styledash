/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import { type Color } from './Colors';
import save from '../icons/save.svg';
import angleBrackets from '../icons/angle_brackets.svg';

import './Icon.css';

export type GlyphType =
  'save' |
  'angle-brackets';

type IconSize = 18;

type PropType = {
  glyph: GlyphType,
  size: IconSize,
  color: Color,

  className?: ?string,
};

export default class Icon extends React.Component<PropType> {
  static defaultProps = {
    color: 'light',
    size: 18,
  };

  render(): React$Node {
    const Glyph = this._getGlyph();
    return (
      // Ideally, use span so it's not selectable, but IE doesn't support
      // CSS masks which would be required to change colors.
      <Glyph
        className={
          classnames(
            'Icon',
            this._getSizeClass(),
            this._getColorClass(),
            this.props.className,
          )
        }
      />
    );
  };

  _getSizeClass(): string {
    const {size} = this.props;
    switch (size) {
      case 18:
        return 'Icon-size-18';
      default:
        invariant(false, 'Unsupported size %s', size);
    }
  }

  _getColorClass(): string {
    const {color} = this.props;
    switch (color) {
      case 'normal':
        return 'Icon-color-normal';
      case 'light':
        return 'Icon-color-light';
      case 'reallyLight':
        return 'Icon-color-reallyLight';
      default:
        invariant(false, 'Unsupported color %s', color);
    }
  }

  _getGlyph(): string {
    const {glyph} = this.props;
    switch (glyph) {
      case 'save':
        return save;
      case 'angle-brackets':
        return angleBrackets;
      default:
        invariant(false, 'Unsupported glyph %s', glyph);
    }
  }
}
