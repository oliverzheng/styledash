/** @flow */

import React from 'react';

import PageHeader from './ui/PageHeader';
import LoginPageWithData from '../user/LoginPageWithData';

export default class LoginPage extends React.Component<*> {
  render() {
    return (
      <div>
        <PageHeader showLoginWhenLoggedOut={false} />
        <LoginPageWithData />
      </div>
    );
  }
}
