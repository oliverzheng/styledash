/** @flow */

import React from 'react';

import PageHeader from './ui/PageHeader';
import RegisterPageWithData from '../user/RegisterPageWithData';

export default class RegisterPage extends React.Component<*> {
  render() {
    return (
      <div>
        <PageHeader />
        <RegisterPageWithData />
      </div>
    );
  }
}
