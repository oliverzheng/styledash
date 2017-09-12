/** @flow */

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import './StaticIFrame.css';

type PropType = {
  children?: ?React$Node,
  title: string,
};

export default class ComponentPage extends React.Component<PropType> {
  _iframeInnerHTML: string;

  constructor(props: PropType) {
    super(props);

    this._iframeInnerHTML = this._getInnerHTMLFromProps(props);
  }

  shouldComponentUpdate(nextProps: PropType): boolean {
    return this._getInnerHTMLFromProps(nextProps) !== this._iframeInnerHTML;
  }

  componentDidMount(): void {
    this._updateIframe();
  }

  componentDidUpdate(): void {
    this._updateIframe();
  }

  _updateIframe(): void {
    const iframe = this.refs.iframe;
    const document = iframe.contentDocument;
    document.body.innerHTML = this._iframeInnerHTML;
  }

  _getInnerHTMLFromProps(props: PropType): string {
    return renderToStaticMarkup(
      <div>
        {props.children}
      </div>
    );
  }

  render(): React$Element<*> {
    return (
      <iframe
        ref="iframe"
        className="StaticIFrame-frame"
        title={this.props.title}
      />
    );
  }
}
