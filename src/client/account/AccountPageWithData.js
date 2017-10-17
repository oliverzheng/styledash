/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageWithMenu from '../pages/ui/PageWithMenu';

type PropType = {
  viewer: {
    user: {
      firstName: string,
    },
    githubAccess: ?{
      user: string,
    },
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
          children: this._renderGitHubSection(),
        }]}
        width="normal"
      />
    );
  }

  _renderGitHubSection(): React$Element<*> {
    const {githubAccess} = this.props.viewer;

    if (githubAccess) {
      return (
        <div>
          Connected to GitHub as {githubAccess.user}.
        </div>
      );
    } else {
      return (
        <div>
          Connect to GitHub.
        </div>
      );
    }
  }
}

const AccountPageWithDataContainer = Relay.createContainer(
  AccountPageWithData,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          user {
            firstName
          }
          githubAccess {
            user
          }
        }
      `,
    },
  },
);

export default AccountPageWithDataContainer;
