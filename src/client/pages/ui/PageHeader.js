/** @flow */

import React from 'react';

import Link from '../../common/ui/Link';
import {
  genIsLoggedIn,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from '../../util/authentication';
import FullWidthPageContainer from './FullWidthPageContainer';

import './PageHeader.css';

type StateType = {
  isLoggedIn: ?boolean,
};

export default class PageHeader extends React.Component<*, StateType> {
  state = {
    isLoggedIn: null,
  };

  componentWillMount() {
    genIsLoggedIn().then(
      isLoggedIn => this.setState({ isLoggedIn, }),
    );

    addLoginStatusChangeListener(this._setLoginState);
  }

  componentWillUnmount() {
    removeLoginStatusChangeListener(this._setLoginState);
  }

  _setLoginState = (prevIsLoggedIn: ?boolean, isLoggedIn: boolean) => {
    this.setState({
      isLoggedIn,
    });
  }

  render(): React$Element<*> {
    const {isLoggedIn} = this.state;

    let links;
    if (isLoggedIn == null) {
      // Don't know about the login status yet
      links = null;
    } else if (isLoggedIn) {
      links = [(
        <Link key="account" href="/account">Account</Link>
      ), (
        <Link key="help" href="/help">Help</Link>
      ), (
        <Link key="logout" href="/logout">Logout</Link>
      )];
    } else {
      links = (
        <Link href="/login">Login</Link>
      );
    }

    return (
      <FullWidthPageContainer className="PageHeader-root">
        <div className="PageHeader-links">
          {links}
        </div>
        <h1>
          <Link href="/">
            Styledash
          </Link>
        </h1>
      </FullWidthPageContainer>
    );
  }
}
