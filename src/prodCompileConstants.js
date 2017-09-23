// Purposely don't use flow here.

import process from 'process';
import invariant from 'invariant';

export function getServerResourceDir() {
  invariant(process.env.NODE_ENV === 'production', 'Must be prod');
  return STYLEDASH_SERVER_RESOURCE_DIRECTORY;
}

export function getClientBuildDir() {
  invariant(process.env.NODE_ENV === 'production', 'Must be prod');
  return STYLEDASH_CLIENT_BUILD_DIRECTORY;
}

export function getClientManifest() {
  invariant(process.env.NODE_ENV === 'production', 'Must be prod');
  return STYLEDASH_CLIENT_MANIFEST;
}
