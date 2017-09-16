/** @flow */

import window from 'global/window';
import nullthrows from 'nullthrows';
import invariant from 'invariant';

import type { MessageWrapper, Message } from './IFrameChannelMessage';

export type Listener = (msg: Message) => any;

function wrapMessage(message: Message): MessageWrapper {
  return {
    isStyledashMessage: true,
    message,
  };
}

function unwrapMessage(wrappedMessage: mixed): ?Message {
  if (wrappedMessage == null || typeof wrappedMessage !== 'object') {
    return null;
  }

  if (!wrappedMessage.isStyledashMessage) {
    return null;
  }

  return ((wrappedMessage.message: any): Message);
}

class Channel {
  _otherWindow: Object;
  _listeners: Array<Listener> = [];

  constructor(otherWindow: Object /* No flow typing exists for this */) {
    window.addEventListener('message', this._onMessage);

    this._otherWindow = nullthrows(otherWindow);
  }

  destroy() {
    this._listeners = [];

    window.removeEventListener('message', this._onMessage);
  }

  sendMessage(msg: Message) {
    // TODO huge security hole fix before launch
    this._otherWindow.postMessage(wrapMessage(msg), '*');
  }

  _isMessageForChannel(e: MessageEvent): boolean {
    const {data} = e;
    if (unwrapMessage(data) == null) {
      return false;
    }
    // Children can implement more
    return true;
  }

  _onMessage = (e: MessageEvent) => {
    if (!this._isMessageForChannel(e)) {
      return;
    }

    const message = unwrapMessage(e.data);
    if (!message) {
      return;
    }

    // Listeners could remove themselves, so clone the list first.
    // There may be bugs about how one listener could remove another listener
    // but the second listener still gets the message; it can be argued that is
    // ok since removing means removing for all messages after the current
    // message.
    this._listeners.slice(0).forEach(listener => listener(message));
  }

  addListener(listener: Listener) {
    this._listeners.push(listener);
  }

  removeListener(listener: Listener) {
    const idx = this._listeners.indexOf(listener);
    invariant(idx !== -1, 'Listener not found');
    this._listeners.splice(idx, 1);
  }
}

export class IFrameChannel extends Channel {
  constructor() {
    super(window.parent);
  }

  // Tells parent we are done so we can start processing
  setupDone(): void {
    this.sendMessage({
      type: 'iframeSetupDone',
    });
  }

  _isMessageForChannel(e: MessageEvent): boolean {
    // For some reason, the frame doesn't have a parent at the start and gets
    // duplicate messages.
    if (window === window.parent) {
      return false;
    }

    // Not sure why but the iframe gets its own messages too
    if (e.source !== window.parent) {
      return false;
    }

    return super._isMessageForChannel(e);
  }
}

export class ParentChannel extends Channel {
  _isIFrameSetup: boolean = false;

  isIFrameSetup(): boolean {
    return this._isIFrameSetup;
  }

  genIFrameSetup(): Promise<boolean> {
    if (this._isIFrameSetup) {
      return Promise.resolve(true);

    } else {
      return new Promise(resolve => {
        const listener = msg => {
          if (msg.type === 'iframeSetupDone') {
            this._isIFrameSetup = true;
            this.removeListener(listener);
            resolve(true);
          }
        };
        this.addListener(listener);
      });
    }
  }

  sendMessage(msg: Message) {
    invariant(this._isIFrameSetup, 'IFrame is not yet setup');
    super.sendMessage(msg);
  }

  _isMessageForChannel(e: MessageEvent): boolean {
    if (e.source !== this._otherWindow) {
      return false;
    }

    return super._isMessageForChannel(e);
  }
}
