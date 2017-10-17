/** @flow */

import React from 'react';
import classnames from 'classnames';

import Button from './Button';
import Card, { CardSection } from './Card';
import Spacing from './Spacing';

import './CardWizard.css';

type PropType = {
  pages: Array<{
    name: string,
    content: React$Node,
    canGoToNextPage: boolean,
  }>,
  onComplete: () => any,
};

type StateType = {
  pageIndex: number,
  furthestCompletedPageIndex: number,
};

export default class CardWizard extends React.Component<PropType, StateType> {
  state = {
    pageIndex: 0,
    furthestCompletedPageIndex: 0,
  };

  render(): React$Node {
    const {pages} = this.props;
    const currentPage = pages[this.state.pageIndex];

    let prevButton = null;
    if (this.state.pageIndex > 0) {
      prevButton = (
        <Button
          className={Spacing.margin.right.n20}
          onClick={this._prev}
          purpose="secondary">
          Previous
        </Button>
      );
    }

    return (
      <Card>
        {this._renderMenu()}
        <CardSection className="CardWizard-section">
          {currentPage.content}
        </CardSection>
        <CardSection align="right" className="CardWizard-section">
          {prevButton}
          <Button
            disabled={!currentPage.canGoToNextPage}
            onClick={this._next}>
            {
              (this.state.pageIndex === pages.length - 1)
                ? 'Complete'
                : 'Next'
            }
          </Button>
        </CardSection>
      </Card>
    );
  }

  _renderMenu(): React$Node {
    const {pages} = this.props;

    const items = pages.map((page, i) => {
      return (
        <div
          key={i}
          className={classnames(
            'CardWizard-menu-item',
            {
              'CardWizard-menu-item-selected': i === this.state.pageIndex,
              'CardWizard-menu-item-disabled':
                i > this.state.furthestCompletedPageIndex,
            },
          )}>
          <span className="CardWizard-menu-item-number">{i + 1}</span>
          {page.name}
        </div>
      );
    });

    return (
      <CardSection
        className="CardWizard-section CardWizard-section-menu"
        padding={false}>
        {items}
      </CardSection>
    );
  }

  _next = () => {
    this.setState({
      pageIndex:
        Math.min(this.props.pages.length - 1, this.state.pageIndex + 1),
      furthestCompletedPageIndex:
        Math.max(this.state.furthestCompletedPageIndex, this.state.pageIndex + 1),
    });
  }

  _prev = () => {
    this.setState({
      pageIndex: Math.max(0, this.state.pageIndex - 1),
    });
  }
}
