/** @flow */

import global from 'global';
import asyncLoad from 'async-load';

export default async function loadComponentBundle(src: string): Promise<any> {
  return asyncLoad(src).then(() => global.repositoryBundle);
}
