/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import { type Color } from './Colors';
import angleBrackets from '../icons/angle_brackets.svg';
import bell from '../icons/bell.svg';
import checkmark from '../icons/checkmark.svg';
import chevronDown from '../icons/chevron_down.svg';
import gear from '../icons/gear.svg';
import github from '../icons/github.svg';
import pencil from '../icons/pencil.svg';
import plus from '../icons/plus.svg';
import save from '../icons/save.svg';

import './Icon.css';

export type GlyphType =
  'angle-brackets' |
  'bell' |
  'checkmark' |
  'chevron-down' |
  'gear' |
  'github' |
  'pencil' |
  'plus' |
  'save';

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
      case 'angle-brackets':
        return angleBrackets;
      case 'bell':
        return bell;
      case 'chevron-down':
        return chevronDown;
      case 'checkmark':
        return checkmark;
      case 'gear':
        return gear;
      case 'github':
        return github;
      case 'pencil':
        return pencil;
      case 'plus':
        return plus;
      case 'save':
        return save;
      default:
        invariant(false, 'Unsupported glyph %s', glyph);
    }
  }
}
