/** @flow */

import type { Color } from './Colors';

import './TextColor.css';

const TextColor: {[color: Color]: string} = {
  normal: 'TextColor-normal',
  light: 'TextColor-light',
  reallyLight: 'TextColor-reallyLight',
};

export default TextColor;
