/** @flow */

import React from 'react';

import LayoutGrid from '../../common/ui/LayoutGrid';
import RepositoryListCard from './RepositoryListCard';
import Spacing from '../../common/ui/Spacing';

type PropType = {
  repositories: Array<{
    name: string,
    id: string,
    componentsCount: number,
    lastUpdatedTimestamp: number,
  }>,
  className?: ?string,
};

const CARD_WIDTH = 250;

export default class RepositoryListGrid extends React.Component<PropType> {
  render(): React$Element<*> {
    const {repositories, className} = this.props;
    return (
      <LayoutGrid
        className={className}
        columnCount={3}
        sizing={{
          itemSize: CARD_WIDTH,
        }}>
        {
          repositories.map(repo =>
            <RepositoryListCard
              className={Spacing.margin.bottom.n24}
              {...repo}
              key={repo.id}
            />
          )
        }
      </LayoutGrid>
    );
  }
}
