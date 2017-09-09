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
};

export default class LoginPage extends React.Component<*, StateType> {
  state = {
    login: null,
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
    const {login} = this.state;
    if (!login) {
      return <div />;
    }

    let status = null;
    let link = null;
    if (login.isLoggedIn) {
      status = 'Logged in';
      link = <Link href="/logout">Logout</Link>;
    } else {
      status = 'Not logged in';
      link = <button onClick={this._login}>Login</button>;
    }

    return (
      <div>
        {status}
        <p>
          <Link href="/">Home</Link>
        </p>
        <p>
          {link}
        </p>
      </div>
    );
  }

  _login() {
    genLogIn('emai', 'pass');
  }
}
