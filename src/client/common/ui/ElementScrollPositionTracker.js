/** @flow */

import ReactDOM from 'react-dom';
import window from 'global/window';
import invariant from 'invariant';
import throttle from 'throttle-debounce/throttle';
import nullthrows from 'nullthrows';

// Relative to viewport
export type ScrollPosition = {
  top: number,
  left: number,
  height: number,
  width: number,
  element: HTMLElement,
};

export type ScrollPositions = {[key: string]: ScrollPosition};

export type ScrollPositionsListener =
  (positions: ScrollPositions) => any;

export default class ElementScrollPositionTracker {
  _elements: {[key: string]: React$Component<*>} = {};
  _listeners: Array<ScrollPositionsListener> = [];

  constructor() {
    window.addEventListener(
      'scroll',
      throttle(150, this._onScroll),
    );
    // TODO add resize listener too
  }

  destroy(): void {
    this._elements = {};
    this._listeners = [];
    window.removeEventListener('scroll', this._onScroll);
  }

  addElementsToTrack(elements: {[key: string]: React$Component<*>}): void {
    Object.keys(elements).forEach(key => {
      this._elements[key] = elements[key];
    });
    this._tellListeners(this._listeners);
  }

  removeAllElementsFromTracking(): void {
    this._elements = {};
  }

  removeElementsFromTracking(
    elementKeys: Array<string>,
  ): void {
    elementKeys.forEach(key => {
      delete this._elements[key];
    });
    this._tellListeners(this._listeners);
  }

  addListener(listener: ScrollPositionsListener): void {
    this._listeners.push(listener);
    this._tellListeners([listener]);
  }

  removeListener(listener: ScrollPositionsListener): void {
    const idx = this._listeners.indexOf(listener);
    if (idx !== -1) {
      this._listeners.splice(idx, 1);
    }
  }

  getPositions(): ScrollPositions {
    const positions = {};
    Object.keys(this._elements).forEach(key => {
      const el = nullthrows(ReactDOM.findDOMNode(this._elements[key]));
      invariant(el instanceof HTMLElement, 'Must be a DOM node');
      const {top, left} = el.getBoundingClientRect();
      positions[key] = {
        top,
        left,
        width: el.offsetWidth,
        height: el.offsetHeight,
        element: el,
      };
    });
    return positions;
  }

  _onScroll = () => {
    this._tellListeners(this._listeners);
  }

  _tellListeners(listeners: Array<ScrollPositionsListener>): void {
    listeners.forEach(listener => listener(this.getPositions()));
  }
}
