/** @flow */

import React from 'react';

import SectionHeader from '../../common/ui/SectionHeader';
import LinkCard from '../../common/ui/LinkCard';

import '../../common/ui/Spacing.css';

const {LinkText} = LinkCard;

type PropType = {
  name: string,
  id: string,
};

export default class RepositoryListCard extends React.Component<PropType> {
  render(): React$Element<*> {
    return (
      <LinkCard href={`/repository/${this.props.id}`}>
        <SectionHeader className="Spacing-margin-bottom-8">
          <LinkText>
            {this.props.name}
          </LinkText>
        </SectionHeader>
        {this.props.id}
      </LinkCard>
    );
  }
}
