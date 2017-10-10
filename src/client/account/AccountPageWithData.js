/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageWithMenu from '../pages/ui/PageWithMenu';

type PropType = {
  user: {
    firstName: string,
  },
};

class AccountPageWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    return (
      <PageWithMenu
        pageTitle="Account"
        sections={[{
          menuTitle: 'GitHub',
          sectionTitle: 'GitHub',
          children: (
            // TODO
            <div>
              github
            </div>
          ),
        }]}
        wide={false}
      />
    );
  }
}

const AccountPageWithDataContainer = Relay.createContainer(
  AccountPageWithData,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          firstName
        }
      `,
    },
  },
);

export default AccountPageWithDataContainer;
