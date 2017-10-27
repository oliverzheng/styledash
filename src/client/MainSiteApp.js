/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';
import window from 'global/window';
import 'whatwg-fetch'; // polyfill global fetch

import InputField from './common/ui/InputField';
import ButtonWithAction from './common/ui/ButtonWithAction';
import Spacing from './common/ui/Spacing';
import SubText from './common/ui/SubText';
import Link from './common/ui/Link';
import {
  SERVER_WAITLIST_ADD_EMAIL_PATH,
  LOGIN_PATH,
} from '../clientserver/urlPaths';
import {isEmailValid} from '../clientserver/authentication';

import './MainSiteApp.css';

type StateType = {
  email: string,
  didSubmit: boolean,
};

export default class MainSiteApp extends React.Component<*, StateType> {
  static htmlBodyClassName = 'MainSiteApp-htmlBody';

  state = {
    email: '',
    didSubmit: false,
  };

  _emailInput: ?InputField;

  render(): React$Element<*> {
    let notify;
    if (this.state.didSubmit) {
      notify = (
        <div
          className={
            classnames('MainSiteApp-notified', Spacing.margin.top.n36)
          }
          dangerouslySetInnerHTML={{__html: '&#128076;'}}
        />
      );
    } else {
      notify = (
        <div
          className={
            classnames('MainSiteApp-notify', Spacing.margin.top.n36)
          }>
          <div
            className={
              classnames(
                'MainSiteApp-notify-highlight',
                Spacing.margin.bottom.n12,
              )
            }>
            Be notified when Styledash is available.
          </div>
          <div
            className={
              classnames(
                'MainSiteApp-notify-email',
                Spacing.margin.bottom.n40,
              )
            }>
            <InputField
              value={this.state.email}
              onChange={this._onEmailChange}
              placeholder="Email address"
              className={
                classnames('MainSiteApp-notify-input', Spacing.margin.right.n4)
              }
              type="email"
              ref={c => this._emailInput = c}
            />
            <ButtonWithAction
              disabled={!isEmailValid(this.state.email)}
              glyph="bell"
              onClick={this._registerEmail}>
              Notify Me
            </ButtonWithAction>
          </div>
          <div>
            <SubText>
              <Link href={LOGIN_PATH} plainLink>
                Have an account?
              </Link>
            </SubText>
          </div>
        </div>
      );
    }

    return (
      <div className="MainSiteApp-root">
        <h1 className="MainSiteApp-title">
          Styledash
        </h1>
        <div
          className={
            classnames('MainSiteApp-description', Spacing.margin.top.n36)
          }>
          Automatically generate documentation and maintain a style guide for
          your UI components.
        </div>
        <div
          className={
            classnames('MainSiteApp-tagLine', Spacing.margin.top.n36)
          }>
          Private beta coming soon.
        </div>
        {notify}
      </div>
    );
  }

  _onEmailChange = (e: SyntheticEvent<*>) => {
    invariant(e.target instanceof HTMLInputElement, 'flow');
    this.setState({
      email: e.target.value,
    });
  }

  _registerEmail = () => {
    window.fetch(
      SERVER_WAITLIST_ADD_EMAIL_PATH,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.state.email,
        }),
      },
    ).then(() => {
      this.setState({
        didSubmit: true,
      });
    });
  }
}
