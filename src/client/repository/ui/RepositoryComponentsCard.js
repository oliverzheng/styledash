/** @flow */

import React from 'react';
import classnames from 'classnames';

import LinkCard from '../../common/ui/LinkCard';
import {CardSection, CardFooterSection} from '../../common/ui/Card';

import './RepositoryComponentsCard.css';

const {LinkText} = LinkCard;

export type RepositoryComponentsCardProps = {
  componentID: string,
  name: string,
  className?: ?string,
};

export default class RepositoryComponentsCard extends React.Component<RepositoryComponentsCardProps> {
  render(): ?React$Element<*> {
    const {componentID, name, className} = this.props;
    return (
      <LinkCard
        href={`/component/${componentID}`}
        className={classnames('RepositoryComponentsCard-card', className)}>
        <CardSection
          className="RepositoryComponentsCard-preview"
          fillHeight={true}>
          No preview yet
        </CardSection>
        <CardFooterSection>
          <LinkText onHover={{darken: true, underline: false}}>
            {name}
          </LinkText>
        </CardFooterSection>
      </LinkCard>
    );
  }
}
