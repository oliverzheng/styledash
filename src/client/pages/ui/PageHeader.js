/** @flow */

import React from 'react';

import Link from '../../common/ui/Link';
import {
  genIsLoggedIn,
  addLoginStatusChangeListener,
  removeLoginStatusChangeListener,
} from '../../util/authentication';
import FullWidthPageContainer from './FullWidthPageContainer';
import {
  REPOSITORY_LIST_PATH,
  ACCOUNT_PATH,
  LOGIN_PATH,
  LOGOUT_PATH,
} from '../../../clientserver/urlPaths';

import './PageHeader.css';

type PropType = {
  showLoginWhenLoggedOut: boolean,
};

type StateType = {
  isLoggedIn: ?boolean,
};

export default class PageHeader extends React.Component<PropType, StateType> {
  static defaultProps = {
    showLoginWhenLoggedOut: true,
  };

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
        <Link key="account" href={ACCOUNT_PATH}>Account</Link>
      ), (
        <Link key="help" href="#">Help</Link>
      ), (
        <Link key="logout" href={LOGOUT_PATH}>Logout</Link>
      )];
    } else {
      links = (
        this.props.showLoginWhenLoggedOut
          ? <Link href={LOGIN_PATH}>Login</Link>
          : null
      );
    }

    return (
      <FullWidthPageContainer className="PageHeader-root">
        <div className="PageHeader-links">
          {links}
        </div>
        <h1>
          <Link href={REPOSITORY_LIST_PATH}>
            Styledash
          </Link>
        </h1>
      </FullWidthPageContainer>
    );
  }
}
