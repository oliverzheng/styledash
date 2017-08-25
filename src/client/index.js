/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import {SERVER_GRAPHQL_ADDRESS} from '../serverConfig';

import './index.css';

const GRAPHQL_URI = SERVER_GRAPHQL_ADDRESS;

ReactDOM.render(
  <App graphQLURI={GRAPHQL_URI} />,
  document.getElementById('root'),
);
