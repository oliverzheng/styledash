/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import document from 'global/document';
import window from 'global/window';

import {CLIENT_COMPONENT_RENDER_PATH} from '../clientserver/serverConfig';
import App from './App';
import ComponentRenderIFrameApp from './componentRenderIFrame/ComponentRenderIFrameApp';

import './index.css';

// TODO Doing this on the client outside of the router now, because everything
// is served by react create app. When JS is served from the server, bundle this
// separately and serve it directly from the server.
let Component;
if (window.location.pathname === CLIENT_COMPONENT_RENDER_PATH) {
  Component = ComponentRenderIFrameApp;
} else {
  Component = App;
}

// We don't want the root level styling of the app to affect component renders
// in the iframe
document.body.className = Component.htmlBodyClassName;

ReactDOM.render(
  <Component />,
  document.getElementById('root'),
);
