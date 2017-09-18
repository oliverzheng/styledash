/** @flow */

import React from 'react';

import './ComponentProps.css'

type PropType = {
  reactDoc: string,
};

export default class ComponentProps extends React.Component<PropType> {
  render(): ?React$Element<*> {
    return (
      <div className="ComponentProps-root">
        <pre>
          {JSON.stringify(this._getReactDocJSON().props, null, '  ')}
        </pre>
      </div>
    );
  }

  _getReactDocJSON(): Object /* TODO */{
    return JSON.parse(this.props.reactDoc);
  }
}
