/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import {
  Environment,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';
import {QueryRenderer, graphql} from 'react-relay';

import loadComponentBundle from './loadComponentBundle';
import {SERVER_ADDRESS} from './serverConfig';

async function fetchQuery(
  operation,
  variables,
): Promise<Object> {
  const response = await fetch(`${SERVER_ADDRESS}/graphql`, {
    method: 'POST',
    headers: {
      // Add authentication and other headers here
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      query: operation.text, // GraphQL text from input
      variables,
    }),
  });
  return response.json();
}

const environment = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
});

ReactDOM.render(
  <QueryRenderer
    environment={environment}
    query={graphql`
      query srcQuery {
        hello
      }
    `}
    variables={{}}
    render={({error, props}) => {
      if (props) {
        return <div>Received '{props.hello}'</div>;
      } else {
        return <div>Loading</div>;
      }
    }}
  />,
  document.getElementById('root'),
);

loadComponentBundle(
  `${SERVER_ADDRESS}/component/10/bundle.js`,
).then(Component => {
  const mountNode = document.getElementById('root2');
  ReactDOM.render(<Component />, mountNode);
});

registerServiceWorker();
