/** @flow */

import fs from 'fs';
import invariant from 'invariant';

import {getClientManifest} from '../prodCompileConstants';

export type App = 'app' | 'main-site';

const APP_JS = 'app.js';
const APP_CSS = 'app.css';
const MAIN_SITE_JS = 'mainSite.js';
const MAIN_SITE_CSS = 'mainSite.css';
const POLYFILLS_JS = 'polyfills.js';

export default function getClientAssetURLs(
  app: App,
): {
  js: Array<string>,
  css: Array<string>,
} {
  if (process.env.NODE_ENV === 'production') {
    const appManifest = JSON.parse(
      fs.readFileSync(getClientManifest()).toString()
    );

    if (app === 'app') {
      return {
        js: [
          appManifest[POLYFILLS_JS],
          appManifest[APP_JS],
        ],
        css: [
          appManifest[APP_CSS],
        ],
      };
    } else if (app === 'main-site') {
      return {
        js: [
          appManifest[POLYFILLS_JS],
          appManifest[MAIN_SITE_JS],
        ],
        css: [
          appManifest[MAIN_SITE_CSS],
        ],
      };
    } else {
      invariant(false, 'Unexpected app %s', app);
    }
  } else {
    if (app === 'app') {
      return {
        js: [
          'js/' + POLYFILLS_JS,
          'js/' + APP_JS,
        ],
        css: [
          // webpack does inline css
        ],
      };
    } else if (app === 'main-site') {
      return {
        js: [
          'js/' + POLYFILLS_JS,
          'js/' + MAIN_SITE_JS,
        ],
        css: [
          // webpack does inline css
        ],
      };
    } else {
      invariant(false, 'Unexpected app %s', app);
    }
  }
}
