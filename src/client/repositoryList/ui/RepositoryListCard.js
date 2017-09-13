/** @flow */

import React from 'react';
import pluralize from 'pluralize';
import relativeDate from 'relative-date';

import SectionHeader from '../../common/ui/SectionHeader';
import LinkCard from '../../common/ui/LinkCard';
import {CardSection} from '../../common/ui/Card';
import SubText from '../../common/ui/SubText';

import '../../common/ui/Spacing.css';

import './RepositoryListCard.css';

const {LinkText} = LinkCard;

type PropType = {
  name: string,
  id: string,
  componentsCount: number,
  lastUpdatedTimestamp: number,
};

export default class RepositoryListCard extends React.Component<PropType> {
  render(): React$Element<*> {
    const {
      id,
      name,
      componentsCount,
      lastUpdatedTimestamp,
    } = this.props;
    return (
      <LinkCard href={`/repository/${id}`} className="RepositoryListCard-card">
        <CardSection fillHeight={true}>
          <SectionHeader className="Spacing-margin-bottom-8">
            <LinkText>
              {name}
            </LinkText>
          </SectionHeader>
          <SubText>
            {pluralize('Component', componentsCount, true)}
          </SubText>
        </CardSection>
        <CardSection className="RepositoryListCard-footer">
          <SubText>
            Last updated {relativeDate(lastUpdatedTimestamp * 1000)}
          </SubText>
        </CardSection>
      </LinkCard>
    );
  }
}
