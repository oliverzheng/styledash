/** @flow */

import React from 'react';
import classnames from 'classnames';

import LinkCard, {LinkText} from '../../common/ui/LinkCard';
import {CardSection, CardFooterSection} from '../../common/ui/Card';
import {
  renderSerializedElementWithStyles,
  type SerializedElement,
} from '../../util/elementWithStylesSerialization';

import './RepositoryComponentsCard.css';

export type RepositoryComponentsCardProps = {
  componentID: string,
  name: string,
  serializedElement: ?string,
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
          noPadding={true}
          fillHeight={true}>
          {this._renderPreview()}
        </CardSection>
        <CardFooterSection>
          <LinkText onHover={{darken: true, underline: false}}>
            {name}
          </LinkText>
        </CardFooterSection>
      </LinkCard>
    );
  }

  _renderPreview(): React$Node {
    const {serializedElement} = this.props;
    if (serializedElement == null) {
      return 'No preview yet'
    }
    const obj = ((JSON.parse(serializedElement): any): SerializedElement);

    return renderSerializedElementWithStyles(obj);
  }
}
