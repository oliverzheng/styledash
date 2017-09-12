/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import Link from '../common/ui/Link';

import './PageHeaderWithData.css';

type PropType = {
  viewer: {
    user: {
      fullName: string,
    },
  },
};

class PageHeaderWithData extends React.Component<PropType> {
  render(): React$Element<*> {
    return (
      <div>
        <div className="PageHeader-header">
          <Link href="/" className="PageHeader-homeLink">
            Go home
          </Link>
          <div className="PageHeader-user">
            {this.props.viewer.user.fullName}
            {' '}
            <Link href="/logout">Logout</Link>
          </div>
          <h2>Styledash</h2>
        </div>
      </div>
    );
  }
}

export default Relay.createContainer(
  PageHeaderWithData,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          user {
            fullName
          }
        }
      `,
    },
  },
);

