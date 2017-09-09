/** @flow */

import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import CustomStrategy from 'passport-custom';

import type {Connection} from '../storage/mysql';
import ViewerContext from '../entity/vc';

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

export function initAuth(conn: Connection) {
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

  return passport.initialize({ userProperty: 'vc' }); 
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
        if (vc.isAuthenticated()) {
          setCookieUserIDOnResponse(res, vc.getUserID());
        }
        res.json({
          // The current login attempt may replace another existing login.
          // Failure to login does not replace an existing login though.
          loginSuccess: vc.isAuthenticated(),
          isLoggedIn:
            vc.isAuthenticated() || getCookieUserIDFromRequest(req) != null,
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

    const conn = req.vc.getDatabaseConnection();
    req.logout(); // this deletes req.vc. let's set it back.
    req.vc = new ViewerContext(conn, null);

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
