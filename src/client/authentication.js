/** @flow */

import invariant from 'invariant';
import window from 'global/window';
import 'whatwg-fetch'; // polyfill global fetch

import {
  SERVER_LOGIN_ADDRESS,
  SERVER_LOGOUT_ADDRESS,
  SERVER_IS_LOGGED_IN_ADDRESS,
} from '../serverConfig';

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
    SERVER_IS_LOGGED_IN_ADDRESS,
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
): Promise<boolean> {
  const res = await window.fetch(
    SERVER_LOGIN_ADDRESS,
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
  return json.loginSuccess;
}

export async function genLogOut(): Promise<boolean> {
  const res = await window.fetch(
    SERVER_LOGOUT_ADDRESS,
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
