/** @flow */

//// Server

// GraphQL
export const SERVER_GRAPHQL_PATH = '/graphql';

// Auth
export const SERVER_LOGIN_PATH = '/api/login';
export const SERVER_LOGOUT_PATH = '/api/logout';
export const SERVER_IS_LOGGED_IN_PATH = '/api/isLoggedIn';
export const SERVER_REGISTER_PATH = '/api/register';

// Main site
export const SERVER_WAITLIST_ADD_EMAIL_PATH = '/api/waitlist_add_email';

// Github OAuth: each is a pair of URLs where the login eventually redirects to
// the callback.
export const SERVER_GITHUB_OAUTH_LOGIN_ACCOUNT = '/github/login/account';
export const SERVER_GITHUB_OAUTH_CALLBACK_ACCOUNT = '/github/callback/account';
export const SERVER_GITHUB_OAUTH_LOGIN_NEW_REPOSITORY = '/github/login/newrepository';
export const SERVER_GITHUB_OAUTH_CALLBACK_NEW_REPOSITORY = '/github/callback/newrepository';

// Github webhook
export const SERVER_GITHUB_WEBHOOK_PATH = '/github/webhook';

// URLs the client needs to go to but are server-based
export const NON_ROUTER_SERVER_PATHS = [
  SERVER_GITHUB_OAUTH_LOGIN_ACCOUNT,
  SERVER_GITHUB_OAUTH_LOGIN_NEW_REPOSITORY,
];


//// Client/server shared

export const MAIN_SITE_PATH = '/';
export const REPOSITORY_LIST_PATH = '/home';
export const REPOSITORY_PATH = '/repository';
export const NEW_REPOSITORY_PATH = '/repository/new';
export const COMPONENT_PATH = '/component';
export const ACCOUNT_PATH = '/account';
export const LOGIN_PATH = '/login';
export const LOGOUT_PATH = '/logout';
export const REGISTER_PATH = '/signup';
export const COMPONENT_RENDER_PATH = '/componentRenderIFrame';
