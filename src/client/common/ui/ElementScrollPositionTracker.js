/** @flow */

import window from 'global/window';
import invariant from 'invariant';
import throttle from 'throttle-debounce/throttle';

// Relative to viewport
export type ScrollPosition = {
  top: number,
  left: number,
};

export type ScrollPositionsListener =
  (positions: {[key: string]: ScrollPosition}) => any;

export default class ElementScrollPositionTracker {
  _elements: {[key: string]: HTMLElement} = {};
  _listeners: Array<ScrollPositionsListener> = [];

  constructor() {
    window.addEventListener(
      'scroll',
      throttle(250, this._onScroll),
    );
    // TODO add resize listener too
  }

  destroy(): void {
    window.removeEventListener('scroll', this._onScroll);
  }

  addElementsToTrack(elements: {[key: string]: HTMLElement}): void {
    Object.keys(elements).forEach(key => {
      this._elements[key] = elements[key];
    });
    this._tellListeners(this._listeners);
  }

  removeElementsFromTracking(elements: {[key: string]: HTMLElement}): void {
    Object.keys(elements).forEach(key => {
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
    invariant(idx !== -1, 'Listener not found');
    this._listeners.splice(idx, 1);
  }

  _onScroll = () => {
    this._tellListeners(this._listeners);
  }

  _tellListeners(listeners: Array<ScrollPositionsListener>): void {
    const positions = {};
    Object.keys(this._elements).forEach(key => {
      const el = this._elements[key];
      const {top, left} = el.getBoundingClientRect();
      positions[key] = {top, left};
    });
    listeners.forEach(listener => listener(positions));
  }
}
