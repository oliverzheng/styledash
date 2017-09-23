/** @flow */

import invariant from 'invariant';
import window from 'global/window';
import 'whatwg-fetch'; // polyfill global fetch

import {
  SERVER_LOGIN_PATH,
  SERVER_LOGOUT_PATH,
  SERVER_IS_LOGGED_IN_PATH,
  SERVER_REGISTER_PATH,
} from '../../clientserver/serverConfig';
import {
  type RegisterErrorType,
} from '../../clientserver/authentication';

let authStore: ?{isLoggedIn: boolean} = null;

const authChangeListeners = [];

function setAuthStoreLogin(isLoggedIn: boolean) {
  const prevStore = authStore;
  authStore = { isLoggedIn };

  if (!prevStore || prevStore.isLoggedIn !== isLoggedIn) {
    let prevStatus = null; // the null not being true or false is important
    if (prevStore) {
      prevStatus = prevStore.isLoggedIn;
    }
    authChangeListeners.forEach(
      listener => listener(prevStatus, isLoggedIn),
    );
  }
}

export function addLoginStatusChangeListener(
  listener: (prevStatus: ?boolean, newStatus: boolean) => any,
) {
  invariant(
    authChangeListeners.indexOf(listener) === -1,
    'Auth change listener already added',
  );
  authChangeListeners.push(listener);
}

export function removeLoginStatusChangeListener(
  listener: (prevStatus: ?boolean, newStatus: boolean) => any,
) {
  const idx = authChangeListeners.indexOf(listener);
  invariant(idx !== -1, 'Auth change listener does not exist');
  authChangeListeners.splice(idx, 1);
}

// TODO consolidate multiple calls to this so only 1 network request gets sent
export async function genIsLoggedIn(): Promise<boolean> {
  if (authStore) {
    return authStore.isLoggedIn;
  }

  const res = await window.fetch(
    SERVER_IS_LOGGED_IN_PATH,
    {
      method: 'GET',
      // TODO
      credentials: 'include',
    },
  );
  const json = await res.json();
  setAuthStoreLogin(json.isLoggedIn);
  return json.isLoggedIn;
}

// Returns if is successful in logging in
export async function genLogIn(
  email: string,
  password: string,
): Promise<{
  loginSuccess: boolean,
  loginError: ?{
    type: 'invalidCredentials',
  },
  isLoggedIn: boolean,
}> {
  const res = await window.fetch(
    SERVER_LOGIN_PATH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
      // TODO
      credentials: 'include',
    },
  );
  const json = await res.json();

  // Failing login does not invalidate an existing login
  setAuthStoreLogin(json.isLoggedIn);

  const jsonLoginError = json.loginError;
  let loginError = null;
  if (jsonLoginError) {
    const {type} = jsonLoginError;
    if (type && type === 'invalidCredentials') {
      loginError = {
        type: 'invalidCredentials',
      };
    }
  }

  return {
    loginSuccess: json.loginSuccess,
    loginError: loginError,
    isLoggedIn: json.isLoggedIn,
  };
}

export async function genLogOut(): Promise<boolean> {
  const res = await window.fetch(
    SERVER_LOGOUT_PATH,
    {
      method: 'POST',
      // TODO
      credentials: 'include',
    },
  );
  const json = await res.json();
  setAuthStoreLogin(json.isLoggedIn);
  return json.isLoggedIn;
}

export async function genRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{
  registerSuccess: boolean,
  registerError: ?{
    type: RegisterErrorType,
  },
  isLoggedIn: boolean,
}> {
  const res = await window.fetch(
    SERVER_REGISTER_PATH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
      }),
      // TODO
      credentials: 'include',
    },
  );
  const json = await res.json();

  return {
    registerSuccess: json.registerSuccess,
    registerError: json.registerError,
    isLoggedIn: json.isLoggedIn,
  };
}
