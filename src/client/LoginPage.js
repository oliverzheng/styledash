/** @flow */

import React from 'react';

import Link from './Link';
import {
  genIsLoggedIn,
  genLogIn,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from './authentication';

type StateType = {
  login: ?{
    isLoggedIn: boolean,
  },
  loginError: ?string,
  isLoggingIn: boolean,
};

export default class LoginPage extends React.Component<*, StateType> {
  state = {
    login: null,
    loginError: null,
    isLoggingIn: false,
  };

  componentWillMount() {
    genIsLoggedIn().then(
      isLoggedIn => this.setState({ login: { isLoggedIn } }),
    );

    addLoginStatusChangeListener(this._setLoginState);
  }

  componentWillUnmount() {
    removeLoginStatusChangeListener(this._setLoginState);
  }

  _setLoginState = (prevIsLoggedIn: ?boolean, isLoggedIn: boolean) => {
    this.setState({
      login: { isLoggedIn },
    });
  }

  render() {
    const {login, loginError} = this.state;
    if (!login) {
      return <div />;
    }

    let status = null;
    let link = null;
    let loginForm = null;
    if (login.isLoggedIn) {
      status = 'Logged in';
      link = <Link href="/logout">Logout</Link>;
    } else {
      status = 'Not logged in';
      loginForm = (
        <form onSubmit={this._login}>
          <p>Email: <input type="text" ref="email" /></p>
          <p>Password: <input type="password" ref="password" /></p>
          <input
            type="submit"
            value="login"
            disabled={this.state.isLoggingIn}
          />
          <p>{loginError}</p>
        </form>
      );
    }

    return (
      <div>
        <p>
          {status}
          {' '}
          {link}
        </p>
        <p>
          <Link href="/">Home</Link>
        </p>
        {loginForm}
      </div>
    );
  }

  _login = async (e: SyntheticEvent<*>) => {
    e.preventDefault();

    this.setState({
      loginError: null,
      isLoggingIn: true,
    });

    const {loginSuccess, loginError} = await genLogIn(
      this.refs.email.value,
      this.refs.password.value,
    );

    // Only set the state if login failed. If it succeeded, the main app will
    // redirect.
    if (!loginSuccess) {
      this.setState({
        isLoggingIn: false,
        loginError:
          loginError
            ? loginError.type
            : 'Unknown error while logging in',
      });
    }
  }
}
