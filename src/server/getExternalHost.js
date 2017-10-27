/** @flow */

import envConfig from '../envConfig';
import isHTTPS from './isHTTPS';

export default function getExternalHost(req: Object): string {
  if (envConfig.externalHostOverride) {
    return envConfig.externalHostOverride;
  }

  const protocol = isHTTPS(req) ? 'https' : 'http';
  return `${protocol}://${req.get('Host')}`;
}
