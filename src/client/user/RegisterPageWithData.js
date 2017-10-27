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
import Card, { CardSection } from '../common/ui/Card';
import InputField from '../common/ui/InputField';
import Button from '../common/ui/Button';
import Spacing from '../common/ui/Spacing';
import Sizing from '../common/ui/Sizing';
import TextColor from '../common/ui/TextColor';
import FixedWidthPageContainer from '../pages/ui/FixedWidthPageContainer';
import PageTitle from '../pages/ui/PageTitle';
import {
  REPOSITORY_LIST_PATH,
  LOGIN_PATH,
} from '../../clientserver/urlPaths';
import {
  genIsLoggedIn,
  genRegister,
  getMessageFromRegisterErrorType,
} from '../util/authentication';
import { type RegisterErrorType } from '../../clientserver/authentication';

type StateType = {
  hasLoginState: boolean,

  registration:
    {
      status: 'blankForm'
    } | {
      status: 'registering'
    } | {
      status: 'error',
      errorType: ?RegisterErrorType,
      errorMessage: string,
    },
};

export default class RegisterPageWithData extends React.Component<*, StateType> {
  state = {
    hasLoginState: false,

    registration: { status: 'blankForm' },
  };

  _inviteCode: ?InputField;
  _firstName: ?InputField;
  _lastName: ?InputField;
  _email: ?InputField;
  _password: ?InputField;
  _confirmPassword: ?InputField;

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
    const {hasLoginState, registration} = this.state;
    if (!hasLoginState) {
      return null;
    }

    let errorType = null;
    let errorMessage = null;
    let registerDisabled = false;
    switch (registration.status) {
      case 'blankForm':
        break;
      case 'registering':
        registerDisabled = true;
        break;
      case 'error':
        errorType = registration.errorType;
        errorMessage = registration.errorMessage;
        break;
      default:
        invariant(false, 'Unknown login state');
    }

    return (
      <FixedWidthPageContainer
        className={Spacing.margin.top.n40}
        width="supernarrow">
        <PageTitle>
          Sign Up
        </PageTitle>
        <div
          className={
            classnames(Spacing.margin.top.n20, Spacing.margin.bottom.n28)
          }>
          Styledash is currently invite only. If you have an invite code, enter
          it below.
        </div>
        <form onSubmit={this._register}>
          <Card className={Spacing.margin.top.n32}>
            <CardSection className={Spacing.padding.vert.n16}>
              <div className={Spacing.margin.bottom.n12}>
                Invite Code
              </div>
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                )}
                ref={c => this._inviteCode = c}
                placeholder="Invite Code"
              />
              {
                (
                  errorType === 'invalidInviteCode' ||
                  errorType === 'inviteCodeAlreadyUsed'
                )
                  ? this._renderErrorMessage(nullthrows(errorMessage), true)
                  : null
              }
            </CardSection>
            <CardSection className={Spacing.padding.vert.n16}>
              <div className={Spacing.margin.bottom.n12}>
                About You
              </div>
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                  Spacing.margin.bottom.n12,
                )}
                ref={c => this._firstName = c}
                placeholder="First Name"
              />
              {
                errorType === 'invalidFirstName'
                  ? this._renderErrorMessage(nullthrows(errorMessage), false)
                  : null
              }
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                )}
                ref={c => this._lastName = c}
                placeholder="Last Name"
              />
              {
                errorType === 'invalidLastName'
                  ? this._renderErrorMessage(nullthrows(errorMessage), true)
                  : null
              }
            </CardSection>
            <CardSection className={Spacing.padding.vert.n16}>
              <div className={Spacing.margin.bottom.n12}>
                Login Details
              </div>
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                  Spacing.margin.bottom.n12,
                )}
                ref={c => this._email = c}
                type="email"
                placeholder="Email"
              />
              {
                (
                  errorType === 'invalidEmail' ||
                  errorType === 'emailAlreadyInUse'
                )
                  ? this._renderErrorMessage(nullthrows(errorMessage), false)
                  : null
              }
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                  Spacing.margin.bottom.n12,
                )}
                type="password"
                ref={c => this._password = c}
                placeholder="Password"
              />
              {
                errorType === 'invalidPassword'
                  ? this._renderErrorMessage(nullthrows(errorMessage), false)
                  : null
              }
              <InputField
                className={classnames(
                  Sizing.width.pct.n100,
                )}
                type="password"
                ref={c => this._confirmPassword = c}
                placeholder="Confirm Password"
              />
              {
                errorType === 'passwordMismatch'
                  ? this._renderErrorMessage(nullthrows(errorMessage), true)
                  : null
              }
            </CardSection>
            <CardSection className={Spacing.padding.vert.n12}>
              <Button
                className={classnames(Sizing.width.pct.n100)}
                disabled={registerDisabled}>
                Sign Up
              </Button>
            </CardSection>
          </Card>
        </form>
        <div
          className={classnames(
            Spacing.margin.top.n40,
            Spacing.alignText.center,
          )}>
          <SubText>
            <Link href={LOGIN_PATH}>
              Have an account?
            </Link>
          </SubText>
        </div>
        <div
          className={classnames(
            Spacing.margin.top.n28,
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

  _renderErrorMessage(
    msg: string,
    isLastElement: boolean,
  ): React$Node {
    return (
      <div
        className={classnames(
          {
            [Spacing.margin.top.n12]: isLastElement,
            [Spacing.margin.bottom.n12]: !isLastElement,
          },
          TextColor.accentInvert,
        )}>
        {msg}
      </div>
    );
  }

  _register = async (e: SyntheticEvent<*>) => {
    e.preventDefault();

    const inviteCode = nullthrows(this._inviteCode).getElement().value;
    const firstName = nullthrows(this._firstName).getElement().value;
    const lastName = nullthrows(this._lastName).getElement().value;
    const email = nullthrows(this._email).getElement().value;
    const password = nullthrows(this._password).getElement().value;
    const confirmPassword = nullthrows(this._confirmPassword).getElement().value;

    if (password !== confirmPassword) {
      this.setState({
        registration: {
          status: 'error',
          errorType: 'passwordMismatch',
          errorMessage: nullthrows(
            getMessageFromRegisterErrorType('passwordMismatch')
          ),
        },
      });
      return;
    }

    this.setState({
      registration: { status: 'registering' },
    });

    const {registerSuccess, registerError} = await genRegister(
      email,
      password,
      firstName,
      lastName,
      inviteCode,
    );

    if (registerSuccess) {
      browserHistory.replace(LOGIN_PATH);
    } else {
      let errorMessage;
      if (registerError && registerError.type) {
        errorMessage = getMessageFromRegisterErrorType(registerError.type);
      }

      this.setState({
        registration: {
          status: 'error',
          errorType: registerError ? registerError.type : null,
          errorMessage:
            errorMessage || 'Unknown error while signing up',
        },
      });
    }
  }
}
