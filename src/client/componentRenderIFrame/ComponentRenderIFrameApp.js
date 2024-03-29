/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import ComponentRenderer, {type ComponentRendererProps} from './ComponentRenderer';
import {IFrameChannel} from './IFrameChannel';
import {type Message} from './IFrameChannelMessage';

import './ComponentRenderIFrameApp.css';

type StateType = {
  rendererProps: ?ComponentRendererProps,
};

export default class ComponentRenderIFrameApp extends React.Component<*, StateType> {

  static htmlBodyClassName = 'ComponentRenderIFrameApp-htmlBody';

  state = {
    rendererProps: null,
  };
  _channel: ?IFrameChannel;

  componentDidMount() {
    const channel = this._channel = new IFrameChannel();
    channel.addListener(this._onChannelMessage);

    channel.setupDone();
  }

  _onChannelMessage = (message: Message) => {
    if (message.type === 'renderComponent') {
      this.setState({
        rendererProps: {
          transformedCode: message.transformedCode,
          component: message.component,
          repository: message.repository,
          // Wtf Flow spews shit if this is in render instead of here. :|
          onRender: this._onRender,
        },
      });
    }
  }

  componentWillUnmount() {
    nullthrows(this._channel).removeListener(this._onChannelMessage);
    nullthrows(this._channel).destroy();
    this._channel = null;
  }

  _onRender = (renderer: ComponentRenderer) => {
    const serializedElement = nullthrows(renderer).serializeRender();
    nullthrows(this._channel).sendMessage({
      type: 'componentRendered',
      serializedElement: JSON.stringify(serializedElement),
    });
  }

  render() {
    const {rendererProps} = this.state;
    if (!rendererProps) {
      return null;
    }
    return (
      <ComponentRenderer 
        {...rendererProps}
      />
    );
  }
}
