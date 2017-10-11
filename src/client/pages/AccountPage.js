/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import AccountPageWithData from '../account/AccountPageWithData';

type PropType = {
  viewer: Object,
};

class AccountPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    return (
      <div>
        <PageHeader />
        <AccountPageWithData viewer={this.props.viewer} />
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
          ${AccountPageWithData.getFragment('viewer')}
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
