/** @flow */

import React from 'react';
import window from 'global/window';
import document from 'global/document';

import ElementScrollPositionTracker, {
  type ScrollPosition,
} from '../../common/ui/ElementScrollPositionTracker';

type PropType = {
  tracker: ElementScrollPositionTracker,
  render: (highlightedKey: ?string) => React$Node,
};

type StateType = {
  highlightedKey: ?string,
};

export default class MenuScrollHighlighter extends React.Component<PropType, StateType> {
  state = {
    highlightedKey: null,
  };

  componentWillMount() {
    this.props.tracker.addListener(this._positionsListener);
  }

  componentWillUnmount() {
    this.props.tracker.removeListener(this._positionsListener);
  }

  _positionsListener = (positions: {[key: string]: ScrollPosition}) => {
    // It is assumed that all elements being tracked are vertically stacked with
    // no gaps. I.e. the top of one elem is the bottom of the previous.

    // What's currently "on the screen" is defined as the element that satisfies
    // any of these, in priority:
    //
    // - If the scroll position is at the absolute bottom, then the bottom-most
    //   element, if it's still on the screen and the scroll position isn't at
    //   the absolute top.
    // - The top-most element whose top is in the first half of the viewport.
    // - The bottom-most element whose top is above the viewport.
    //
    // This means:
    // - Floating headers/footers that obscure content will mess with the
    //   perceived size of the viewport.
    // - If the last element is a short, it'll only be highlighted if scroll
    //   position is at the very bottom.
    // - If the last 2 elements are both short, and even at the bottom most
    //   scroll position the 2nd-last element won't reach 1/2 the viewport, then
    //   it'll be impossible for it to be highlighted.

    const sortedPositions = [];
    Object.keys(positions).forEach(key =>
      sortedPositions.push({
        key,
        position: positions[key],
      })
    );
    sortedPositions.sort((a, b) => a.position.top - b.position.top);
    if (sortedPositions.length === 0) {
      this.setState({ highlightedKey: null });
      return;
    }

    let highlightedKey = null;

    const pageScrollTop = document.body.scrollTop;
    const pageLength = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;

    const isScrolledToBottom = (pageLength - pageScrollTop) <= viewportHeight;
    const lastPosition = sortedPositions[sortedPositions.length - 1];
    if (
      isScrolledToBottom &&
      lastPosition.position.top >= 0 &&
      pageScrollTop > 0
    ) {
      highlightedKey = lastPosition.key;

    } else {
      const VIEWPORT_TOP_SECTION = 0.3;
      const viewportHeightCutoff = viewportHeight * VIEWPORT_TOP_SECTION;
      const keysWithinTopOfViewport = sortedPositions.filter(
        p =>
          p.position.top >= 0 &&
          p.position.top <= viewportHeightCutoff
      ).map(p => p.key);

      if (keysWithinTopOfViewport.length > 0) {
        highlightedKey = keysWithinTopOfViewport[0];

      } else {
        const keysAboveViewport = sortedPositions
          .filter(p => p.position.top <= 0)
          .map(p => p.key);
        highlightedKey = keysAboveViewport[keysAboveViewport.length - 1];
      }
    }

    this.setState({ highlightedKey });
  }

  render(): React$Node {
    return this.props.render(this.state.highlightedKey);
  }
}
