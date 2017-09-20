/** @flow */

import React from 'react';
import invariant from 'invariant';
import classnames from 'classnames';

import parsePropTypes, { type PropType } from '../../../parsePropTypes';
import TextColor from '../../common/ui/TextColor';
import Tag from '../../common/ui/Tag';

import './ComponentProps.css'

type ComponentPropsPropType = {
  reactDoc: string,
};

export default class ComponentProps extends React.Component<ComponentPropsPropType> {
  render(): React$Node {
    const reactDoc = this._getReactDocObject().props;
    if (reactDoc == null) {
      return this._renderNoProps();
    }

    const propTypes = parsePropTypes(reactDoc);
    invariant(propTypes.kind === 'map', 'Root must be a map');

    const props = Object.keys(propTypes.subTypes).map(
      propName => this._renderProp(
        propName,
        propTypes.subTypes[propName].type,
        propTypes.subTypes[propName].required,
        propTypes.subTypes[propName].defaultValue,
      )
    );

    return (
      <div className="ComponentProps-root">
        {props}
      </div>
    );
  }

  _renderNoProps(): React$Node {
    return (
      <div className="ComponentProps-root">
        No declared props were found.
      </div>
    );
  }

  _renderProp(
    propName: string,
    propType: PropType,
    required: boolean,
    defaultValue: ?string,
  ): React$Node {
    let requiredTag = null;
    if (required) {
      requiredTag = (
        <Tag className="ComponentProps-prop-required">
          required
        </Tag>
      );
    }
    return (
      <div className="ComponentProps-prop" key={propName}>
        <span className="ComponentProps-prop-name">
          <span className="ComponentProps-prop-name-text">
            {propName}
          </span>
          {
            /* this makes sure the prop name is a separate word, easy for copy
             * and pasting */
            ' '
          }
          {requiredTag}
        </span>
        <span className="ComponentProps-prop-typeAndDefault">
          {this._renderDefaultValue(defaultValue)}
          {' '}
          <pre
            className={classnames('ComponentProps-prop-type', TextColor.light)}>
            {this._renderType(propType).join('\n')}
          </pre>
        </span>
      </div>
    );
  }

  _renderType(propType: PropType): Array<string> {
    switch (propType.kind) {
      case 'primitive':
        return [propType.primitiveType];
      case 'unknown':
        return [propType.raw || ''];
      case 'literal':
        return [JSON.stringify(propType.value)];
      case 'oneOfType':
        return [
          propType.subTypes.map(
            subType => this._renderType(subType)
          ).filter(Boolean).join(' | ')
        ];
      case 'array': {
        const lines = this._renderType(propType.subType);
        lines[0] = '[' + lines[0];
        lines[lines.length - 1] = lines[lines.length - 1] + ']';
        return lines;
      }
      case 'map': {
        const {subTypes} = propType;
        let lines = [];
        Object.keys(subTypes).forEach(subTypeName => {
          const subLines = this._renderType(subTypes[subTypeName].type);
          invariant(subLines.length > 0, 'Must >0 for lines of subtype');

          subLines.forEach((line, i) => {
            if (i === 0) {
              lines.push(`  ${subTypeName}: ${subLines[0]}`);
            } else {
              lines.push(`  ${line}`);
            }
          });
        });
        if (lines.length > 0) {
          lines.unshift('{');
          lines.push('}');
        }

        return lines;
      }
      default:
        return [propType.kind];
    }
  }

  _renderDefaultValue(defaultValue: ?string): React$Node {
    if (defaultValue == null) {
      return null;
    }

    return (
      <span className="ComponentProps-prop-defaultValue">
        <Tag className="ComponentProps-prop-defaultValue-tag">
          default
        </Tag>
        {' '}
        <span
          className={
            classnames('ComponentProps-prop-defaultValue-text', TextColor.light)
          }>
          {defaultValue}
        </span>
      </span>
    );
  }

  _getReactDocObject(): Object {
    return JSON.parse(this.props.reactDoc);
  }
}
