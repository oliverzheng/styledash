/** @flow */

import process from 'process';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import exphbs from 'express-handlebars';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import invariant from 'invariant';
import 'source-map-support/register';

import envConfig from './envConfig';
import EntComponent from './entity/EntComponent';
import EntWaitlistEmail from './entity/EntWaitlistEmail';
import {
  connectToMySQL,
  cleanupMySQLConnection,
} from './storage/mysql';
import {
  genConnectToServer,
  genDisconnectFromServer,
} from './storage/queue';
import {
  printAction,
  printActionResult,
  printError,
} from './consoleUtil';
import {
  SERVER_GRAPHQL_PATH,
  SERVER_LOGIN_PATH,
  SERVER_LOGOUT_PATH,
  SERVER_IS_LOGGED_IN_PATH,
  SERVER_REGISTER_PATH,

  SERVER_WAITLIST_ADD_EMAIL_PATH,

  MAIN_SITE_PATH,
  REPOSITORY_LIST_PATH,
  REPOSITORY_PATH,
  NEW_REPOSITORY_PATH,
  COMPONENT_PATH,
  LOGIN_PATH,
  LOGOUT_PATH,
  COMPONENT_RENDER_PATH,
} from './clientserver/urlPaths';
import {graphqlAPI, graphiql} from './server/graphql';
import {
  initAuth,
  login,
  authenticate,
  logout,
  isLoggedIn,
  requireAuth,
  register,
} from './server/authentication';
import getClientAssetURLs from './server/getClientAssetURLs';
import getResourcePath from './getResourcePath';
import {getClientBuildDir} from './prodCompileConstants';
import {getClientDevWebpackConfig} from './devConstants';

let webpackConfig = null;
if (process.env.NODE_ENV === 'development') {
  webpackConfig = getClientDevWebpackConfig();
}

async function main() {
  printAction('Starting web server');

  printAction('Connecting to MySQL...');
  const dbConn = await connectToMySQL(envConfig.dbURL);
  printActionResult('Connected.');

  printAction('Connecting to RabbitMQ...');
  const queueConn = await genConnectToServer(envConfig.queueURL);
  printActionResult('Connected.');


  try {
    // Setup
    const app = express();
    app.use(morgan('dev'));
    app.use(cookieParser(envConfig.server.cookieSecret));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(initAuth(dbConn, queueConn));

    app.engine('handlebars', exphbs({
      defaultLayout: 'main',
      layoutsDir: getResourcePath('views/'),
    }));
    app.set('view engine', 'handlebars');
    app.set('views', getResourcePath('views/'));

    // Auth
    app.post(SERVER_LOGIN_PATH, login());
    app.all('*', authenticate({ loginPath: SERVER_LOGIN_PATH, loginMethod: 'POST' }));
    app.post(SERVER_LOGOUT_PATH, logout());
    app.get(SERVER_IS_LOGGED_IN_PATH, isLoggedIn());
    app.post(SERVER_REGISTER_PATH, register());

    if (process.env.NODE_ENV === 'production') {
      app.use('/_static', express.static(getClientBuildDir()));
    } else {
      app.get('/_static/*', webpackDevMiddleware(
        webpack(webpackConfig),
        {
          publicPath: '/_static',
        }
      ));
    }

    app.get(MAIN_SITE_PATH, (req, res) => {
      const assets = getClientAssetURLs('main-site');
      res.render('index', {
        layout: false,
        scripts: assets.js.map(url => ({url: `/_static/${url}`})),
        stylesheets: assets.css.map(url => ({url: `/_static/${url}`})),
      });
    });
    app.post(SERVER_WAITLIST_ADD_EMAIL_PATH, async (req, res) => {
      await EntWaitlistEmail.genWaitlist(req.vc, req.body.email);
      res.send();
    });

    const showReactApp = (req, res) => {
      const assets = getClientAssetURLs('app');
      res.render('index', {
        layout: false,
        scripts: assets.js.map(url => ({url: `/_static/${url}`})),
        stylesheets: assets.css.map(url => ({url: `/_static/${url}`})),
      });
    };
    app.get(
      [
        REPOSITORY_LIST_PATH,
        REPOSITORY_PATH,
        NEW_REPOSITORY_PATH,
        COMPONENT_PATH,
        LOGIN_PATH,
        LOGOUT_PATH,
        COMPONENT_RENDER_PATH,
      ].map(urlPath => urlPath + '(/*)?'),
      showReactApp,
    );

    // Business logic
    // TODO refactor this out so EntComponent doesn't have this url cloned
    app.get('/_componentBundle/:componentID/bundle.js', async (req, res) => {
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
      SERVER_GRAPHQL_PATH,
      requireAuth((req, res) => res.send('Unauthenticated', 401)),
      graphqlAPI(),
    );
    app.get(
      SERVER_GRAPHQL_PATH,
      requireAuth((req, res) => res.send('Unauthenticated', 401)),
      (req, res, next) => {
        if (req.vc.isDevEnvironment()) {
          next();
        } else {
          res.redirect('/');
        }
      },
      graphiql(),
    );

    const port = envConfig.server.port;
    invariant(port != null, 'No PORT env variable');
    printAction(`Setting up listener on port ${port}...`);
    app.listen(port, () => {
      printActionResult('Listener setup.');
    });
  }
  catch (err) {
    printError(err);
    cleanupMySQLConnection(dbConn);
    await genDisconnectFromServer(queueConn);
  }
}

main();
