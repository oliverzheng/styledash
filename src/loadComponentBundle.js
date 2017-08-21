/** @flow */

import global from 'global';
import asyncLoad from 'async-load';
import invariant from 'invariant';

if (global.componentOnLoad) {
  throw new Error('componentOnLoad already set on global');
}

const promiseResolverQueue = [];
// We load by injecting a script tag, which execute synchronously. The order in
// which tags are inserted is the order in which they are loaded, and in which
// this callback is called. Each time we have a component ready, we want to
// resolve a promise.
// This assumes every bundle we load calls this via JSONP.
global.componentOnLoad = (component: any) => {
  const promiseResolve = promiseResolverQueue.shift();
  invariant(promiseResolve, 'Promise resolver queue is empty');

  const es6Component = component.__esModule ? component.default : component;
  promiseResolve(es6Component);
};

// The component must use JSONP to wrap its data
export default async function loadComponentBundle(src: string): Promise<any> {
  return new Promise(resolve => {
    promiseResolverQueue.push(resolve);

    // We don't care when this onLoad is called. We care about the JSONP callback.
    asyncLoad(src);
  });
}
