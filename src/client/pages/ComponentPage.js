/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import ComponentPageWithData from '../component/ComponentPageWithData';

type PropType = {
  component: ?Object,
  relay: Object,
};

class ComponentPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component} = this.props;
    if (!component) {
      // TODO 404
      return null;
    }

    return (
      <div>
        <PageHeader />
        <ComponentPageWithData component={component} />
      </div>
    );
  }
}

const ComponentPageContainer = Relay.createContainer(
  ComponentPage,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
          ${ComponentPageWithData.getFragment('component')}
        }
      `,
    },
  },
);

ComponentPageContainer.queries = {
  component: () => Relay.QL`
    query {
      component(componentID: $componentID)
    }
  `,
};

export default ComponentPageContainer;
