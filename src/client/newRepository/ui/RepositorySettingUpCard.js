/** @flow */

import React from 'react';

import PageTitle from '../../pages/ui/PageTitle';
import FixedWidthPageContainer from'../../pages/ui/FixedWidthPageContainer';
import Spacing from '../../common/ui/Spacing';
import Card from '../../common/ui/Card';
import Paragraph from '../../common/ui/Paragraph';
import Icon from '../../common/ui/Icon';

import './RepositorySettingUpCard.css';

type PropType = {
  repoName: string,
};

export default class RepositorySettingUpCard extends React.Component<PropType> {
  render(): React$Node {
    return (
      <FixedWidthPageContainer width="narrow">
        <PageTitle className={Spacing.margin.bottom.n36}>
          Setting Up {this.props.repoName}
        </PageTitle>
        <Card className="RepositorySettingUpCard-card">
          <Paragraph className={Spacing.margin.top.n40}>
            Cloning and compiling the repository for the first time.
          </Paragraph>
          <Paragraph className={Spacing.margin.vert.n32}>
            <Icon glyph="hourglass" />
          </Paragraph>
          <Paragraph className={Spacing.margin.bottom.n40}>
            This should only take a minute or so. The page will reload
            automatically.
          </Paragraph>
        </Card>
      </FixedWidthPageContainer>
    );
  }
}
