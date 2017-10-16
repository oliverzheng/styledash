/** @flow */

import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import CustomStrategy from 'passport-custom';

import type {MySQLConnection} from '../storage/mysql';
import type {QueueConnection} from '../storage/queue';
import ViewerContext from '../entity/vc';
import EntUser from '../entity/EntUser';
import {
  isEmailValid,
  isPasswordValid,
  isFirstNameValid,
  isLastNameValid,
  type RegisterErrorType,
} from '../clientserver/authentication';

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

export function initAuth(dbConn: MySQLConnection, queueConn: QueueConnection) {
  const anonymousVC = new ViewerContext(dbConn, queueConn, null);
  const scriptVC = ViewerContext.getScriptViewerContext(dbConn, queueConn);

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const userID = await EntUser.genVerifyLogin(
          anonymousVC,
          email,
          password,
        );
        if (userID) {
          return done(null, new ViewerContext(dbConn, queueConn, userID));
        } else {
          return done(
            null,
            anonymousVC,
            // This is passed to the client
            {
              type: 'invalidCredentials',
            },
          );
        }
      } catch (err) {
        return done(err);
      }
    },
  ));
  passport.use('cookie', new CustomStrategy(
    (req, callback) => {
      const userID = getCookieUserIDFromRequest(req);
      const vc = new ViewerContext(dbConn, queueConn, userID);
      callback(null, vc);
    },
  ));

  return [
    passport.initialize({ userProperty: 'vc' }),
    (req: Object, res: Object, next: Function) => {
      req.scriptVC = scriptVC;
      next();
    },
  ];
}

// Exposing authentication. Only /api/login gets special auth handler;
// everyone else gets it from the cookie.
export function login() {
  return (req: Object, res: Object, next: Function) => {
    passport.authenticate('local', (err, vc, info) => {
      if (err) {
        next(err);
      }
      req.logIn(vc, { session: false }, err => {
        // Passport doesn't even call the strategy unless both email & password
        // are non null, so vc may be null here.
        const isAuthenticated = vc && vc.isAuthenticated();
        if (isAuthenticated) {
          setCookieUserIDOnResponse(res, vc.getUserID());
        }
        res.json({
          // The current login attempt may replace another existing login.
          // Failure to login does not replace an existing login though.
          loginSuccess: isAuthenticated,
          loginError: info,
          isLoggedIn:
            isAuthenticated || getCookieUserIDFromRequest(req) != null,
        });
      });
    })(req, res, next);
  };
}

export function authenticate(
  options: {
    loginPath: string,
    loginMethod: string,
  },
) {
  const {loginPath, loginMethod} = options;
  return (req: Object, res: Object, next: Function) => {
    if (req.url === loginPath && req.method === loginMethod) {
      next();
    } else if (req.vc != null) {
      // We've granted special VC access to this url
      next();
    } else {
      passport.authenticate('cookie', (err, vc, info) => {
        if (err) {
          next(err);
        }
        req.logIn(vc, { session: false }, err => next(err));
      })(req, res, next);
    }
  };
}

export function logout() {
  return (req: Object, res: Object) => {
    setCookieUserIDOnResponse(res, null);

    const dbConn = req.vc.getDatabaseConnection();
    const queueConn = req.vc.getQueueConnection();
    req.logout(); // this deletes req.vc. let's set it back.
    req.vc = new ViewerContext(dbConn, queueConn, null);

    res.json({
      isLoggedIn: req.vc.isAuthenticated(),
    });
  };
}

export function isLoggedIn() {
  return (req: Object, res: Object) => {
    res.json({
      isLoggedIn: req.vc.isAuthenticated(),
    });
  };
}

export function requireAuth(unauthCallback: (Object, Object, Function) => any) {
  return (req: Object, res: Object, next: Function) => {
    const {vc} = req;
    if (vc && vc.isAuthenticated()) {
      next();
    } else {
      unauthCallback(req, res, next);
    }
  };
}


export function register() {
  return async (req: Object, res: Object) => {
    const {vc} = req;
    const {
      email,
      password,
      firstName,
      lastName,
    } = req.method === 'GET' ? req.query : req.body;

    let errorType: ?RegisterErrorType;

    if (vc.isAuthenticated()) {
      errorType = 'alreadyLoggedIn';
    } else if (!email || !isEmailValid(email)) {
      errorType = 'invalidEmail';
    } else if (!password || !isPasswordValid(password)) {
      errorType = 'invalidPassword';
    } else if (!firstName || !isFirstNameValid(firstName)) {
      errorType = 'invalidFirstName';
    } else if (!lastName || !isLastNameValid(lastName)) {
      errorType = 'invalidLastName';
    } else if (await EntUser.genIsEmailAlreadyInUse(vc, email)) {
      errorType = 'emailAlreadyInUse';
    }

    let user = null;
    let error = null;
    if (!errorType) {
      user = await EntUser.genCreate(
        vc,
        email,
        password,
        firstName,
        lastName,
      );
    } else {
      error = {
        type: errorType,
      };
    }

    res.json({
      registerSuccess: user != null,
      registerError: error,
      // We don't change the login status when registering.
      isLoggedIn: vc.isAuthenticated(),
    });
  };
}

export function grantAllPowerfulScriptViewerContext() {
  return async (req: Object, res: Object, next: Function) => {
    req.vc = req.scriptVC;
    next();
  };
}
