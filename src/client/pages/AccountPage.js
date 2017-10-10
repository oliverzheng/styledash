/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import AccountPageWithData from '../account/AccountPageWithData';

type PropType = {
  viewer: {
    user: Object,
  },
};

class AccountPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    return (
      <div>
        <PageHeader />
        <AccountPageWithData user={this.props.viewer.user} />
      </div>
    );
  }
}

const AccountPageContainer = Relay.createContainer(
  AccountPage,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          user {
            ${AccountPageWithData.getFragment('user')}
          }
        }
      `,
    },
  },
);

AccountPageContainer.queries = {
  viewer: () => Relay.QL`
    query {
      viewer
    }
  `,
};

export default AccountPageContainer;
