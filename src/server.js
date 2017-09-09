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
import CustomStrategy from 'passport-custom';

import dbconfig from '../dbconfig.json';
import ViewerContext from './entity/vc';
import EntComponent from './entity/EntComponent';
import {
  connectToMySQL,
  cleanupConnection,
  type Connection,
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
          return done(null, new ViewerContext(conn, '1337'));
        }
      },
    ));
    passport.use('cookie', new CustomStrategy(
      (req, callback) => {
        const userID = getCookieUserIDFromRequest(req);
        const vc = new ViewerContext(conn, userID);
        callback(null, vc);
      },
    ));

    function setCookieUserIDOnResponse(res: Object, userID: ?string) {
      if (userID != null) {
        res.cookie(
          'login',
          { userID: userID },
          {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            signed: true,
            sameSite: false, // TODO
          },
        );
      } else {
        res.clearCookie('login');
      }
    }
    function getCookieUserIDFromRequest(req: Object): ?string {
      const loginCookie = req.signedCookies.login;
      if (!loginCookie) {
        return null;
      }
      const userID = loginCookie.userID;
      if (typeof userID !== 'string') {
        return null;
      }
      return userID;
    }

    const app = express();

    app.use(morgan('dev'));
    app.use(cookieParser(SERVER_COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(passport.initialize({ userProperty: 'vc' }));

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

    // Exposing authentication. Only /api/login gets special auth handler;
    // everyone else gets it from the cookie.
    const LOGIN_PATH = '/api/login';
    app.post(
      LOGIN_PATH,
      passport.authenticate('local', { session: false }),
      (req, res) => {
        const {vc} = req;
        if (vc.isAuthenticated()) {
          setCookieUserIDOnResponse(res, vc.getUserID());
        }
        res.json({
          isLoggedIn: vc.isAuthenticated(),
        });
      },
    );
    app.all('*', (req, res, next) => {
      if (req.url === LOGIN_PATH && req.method === 'POST') {
        next();
      } else {
        passport.authenticate('cookie', (err, vc, info) => {
          if (err) {
            next(err);
          }
          req.logIn(vc, { session: false }, err => next(err));
        })(req, res, next);
      }
    });
    app.post('/api/logout', (req, res) => {
      setCookieUserIDOnResponse(res, null);

      req.logout(); // this deletes req.vc. let's set it back.
      req.vc = new ViewerContext(conn, null);

      res.json({
        isLoggedIn: req.vc.isAuthenticated(),
      });
    });
    app.get('/api/isLoggedIn', (req, res) => {
      res.json({
        isLoggedIn: req.vc.isAuthenticated(),
      });
    });

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

    const graphQLHandlerOpts = {
      schema: schema,
      rootValue: graphqlRoot,
    };
    app.post('/graphql', graphqlHTTP((req, res) => ({
      ...graphQLHandlerOpts,
      context: {
        vc: req.vc,
      },
      graphiql: false,
    })));
    app.get(
      '/graphql',
      (req, res, next) => {
        if (req.vc.isAuthenticated() && req.vc.isDev()) {
          next();
        } else {
          res.redirect('/');
        }
      },
      graphqlHTTP((req, res) => ({
        ...graphQLHandlerOpts,
        context: {
          vc: req.vc,
        },
        graphiql: true,
      })),
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
