/** @flow */

import React from 'react';

import LayoutGrid from '../../common/ui/LayoutGrid';
import RepositoryListCard from './RepositoryListCard';

import '../../common/ui/Spacing.css';

type PropType = {
  repositories: Array<{
    name: string,
    id: string,
    componentsCount: number,
    lastUpdatedTimestamp: number,
  }>,
};

const CARD_WIDTH = 250;

export default class RepositoryListGrid extends React.Component<PropType> {
  render(): React$Element<*> {
    const {repositories} = this.props;
    return (
      <LayoutGrid
        columnCount={3}
        sizing={{
          itemSize: CARD_WIDTH,
        }}>
        {
          repositories.map(repo =>
            <RepositoryListCard
              className="Spacing-margin-bottom-24"
              {...repo}
              key={repo.id}
            />
          )
        }
      </LayoutGrid>
    );
  }
}
