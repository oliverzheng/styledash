/** @flow */

import fs from 'fs';
import path from 'path';

import express from 'express';
import {
  graphql,
  buildSchema,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import graphqlHTTP from 'express-graphql';
import SQL from 'sql-template-strings';
import nullthrows from 'nullthrows';
import username from 'username';

import dbconfig from '../dbconfig.json';
import ViewerContext from './core/vc';
import {
  type Connection,
  connectToMySQL,
  executeSQL,
  cleanupConnection,
} from './storage/mysql';
import EntUser from './entity/EntUser';
import EntRepository from './entity/EntRepository';
import EntComponent from './entity/EntComponent';
import {
  printAction,
  printActionResult,
  printError,
} from './consoleUtil';
import {SERVER_PORT} from './serverConfig';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './graphql/schema.graphql')).toString()
);

class Viewer {
  _vc: ViewerContext;

  constructor(vc: ViewerContext) {
    this._vc = vc;
  }

  id(): string {
    // TODO
    return 'viewer:some_user_id';
  }

  async username(): Promise<string> {
    return await username();
  }

  async repositories(): Promise<Array<EntRepository>> {
    // TODO need users to do this
    const repo = await EntRepository.genEnforce(this._vc, '44');
    return [repo];
  }
}

// TODO this is currently broken. Need
// https://github.com/graphql/graphql-js/pull/947
// ... then why is this here? Has it never worked? Doesn't Relay need this?
// If it does end up working, make the enumeration of types automatic.
async function resolveNode(vc: ViewerContext, id: string): Promise<?Object> {
  const conn = vc.getDatabaseConnection();
  const separatorIndex = id.indexOf(':');
  const type = id.substr(0, separatorIndex);
  const objID = id.substr(separatorIndex + 1);

  switch (type) {
    case 'viewer':
      return new Viewer(vc);
    case 'repository':
      return await EntRepository.genNullable(vc, objID);
    case 'component':
      return await EntComponent.genNullable(vc, objID);
  }

  return null;
}

const root = {
  // Query
  node: async (args, context) => {
    return await resolveNode(context.vc, args.id);
  },
  viewer: (args, context) => {
    return new Viewer(context.vc);
  },
  user: async (args, context) => {
    return await EntUser.genNullable(context.vc, args.userID);
  },
  repository: async (args, context) => {
    return await EntRepository.genNullable(context.vc, args.repositoryID);
  },
  component: async (args, context) => {
    return await EntComponent.genNullable(context.vc, args.componentID);
  },

  // Mutation
  overrideComponentReactDoc: async (args, context) => {
    const {
      componentID,
      overrideReactDoc,
      clientMutationId,
    } = args.input;

    const component = await EntComponent.genEnforce(context.vc, componentID);
    const success = await component.genSetOverrideReactDoc(overrideReactDoc);
    return {
      clientMutationId,
      success,
      component,
    };
  },
};


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
      rootValue: root,
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
