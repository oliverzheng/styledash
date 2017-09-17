/** @flow */

import React from 'react';
import invariant from 'invariant';
import global from 'global';

export default function getRenderElement(
  componentName: string,
  component: Class<React.Component<*>>,
  transformedCode: string,
) {
  // Make this in the global scope so eval can get it
  invariant(
    !global.hasOwnProperty(componentName),
    'Cannot already have this in global scope',
  );
  global[componentName] = component;
  global['React'] = React;

  // eslint-disable-next-line no-eval
  const element = eval(transformedCode);

  // Reset it
  delete global[componentName];

  return element;
}
