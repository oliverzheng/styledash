/** @flow */

import React from 'react';
import invariant from 'invariant';
import global from 'global';

export default function getRenderElement(
  componentName: string,
  compiledBundle: {[componentName: string]: Class<React.Component<*>>},
  transformedCode: string,
): React$Node {
  const componentBundleComponentNames = Object.keys(compiledBundle);
  componentBundleComponentNames.forEach(compiledBundleComponentName => {
    // Make this in the global scope so eval can get it
    invariant(
      !global.hasOwnProperty(compiledBundleComponentName),
      'Cannot already have this in global scope',
    );
    global[compiledBundleComponentName] =
      compiledBundle[compiledBundleComponentName];
  });
  global['React'] = React;

  let element;
  try {
    // eslint-disable-next-line no-eval
    element = eval(transformedCode);
  } finally {
    // Reset it
    componentBundleComponentNames.forEach(compiledBundleComponentName => {
      delete global[compiledBundleComponentName];
    });
  }

  return element;
}
