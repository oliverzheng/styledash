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

import dbconfig from '../dbconfig.json';
import {
  type Connection,
  connectToMySQL,
  executeSQL,
  cleanupConnection,
} from './mysql';
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

  name(): string {
    return 'herp derp';
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

  async compiledBundle(): Promise<string> {
    const res = await executeSQL(
      this._conn,
      SQL`SELECT compiled_bundle FROM component WHERE id = ${this.id}`,
    );
    return res[0].compiled_bundle;
  }
}

const root = {
  hello: () => 'Hello world',
  viewer: (args, context) => {
    return new Viewer(context.connection);
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

    app.get('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    }));

    app.post('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: root,
      context: {
        connection: conn,
      },
      graphiql: false,
    })); 

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
