/** @flow */

import fs from 'fs';

export const MAIN_APP_JS = 'app.js';
const MAIN_APP_CSS = 'app.css';
const POLYFILLS_JS = 'polyfills.js';

export default function getClientAssetURLs(
): {
  js: Array<string>,
  css: Array<string>,
} {
  if (process.env.NODE_ENV === 'production') {
    const appManifest = JSON.parse(
      fs.readFileSync(STYLEDASH_CLIENT_MANIFEST).toString()
    );

    return {
      js: [
        appManifest[POLYFILLS_JS],
        appManifest[MAIN_APP_JS],
      ],
      css: [
        appManifest[MAIN_APP_CSS],
      ],
    };
  } else {
    return {
      js: [
        'js/' + POLYFILLS_JS,
        'js/' + MAIN_APP_JS,
      ],
      css: [
        // webpack does inline css
      ],
    };
  }
}
