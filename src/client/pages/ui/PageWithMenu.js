/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';

import SectionHeader from '../../common/ui/SectionHeader';
import FixedWidthPageContainer, {
  type FixedWidthPageContainerProps,
} from './FixedWidthPageContainer';
import PageTitle from './PageTitle';
import Spacing from '../../common/ui/Spacing';
import ElementScrollPositionTracker from '../../common/ui/ElementScrollPositionTracker';
import MenuScrollHighlighter from './MenuScrollHighlighter';
import PageMenu, { PageMenuItem } from './PageMenu';

import './PageWithMenu.css';

export type Section = {
  menuTitle: string,
  sectionTitle: React$Node,
  children: ?React$Element<*>,
  subSections?: ?Array<Section>,
};

type PropType = FixedWidthPageContainerProps & {
  pageTitle: string,
  pageTitleAux?: ?React$Node,
  sections: Array<Section>,
};

export default class PageWithMenu extends React.Component<PropType> {
  _scrollTracker: ?ElementScrollPositionTracker;
  _headers: {[key: string]: React$Component<*>} = {};
  _menuHighlighter: ?MenuScrollHighlighter;

  componentWillMount() {
    this._scrollTracker = new ElementScrollPositionTracker();
  }

  componentDidMount() {
    this._registerRefsToTracker();
  }

  componentDidUpdate() {
    this._registerRefsToTracker();
  }

  _registerRefsToTracker() {
    nullthrows(this._scrollTracker).removeAllElementsFromTracking();
    nullthrows(this._scrollTracker).addElementsToTrack(this._headers);
  }

  componentWillReceiveNewProps(nextProps: PropType) {
    // This happens if our component is re-used for another page. We want to
    // start over. componentDidUpdate() will add those in.
    nullthrows(this._scrollTracker).removeElementsFromTracking(
      Object.keys(this.refs),
    );
  }

  componentWillUnmount() {
    nullthrows(this._scrollTracker).destroy();
    this._scrollTracker = null;
  }

  _renderMenuItem(
    key: string,
    section: Section,
    highlightedHeaderRefKey: ?string,
  ): React$Node {
    const {menuTitle, subSections} = section;
    let children = null;
    if (subSections && subSections.length > 0) {
      children = (
        <PageMenu>
          {
            subSections.map((subSection, i) =>
              this._renderMenuItem(
                key + '-' + i.toString(),
                subSection,
                highlightedHeaderRefKey,
              )
            )
          }
        </PageMenu>
      );
    }
    return (
      <PageMenuItem
        key={key}
        text={menuTitle}
        onClick={() => this._scrollTo(key)}
        highlighted={key === highlightedHeaderRefKey}>
        {children}
      </PageMenuItem>
    );
  }

  _scrollTo(key: string) {
    nullthrows(this._menuHighlighter).scrollTo(key);
  }

  _setHeaderRef = (key: string, ref: ?React$Component<*>) => {
    if (ref) {
      this._headers[key] = ref;
    } else {
      delete this._headers[key];
    }
  }

  _renderSectionContent(
    key: string,
    section: Section,
    marginBefore: boolean,
  ): Array<React$Node> {
    let content = [
      <SectionHeader
        key={key + '-header'}
        ref={ref => this._setHeaderRef(key, ref)}
        className={classnames(
          Spacing.margin.bottom.n28,
          {
            [Spacing.margin.top.n40]: marginBefore,
          },
        )}>
        {section.sectionTitle}
      </SectionHeader>,
      section.children && React.cloneElement(section.children, { key }),
    ];
    if (section.subSections) {
      const childrenContent = section.subSections.map(
        (subSection, i) => this._renderSectionContent(
          // Has to be the same as the menu item key
          key + '-' + i.toString(),
          subSection,
          true,
        )
      );
      content.push(...childrenContent);
    }
    return content;
  }

  _setMenuHighlighter = (highlighter: ?MenuScrollHighlighter) => {
    this._menuHighlighter = highlighter;
  }

  render(): React$Element<*> {
    const {pageTitle, pageTitleAux, sections, wide, ...restProps} = this.props;

    const menu = (
      <MenuScrollHighlighter
        ref={this._setMenuHighlighter}
        tracker={nullthrows(this._scrollTracker)}
        render={highlightedKey =>
          <PageMenu className="PageWithMenu-menu">
            {
              sections.map(
                (section, i) =>
                  this._renderMenuItem(i.toString(), section, highlightedKey)
              )
            }
          </PageMenu>
        }
      />
    );

    const content = sections.map(
      (section, i) => this._renderSectionContent(i.toString(), section, i !== 0)
    );

    let aux = null;
    if (pageTitleAux) {
      aux = (
        <span className="PageWithMenu-pageTitleAux">
          {pageTitleAux}
        </span>
      );
    }

    return (
      <FixedWidthPageContainer
        className={
          classnames(
            'PageWithMenu-root',
            {
              'PageWithMenu-wide': wide,
              'PageWithMenu-narrow': !wide,
            },
          )
        }
        wide={wide}
        {...restProps}>
        <PageTitle className={Spacing.margin.bottom.n20}>
          {aux}
          {pageTitle}
        </PageTitle>
        {menu}
        <div className="PageWithMenu-content">
          {content}
        </div>
      </FixedWidthPageContainer>
    );
  }
}
