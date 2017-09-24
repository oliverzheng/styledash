/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import document from 'global/document';

import MainSiteApp from './MainSiteApp';

import './index.css';

document.body.className = MainSiteApp.htmlBodyClassName;

ReactDOM.render(
  <MainSiteApp />,
  document.getElementById('root'),
);
