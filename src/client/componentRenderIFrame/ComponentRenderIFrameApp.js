/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import ComponentRenderer from './ComponentRenderer';
import {IFrameChannel} from './IFrameChannel';
import {type Message} from './IFrameChannelMessage';

import './ComponentRenderIFrameApp.css';

type RenderComponentType = {
  compiledBundleURI: string,
  externalCSSURI: ?string,
};

type StateType = {
  renderComponent: ?RenderComponentType,
};

export default class ComponentRenderIFrameApp extends React.Component<*, StateType> {

  static htmlBodyClassName = 'ComponentRenderIFrameApp-htmlBody';

  state = {
    renderComponent: null,
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
        renderComponent: {
          compiledBundleURI: message.compiledBundleURI,
          externalCSSURI: message.externalCSSURI,
        },
      });
    }
  }

  componentWillUnmount() {
    nullthrows(this._channel).removeListener(this._onChannelMessage);
    nullthrows(this._channel).destroy();
    this._channel = null;
  }

  render() {
    const {renderComponent} = this.state;
    if (renderComponent) {
      return this._renderRenderer(renderComponent);
    }
    return <div>hello world</div>;
  }

  _renderRenderer(renderComponent: RenderComponentType) {
    return (
      <ComponentRenderer 
        compiledBundleURI={renderComponent.compiledBundleURI}
        externalCSSURI={renderComponent.externalCSSURI}
      />
    );
  }
}
