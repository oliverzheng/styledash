/** @flow */

import React from 'react';

import Link from '../common/ui/Link';
import PageHeader from './ui/PageHeader';
import {
  genIsLoggedIn,
  genLogIn,
  genRegister,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from '../util/authentication';

type StateType = {
  login: ?{
    isLoggedIn: boolean,
  },
  loginError: ?string,
  isLoggingIn: boolean,

  registerError: ?string,
  isRegistering: boolean,
};

export default class LoginPage extends React.Component<*, StateType> {
  state = {
    login: null,
    loginError: null,
    isLoggingIn: false,

    registerError: null,
    isRegistering: false,
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
    const {login, loginError, registerError} = this.state;
    if (!login) {
      return <div />;
    }

    let status = null;
    let link = null;
    let loginForm = null;
    let registerForm = null;
    if (login.isLoggedIn) {
      status = 'Logged in';
      link = <Link href="/logout">Logout</Link>;
    } else {
      status = 'Not logged in';
      loginForm = (
        <form onSubmit={this._login}>
          <p>Email: <input type="text" ref="loginEmail" /></p>
          <p>Password: <input type="password" ref="loginPassword" /></p>
          <input
            type="submit"
            value="login"
            disabled={this.state.isLoggingIn}
          />
          <p>{loginError}</p>
        </form>
      );
      registerForm = (
        <form onSubmit={this._register}>
          <p>Email: <input type="text" ref="registerEmail" /></p>
          <p>Password: <input type="password" ref="registerPassword" /></p>
          <p>First name: <input type="text" ref="registerFirstName" /></p>
          <p>Last name: <input type="text" ref="registerLastName" /></p>
          <input
            type="submit"
            value="register"
            disabled={this.state.isRegistering}
          />
          <p>{registerError}</p>
        </form>
      );
    }

    return (
      <div>
        <PageHeader />
        <p>
          {status}
          {' '}
          {link}
        </p>
        <hr />
        <p>Login</p>
        {loginForm}
        <hr />
        <p>Register</p>
        {registerForm}
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
      this.refs.loginEmail.value,
      this.refs.loginPassword.value,
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

  _register = async (e: SyntheticEvent<*>) => {
    e.preventDefault();

    this.setState({
      registerError: null,
      isRegistering: true,
    });

    const {
      registerEmail,
      registerPassword,
      registerFirstName,
      registerLastName,
      loginEmail,
      loginPassword,
    } = this.refs;
    const {registerSuccess, registerError} = await genRegister(
      registerEmail.value,
      registerPassword.value,
      registerFirstName.value,
      registerLastName.value,
    );

    if (registerSuccess) {
      loginEmail.value = registerEmail.value;
      loginPassword.value = registerPassword.value;

      registerEmail.value = null;
      registerPassword.value = null;
      registerFirstName.value = null;
      registerLastName.value = null;

      loginEmail.focus();

      this.setState({
        isRegistering: false,
        registerError: null,
      });
    } else {
      this.setState({
        isRegistering: false,
        registerError:
          registerError
            ? registerError.type
            : 'Unknown error when registering',
      });
    }
  }
}
