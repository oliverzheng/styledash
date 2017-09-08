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
import {
  type Connection,
  connectToMySQL,
  executeSQL,
  cleanupConnection,
} from './data/mysql';
import {
  printAction,
  printActionResult,
  printError,
} from './consoleUtil';
import {SERVER_PORT} from './serverConfig';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './data/schema.graphql')).toString()
);

class Viewer {
  _conn: Connection;

  constructor(conn: Connection) {
    this._conn = conn;
  }

  id(): string {
    // TODO
    return 'viewer:some_user_id';
  }

  async username(): Promise<string> {
    return await username();
  }

  async repositories(): Promise<Array<Repository>> {
    return await Repository.getAllRepositories(this._conn);
  }
}

class Repository {
  _conn: Connection;
  _id: string;

  static async getAllRepositories(
    conn: Connection,
  ): Promise<Array<Repository>> {
    const res = await executeSQL(
      conn,
      SQL`SELECT id FROM repository`,
    );
    return res.map(row => new Repository(conn, row.id));
  }

  constructor(conn: Connection, id: string) {
    this._conn = conn;
    this._id = id;
  }

  id(): string {
    return `repository:${this._id}`;
  }

  repositoryID(): string {
    return this._id;
  }

  async name(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT name FROM repository WHERE id = ${this._id}`,
    );
    return res[0].name;
  }

  async externalCSSURI(): Promise<?string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT external_css_url FROM repository WHERE id = ${this._id}`,
    );
    return res[0].external_css_url;
  }

  async components(): Promise<Array<Component>> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT id FROM component WHERE repository_id = ${this._id}`,
    );
    return res.map(row => new Component(this._conn, row.id));
  }
}

class Component {
  _conn: Connection;
  _id: string;

  constructor(conn: Connection, id: string) {
    this._conn = conn;
    this._id = id;
  }

  id(): string {
    return `component:${this._id}`;
  }

  componentID(): string {
    return this._id;
  }

  async name(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT name FROM component WHERE id = ${this._id}`,
    );
    return res[0].name;
  }

  async repository(): Promise<Repository> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT repository_id FROM component WHERE id = ${this._id}`,
    );
    return new Repository(this._conn, res[0].repository_id);
  }

  async filepath(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT filepath FROM component WHERE id = ${this._id}`,
    );
    return res[0].filepath;
  }

  compiledBundleURI(): string {
    return `/component/${this._id}/bundle.js`;
  }

  async reactDoc(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT react_doc FROM component WHERE id = ${this._id}`,
    );
    return res[0].react_doc;
  }

  async overrideReactDoc(): Promise<?string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT override_react_doc FROM component WHERE id = ${this._id}`,
    );
    return res[0].override_react_doc;
  }

  async setOverrideReactDoc(override: string): Promise<boolean> {
    await executeSQL(
      this._conn,
      SQL`UPDATE component SET override_react_doc = ${override} WHERE id = ${this._id}`,
    );
    return true;
  }

  // Not exposed through graphql
  async compiledBundle(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT compiled_bundle FROM component WHERE id = ${this._id}`,
    );
    // TODO Figure out how db-based objects work in the app
    if (res.length === 0) {
      throw new Error(`Non-existent component with ID ${this._id}`);
    }
    return res[0].compiled_bundle;
  }
}

function resolveNode(conn: Connection, id: string): ?Object {
  const separatorIndex = id.indexOf(':');
  const type = id.substr(0, separatorIndex);
  const objID = id.substr(separatorIndex + 1);

  switch (type) {
    case 'viewer':
      return new Viewer(conn);
    case 'repository':
      return new Repository(conn, objID);
    case 'component':
      return new Component(conn, objID);
  }

  return null;
}

const root = {
  // Query
  node: (args, context) => {
    return resolveNode(context.connection, args.id);
  },
  viewer: (args, context) => {
    return new Viewer(context.connection);
  },
  repository: (args, context) => {
    return new Repository(context.connection, args.repositoryID);
  },
  component: (args, context) => {
    return new Component(context.connection, args.componentID);
  },

  // Mutation
  overrideComponentReactDoc: (args, context) => {
    const {
      componentID,
      overrideReactDoc,
      clientMutationId,
    } = args.input;
    const component = new Component(context.connection, componentID);
    return component
      .setOverrideReactDoc(overrideReactDoc)
      .then(success => {
        return {
          clientMutationId,
          success,
          component,
        };
      });
  },
};


async function main() {
  printAction('Connecting to MySQL...');
  const conn = await connectToMySQL(dbconfig);
  printActionResult('Connected.');

  try {
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

    app.get('/component/:componentID/bundle.js', (req, res) => {
      const component = new Component(conn, req.params.componentID);
      component.compiledBundle()
        .then(bundle => {
          res.type('application/javascript').send(bundle);
        })
        .catch(err => {
          res.status(404).send('Not found');
        });
    });

    const graphQLHandlerOpts = {
      schema: schema,
      rootValue: root,
      context: {
        connection: conn,
      },
    };
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
