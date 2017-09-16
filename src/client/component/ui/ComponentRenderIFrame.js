/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';

import {ParentChannel} from '../../componentRenderIFrame/IFrameChannel';
import {type Message} from '../../componentRenderIFrame/IFrameChannelMessage';
import {CLIENT_COMPONENT_RENDER_PATH} from '../../../clientserver/serverConfig';

import './ComponentRenderIFrame.css';

type PropType = {
  title: string,
  // eslint-disable-next-line
  onReady?: (ref: ComponentRenderIFrame) => any,
  className?: ?string,
  style?: ?Object,
};

export default class ComponentRenderIFrame extends React.Component<PropType> {
  _channel: ?ParentChannel;

  componentDidMount() {
    const channel = new ParentChannel(this.refs.iframe.contentWindow);
    this._channel = channel;

    const {onReady} = this.props;
    if (onReady) {
      channel.genIFrameSetup().then(() => onReady(this));
    }
  }

  componentWillUnmount() {
    nullthrows(this._channel).destroy();
    this._channel = null;
  }

  sendMessage(message: Message) {
    nullthrows(this._channel).sendMessage(message);
  }

  render(): React$Element<*> {
    return (
      <iframe
        ref="iframe"
        src={CLIENT_COMPONENT_RENDER_PATH}
        className={
          classnames('ComponentRenderIFrame-iframe', this.props.className)
        }
        style={this.props.style}
        title={this.props.title}
      />
    );
  }
}
