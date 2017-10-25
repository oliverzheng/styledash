/** @flow */

import React from 'react';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import classnames from 'classnames';
import {
  browserHistory,
} from 'react-router';

import Link from '../common/ui/Link';
import SubText from '../common/ui/SubText';
import Card from '../common/ui/Card';
import InputField from '../common/ui/InputField';
import Button from '../common/ui/Button';
import Spacing from '../common/ui/Spacing';
import Sizing from '../common/ui/Sizing';
import FixedWidthPageContainer from '../pages/ui/FixedWidthPageContainer';
import PageTitle from '../pages/ui/PageTitle';
import {
  REPOSITORY_LIST_PATH,
} from '../../clientserver/urlPaths';
import {
  genIsLoggedIn,
  genLogIn,
  getMessageFromLoginErrorType,
} from '../util/authentication';

type StateType = {
  hasLoginState: boolean,

  login:
    {
      status: 'blankForm'
    } | {
      status: 'loggingIn'
    } | {
      status: 'error',
      error: string,
    },
};

export default class LoginPageWithData extends React.Component<*, StateType> {
  state = {
    hasLoginState: false,

    login: { status: 'blankForm' },
  };

  _email: ?InputField;
  _password: ?InputField;

  componentWillMount() {
    genIsLoggedIn().then(
      isLoggedIn => {
        if (isLoggedIn) {
          // If we are logged in already, redirect. This page isn't for logged
          // in users.
          browserHistory.replace(REPOSITORY_LIST_PATH);
        } else {
          this.setState({ hasLoginState: true });
        }
      },
    );
  }

  render() {
    const {hasLoginState, login} = this.state;
    if (!hasLoginState) {
      return null;
    }

    let loginDisabled = false;
    let loginError = null;
    switch (login.status) {
      case 'blankForm':
        break;
      case 'loggingIn':
        loginDisabled = true;
        break;
      case 'error':
        loginError = (
          <div
            className={
              classnames(Spacing.alignText.center, Spacing.margin.top.n12)
            }>
            {login.error}
          </div>
        );
        break;
      default:
        invariant(false, 'Unknown login state');
    }

    return (
      <FixedWidthPageContainer
        className={Spacing.margin.top.n40}
        width="supernarrow">
        <PageTitle>
          Login
        </PageTitle>
        <Card className={Spacing.margin.top.n32}>
          <form
            className={Spacing.padding.vert.n4}
            onSubmit={this._login}>
            <InputField
              className={classnames(
                Sizing.width.pct.n100,
                Spacing.margin.bottom.n12,
              )}
              ref={c => this._email = c}
              placeholder="Email"
            />
            <InputField
              className={classnames(
                Sizing.width.pct.n100,
                Spacing.margin.bottom.n12,
              )}
              type="password"
              ref={c => this._password = c}
              placeholder="Password"
            />
            <Button
              className={classnames(Sizing.width.pct.n100)}
              disabled={loginDisabled}>
              Login
            </Button>
            {loginError}
          </form>
        </Card>
        <div
          className={classnames(
            Spacing.margin.top.n40,
            Spacing.alignText.center,
          )}>
          <SubText>
            Having trouble?<br />
            Email{' '}
            <Link href="mailto:support@styledash.io">
              support@styledash.io
            </Link>
          </SubText>
        </div>
      </FixedWidthPageContainer>
    );
  }

  _login = async (e: SyntheticEvent<*>) => {
    e.preventDefault();

    const email = nullthrows(this._email).getElement().value;
    const password = nullthrows(this._password).getElement().value;
    if (!email || !password) {
      return;
    }

    this.setState({
      login: { status: 'loggingIn' },
    });

    const {loginSuccess, loginError} = await genLogIn(email, password);

    // Only set the state if login failed. If it succeeded, the main app will
    // redirect.
    if (!loginSuccess) {
      let loginErrorMessage;
      if (loginError && loginError.type) {
        loginErrorMessage = getMessageFromLoginErrorType(loginError.type);
      }

      this.setState({
        login: {
          status: 'error',
          error:
            loginErrorMessage || 'Unknown error while logging in',
        },
      });
    }
  }
}
