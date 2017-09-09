/** @flow */

import fs from 'fs';
import path from 'path';

import express from 'express';
import {buildSchema} from 'graphql';
import graphqlHTTP from 'express-graphql';

import dbconfig from '../dbconfig.json';
import ViewerContext from './entity/vc';
import EntComponent from './entity/EntComponent';
import {
  connectToMySQL,
  cleanupConnection,
} from './storage/mysql';
import {
  printAction,
  printActionResult,
  printError,
} from './consoleUtil';
import {SERVER_PORT} from './serverConfig';
import graphqlRoot from './server/graphqlRoot';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './server/schema.graphql')).toString()
);

async function main() {
  printAction('Connecting to MySQL...');
  const conn = await connectToMySQL(dbconfig);
  printActionResult('Connected.');

  try {
    const vc = new ViewerContext(conn, '');
    const app = express();

    // TODO - react is hot-served via webpack on a different port right now
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      next();
    });

    app.get('/', (req, res) => {
      res.send('derp');
    });

    app.get('/component/:componentID/bundle.js', async (req, res) => {
      const component = await EntComponent.genNullable(vc, req.params.componentID);
      if (!component) {
        res.status(404).send('Not found');
        return;
      }
      const bundle = await component.genCompiledBundle();
      res.type('application/javascript').send(bundle);
    });

    const graphQLHandlerOpts = {
      schema: schema,
      rootValue: graphqlRoot,
      context: {
        // TODO generate this from logins
        vc: vc,
      },
    };
    // TODO Make this conditional based on who's logged in
    app.get('/graphql', graphqlHTTP({...graphQLHandlerOpts, graphiql: true}));
    app.post('/graphql', graphqlHTTP({...graphQLHandlerOpts, graphiql: false}));

    printAction(`Setting up listener on port ${SERVER_PORT}...`);
    app.listen(SERVER_PORT, () => {
      printActionResult('Listener setup.');
    });
  }
  catch (err) {
    printError(err);
    cleanupConnection(conn);
  }
}

main();
