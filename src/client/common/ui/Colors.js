/** @flow */

export type Color =
  'normal' |
  'light' | 
  'reallyLight';

const colors: {[color: Color]: string} = {
  normal: '#696969',
  light: '#919191',
  reallyLight: '#CACACA',
};

export default colors;
