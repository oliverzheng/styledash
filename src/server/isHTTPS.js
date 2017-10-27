/** @flow */

export default function isHTTPS(req: Object): boolean {
  if (req.secure) {
    return true;
  }
  if (req.get('x-forwarded-proto') === 'https') {
    return true;
  }

  return false;
}
