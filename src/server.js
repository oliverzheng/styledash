/** @flow */

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import dbconfig from '../dbconfig.json'; // TODO use env
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
import {
  SERVER_PORT,
  SERVER_LOGIN_PATH,
  SERVER_LOGOUT_PATH,
  SERVER_IS_LOGGED_IN_PATH,
} from './serverConfig';
import {graphqlAPI, graphiql} from './server/graphql';
import {
  initAuth,
  login,
  authenticate,
  logout,
  isLoggedIn,
  requireAuth,
} from './server/authentication';


async function main() {
  printAction('Connecting to MySQL...');
  const conn = await connectToMySQL(dbconfig);
  printActionResult('Connected.');

  try {
    // Setup
    const app = express();
    app.use(morgan('dev'));
    app.use(cookieParser(dbconfig.cookieSecret));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(initAuth(conn));

    // TODO - react is hot-served via webpack on a different port right now
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      next();
    });

    // Auth
    app.post(SERVER_LOGIN_PATH, login());
    app.all('*', authenticate({ loginPath: SERVER_LOGIN_PATH, loginMethod: 'POST' }));
    app.post(SERVER_LOGOUT_PATH, logout());
    app.get(SERVER_IS_LOGGED_IN_PATH, isLoggedIn());

    // Temp
    app.get('/', (req, res) => {
      res.send('derp ' + req.vc.getUserID());
    });
    app.get('/login', (req, res) => {
      if (res.user) {
        res.send('logged in');
      } else {
        res.send(`
          <html>
            <body>
              <h1>Login</h1>
              <form method="POST" action="/login">
                <p>Email: <input type="text" name="email" /></p>
                <p>Password: <input type="password" name="password" /></p>
                <input type="submit" value="Login" />
              </form>
            </body>
          </html>
        `);
      }
    });

    // Business logic
    app.get('/component/:componentID/bundle.js', async (req, res) => {
      const component =
        await EntComponent.genNullable(req.vc, req.params.componentID);
      if (!component) {
        res.status(404).send('Not found');
        return;
      }
      const bundle = await component.genCompiledBundle();
      res.type('application/javascript').send(bundle);
    });

    // GraphQL
    app.post(
      '/graphql',
      requireAuth((req, res) => res.send('Unauthenticated', 401)),
      graphqlAPI(),
    );
    app.get(
      '/graphql',
      requireAuth((req, res) => res.send('Unauthenticated', 401)),
      (req, res, next) => {
        if (req.vc.isDev()) {
          next();
        } else {
          res.redirect('/');
        }
      },
      graphiql(),
    );

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
