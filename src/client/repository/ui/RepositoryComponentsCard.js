/** @flow */

import React from 'react';

import Link from '../../common/ui/Link';

export type RepositoryComponentsCardProps = {
  componentID: string,
  name: string,
};

export default class RepositoryComponentsCard extends React.Component<RepositoryComponentsCardProps> {
  render(): ?React$Element<*> {
    const {componentID, name} = this.props;
    return (
      <li>
        <Link href={`/component/${componentID}/`}>
          {name}
        </Link>
      </li>
    );
  }
}
