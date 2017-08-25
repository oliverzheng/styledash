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

  async username(): Promise<string> {
    return await username();
  }

  async repositories(): Promise<Array<Repository>> {
    return await Repository.getAllRepositories(this._conn);
  }
}

class Repository {
  _conn: Connection;
  id: string;

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
    this.id = id;
  }

  async name(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT name FROM repository WHERE id = ${this.id}`,
    );
    return res[0].name;
  }

  async components(): Promise<Array<Component>> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT id FROM component WHERE repository_id = ${this.id}`,
    );
    return res.map(row => new Component(this._conn, row.id));
  }
}

class Component {
  _conn: Connection;
  id: string;

  constructor(conn: Connection, id: string) {
    this._conn = conn;
    this.id = id;
  }

  async name(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT name FROM component WHERE id = ${this.id}`,
    );
    return res[0].name;
  }

  async repository(): Promise<Repository> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT repository_id FROM component WHERE id = ${this.id}`,
    );
    return new Repository(this._conn, res[0].repository_id);
  }

  async filepath(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT filepath FROM component WHERE id = ${this.id}`,
    );
    return res[0].filepath;
  }

  compiledBundleURI(): string {
    return `/component/${this.id}/bundle.js`;
  }

  // Not exposed through graphql
  async compiledBundle(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT compiled_bundle FROM component WHERE id = ${this.id}`,
    );
    // TODO Figure out how db-based objects work in the app
    if (res.length === 0) {
      throw new Error(`Non-existent component with ID ${this.id}`);
    }
    return res[0].compiled_bundle;
  }
}

const root = {
  viewer: (args, context) => {
    return new Viewer(context.connection);
  },
  repository: (args, context) => {
    return new Repository(context.connection, args.id);
  },
  component: (args, context) => {
    return new Component(context.connection, args.id);
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
    cleanupConnection(conn);
  }
}

main();
