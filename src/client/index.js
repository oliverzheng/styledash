/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import loadComponentBundle from './loadComponentBundle';
import {SERVER_GRAPHQL_ADDRESS} from '../serverConfig';

import './index.css';

const GRAPHQL_URI = SERVER_GRAPHQL_ADDRESS;

ReactDOM.render(
  <App graphQLURI={GRAPHQL_URI} />,
  document.getElementById('root'),
);

/*
loadComponentBundle(
  `${SERVER_ADDRESS}/component/10/bundle.js`,
).then(Component => {
  const mountNode = document.getElementById('root2');
  ReactDOM.render(<Component />, mountNode);
});
*/
