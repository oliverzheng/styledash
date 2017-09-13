/** @flow */

import React from 'react';
import pluralize from 'pluralize';
import relativeDate from 'relative-date';
import classnames from 'classnames';

import SectionHeader from '../../common/ui/SectionHeader';
import LinkCard from '../../common/ui/LinkCard';
import {CardSection} from '../../common/ui/Card';
import SubText from '../../common/ui/SubText';
import Spacing from '../../common/ui/Spacing';

import './RepositoryListCard.css';

const {LinkText} = LinkCard;

type PropType = {
  name: string,
  id: string,
  componentsCount: number,
  lastUpdatedTimestamp: number,
  className?: ?string,
};

export default class RepositoryListCard extends React.Component<PropType> {
  render(): React$Element<*> {
    const {
      id,
      name,
      componentsCount,
      lastUpdatedTimestamp,
      className,
    } = this.props;
    return (
      <LinkCard
        href={`/repository/${id}`}
        className={classnames('RepositoryListCard-card', className)}>
        <CardSection fillHeight={true}>
          <SectionHeader className={Spacing.margin.bottom.n8}>
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
