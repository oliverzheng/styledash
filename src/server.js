/** @flow */

import fs from 'fs';
import path from 'path';

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import {buildSchema} from 'graphql';
import graphqlHTTP from 'express-graphql';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

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
import {SERVER_PORT, SERVER_COOKIE_SECRET} from './serverConfig';
import graphqlRoot from './server/graphqlRoot';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './server/schema.graphql')).toString()
);

async function main() {
  printAction('Connecting to MySQL...');
  const conn = await connectToMySQL(dbconfig);
  printActionResult('Connected.');

  try {
    passport.use(new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      (email, password, done) => {
        // TODO
        if (false) {
          // error
          return done({err: true});
        } else if (false) {
          // no user
          return done(null, false, { message: 'No user' });
        } else {
          return done(null, {userID: 1337});
        }
      },
    ));

    const vc = new ViewerContext(conn, '');
    const app = express();

    app.use(morgan('dev'));
    app.use(cookieParser(SERVER_COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(passport.initialize());

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

    // Extract logged in user
    app.use((req, res, next) => {
      const loginCookie = req.signedCookies.login;
      if (loginCookie) {
        req.loggedInUserID = loginCookie.userID;
      }
      next();
    });

    app.get('/', (req, res) => {
      res.send('derp ' + req.loggedInUserID);
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
    app.post(
      '/login',
      passport.authenticate(
        'local',
        {
          session: false,
          failureRedirect: '/login',
        },
      ),
      (req, res) => {
        res.cookie(
          'login',
          { userID: req.user.userID },
          {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            signed: true,
            sameSite: false,
          },
        );
        res.redirect('/');
      },
    );

    app.get('/logout', (req, res) => {
      res.clearCookie('login');
      res.redirect('/');
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
