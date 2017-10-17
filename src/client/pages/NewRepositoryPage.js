/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import NewRepositoryPageWithData from '../newRepository/NewRepositoryPageWithData';

type PropType = {
  viewer: Object,
};

class NewRepositoryPage extends React.Component<PropType> {
  render(): React$Node {
    return (
      <div>
        <PageHeader />
        <NewRepositoryPageWithData viewer={this.props.viewer} />
      </div>
    );
  }
}

const NewRepositoryPageContainer = Relay.createContainer(
  NewRepositoryPage,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${NewRepositoryPageWithData.getFragment('viewer')}
        }
      `,
    },
  },
);

NewRepositoryPageContainer.queries = {
  viewer: () => Relay.QL`
    query {
      viewer
    }
  `,
};

export default NewRepositoryPageContainer;
