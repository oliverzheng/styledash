/** @flow */

import React from 'react';
import window from 'global/window';
import document from 'global/document';
import invariant from 'invariant';

import ElementScrollPositionTracker, {
  type ScrollPosition,
  type ScrollPositions,
} from '../../common/ui/ElementScrollPositionTracker';

type PropType = {
  tracker: ElementScrollPositionTracker,
  render: (highlightedKey: ?string) => React$Node,
};

type StateType = {
  highlightedKey: ?string,
};

type SortedPositions = Array<{
  key: string,
  position: ScrollPosition,
}>;

const VIEWPORT_TOP_SECTION = 0.3;

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

  scrollTo(key: string): void {
    const positions = this.props.tracker.getPositions();
    const currentPosition = positions[key];
    // We could ignore this, but I'd rather find the bug that causes this
    invariant(currentPosition != null, 'Cannot find current position');

    const sortedPositions = this._getSortedPositions(positions);
    // For scrolling, we only want to scroll if the element is not already
    // highlighted.
    if (this._getHighlightedKey(sortedPositions) === key) {
      return;
    }

    // We only want to scroll a minimal amount. If we need to scroll down (the
    // element is below where it needs to be), then set its top to just make the
    // bottom of the viewport cutoff; if we need to scroll up (the element is
    // above), set its top to 0.
    if (currentPosition.top < 0) {
      // Align to top of the page
      currentPosition.element.scrollIntoView(true);
    } else {
      // Find the one before this one
      let previousPosition: ?ScrollPosition = null;
      sortedPositions.forEach((position, i) => {
        if (i === 0) {
          return;
        }
        if (position.key === key) {
          previousPosition = sortedPositions[i - 1].position;
        }
      });

      let scrollDistanceToHidePrevious = 0;
      if (previousPosition) {
        scrollDistanceToHidePrevious =
          previousPosition.top + previousPosition.height;
      }

      const viewportHeightCutoff = window.innerHeight * VIEWPORT_TOP_SECTION;
      const scrollOffset = Math.max(
        currentPosition.top - viewportHeightCutoff,
        scrollDistanceToHidePrevious,
      );
      window.scrollBy(0, scrollOffset);
    }
  }

  _positionsListener = (positions: ScrollPositions) => {
    const highlightedKey =
      this._getHighlightedKey(this._getSortedPositions(positions));
    this.setState({ highlightedKey });
  }

  _getSortedPositions(
    positions: ScrollPositions,
  ): SortedPositions {
    const sortedPositions = [];
    Object.keys(positions).forEach(key =>
      sortedPositions.push({
        key,
        position: positions[key],
      })
    );
    sortedPositions.sort((a, b) => a.position.top - b.position.top);
    return sortedPositions;
  }

  _getHighlightedKey(sortedPositions: SortedPositions): ?string {
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

    if (sortedPositions.length === 0) {
      return null;
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
      // TODO make use of the element's height so when a heading disappears
      // completely, only then change the highlight.
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

    return highlightedKey;
  }

  render(): React$Node {
    return this.props.render(this.state.highlightedKey);
  }
}
