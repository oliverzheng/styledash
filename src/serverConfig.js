/** @flow */

export const SERVER_PORT = 8000;
export const SERVER_HOST = 'localhost'; // TODO
export const SERVER_ADDRESS = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const SERVER_GRAPHQL_ADDRESS = `${SERVER_ADDRESS}/graphql`;

export const SERVER_LOGIN_PATH = '/api/login';
export const SERVER_LOGIN_ADDRESS = `${SERVER_ADDRESS}${SERVER_LOGIN_PATH}`;
export const SERVER_LOGOUT_PATH = '/api/logout';
export const SERVER_LOGOUT_ADDRESS = `${SERVER_ADDRESS}${SERVER_LOGOUT_PATH}`;
export const SERVER_IS_LOGGED_IN_PATH = '/api/isLoggedIn';
export const SERVER_IS_LOGGED_IN_ADDRESS = `${SERVER_ADDRESS}${SERVER_IS_LOGGED_IN_PATH}`;
