/** @flow */

import React from 'react';

import RepositoryComponentsCard, {
  type RepositoryComponentsCardProps,
} from './RepositoryComponentsCard';

export type RepositoryComponentsGridProps = {
  components: Array<RepositoryComponentsCardProps>,
};

export default class RepositoryComponentsGrid extends React.Component<RepositoryComponentsGridProps> {
  render(): ?React$Element<*> {
    return (
      <ul>
        {
          this.props.components.map(c =>
            <RepositoryComponentsCard key={c.componentID} {...c} />
          )
        }
      </ul>
    );
  }
}
