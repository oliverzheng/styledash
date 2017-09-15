/** @flow */

import React from 'react';
import classnames from 'classnames';

import LayoutGrid from '../../common/ui/LayoutGrid';
import Spacing from '../../common/ui/Spacing';
import RepositoryComponentsCard, {
  type RepositoryComponentsCardProps,
} from './RepositoryComponentsCard';

export type RepositoryComponentsGridProps = {
  components: Array<RepositoryComponentsCardProps>,
};

const CARDS_PER_ROW = 3;

export default class RepositoryComponentsGrid extends React.Component<RepositoryComponentsGridProps> {
  render(): ?React$Element<*> {
    const {components} = this.props;
    return (
      <LayoutGrid
        columnCount={CARDS_PER_ROW}
        sizing={{
          gutterSize: 28,
        }}>
        {
          components.map((c, i) => {
            const hasTopMargin = i >= CARDS_PER_ROW;
            return (
              <RepositoryComponentsCard
                className={
                  classnames(
                    {[Spacing.margin.top.n28]: hasTopMargin}
                  )
                }
                key={c.componentID}
                {...c}
              />
            );
          })
        }
      </LayoutGrid>
    );
  }
}
