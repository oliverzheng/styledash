/** @flow */

export type Color =
  'normal' |
  'light' | 
  'reallyLight' |
  'accentInvert';

const colors: {[color: Color]: string} = {
  normal: '#696969',
  light: '#919191',
  reallyLight: '#CACACA',
  accentInvert: '#FFAA6C',
};

export default colors;
