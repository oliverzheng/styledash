/** @flow */

import invariant from 'invariant';

export type PrimitiveType =
  'number' |
  'string' |
  'boolean';

export type PropType =
  {
    kind: 'primitive',
    primitiveType: PrimitiveType,
  } | {
    kind: 'array',
    subType: PropType,
  } | {
    kind: 'map',
    subTypes: {
      [key: string]: {
        required: boolean,
        type: PropType,
        defaultValue: ?string,
        nullable: boolean,
      },
    },
  } | {
    kind: 'function',
  } | {
    kind: 'node',
  } | {
    kind: 'element',
  } | {
    kind: 'oneOfType',
    subTypes: Array<PropType>,
  } | {
    kind: 'literal',
    value: mixed,
  } | {
    kind: 'custom',
    raw: string,
  } | {
    // the parse code isn't comprehensive enough to know this yet
    kind: 'unknown',
    raw: ?string,
  };

function parseValue(value: string): PropType {
  try {
    const parsed = JSON.parse(value);
    return {
      kind: 'literal',
      value: parsed,
    };
  } catch (e) {
    return {
      kind: 'unknown',
      raw: value,
    };
  }
}

function parseFlowType(flowType: Object): PropType {
  let type;

  if (flowType.name === 'literal') {
    type = {
      kind: 'literal',
      value: flowType.value,
    };
  } else if (
    flowType.name === 'number' ||
    flowType.name === 'string' ||
    flowType.name === 'boolean'
  ) {
    type = {
      kind: 'primitive',
      primitiveType: flowType.name,
    };
  } else if (
    flowType.name === 'Array'
  ) {
    type = {
      kind: 'array',
      subType: parseFlowType(flowType.elements[0]),
    };
  } else if (
    flowType.name === 'signature' && flowType.type === 'function'
  ) {
    type = {
      kind: 'function',
    };
  } else if (
    flowType.name === 'signature' && flowType.type === 'object'
  ) {
    const subTypes = {};
    flowType.signature.properties.forEach(p => {
      subTypes[p.key] = {
        required: p.value.required,
        type: parseFlowType(p.value),
        defaultValue: null,
        nullable: false,
      };
    });
    type = {
      kind: 'map',
      subTypes,
    };
  } else {
    type = {
      kind: 'unknown',
      raw: flowType.name,
    };
  }

  return type;
}

export default function parsePropTypes(reactDocProps: Object): PropType {
  const props = {};

  Object.keys(reactDocProps).forEach(propName => {
    const reactDocProp = reactDocProps[propName];
    const reactType = reactDocProp.type;
    const flowType = reactDocProp.flowType;
    invariant(reactType || flowType, 'Must have at least 1 typing');

    let type: ?PropType = null;
    let nullable;

    if (reactType) {
      nullable = true;

      switch (reactType.name) {
        case 'bool':
          type = {
            kind: 'primitive',
            primitiveType: 'boolean',
          };
          break;
        case 'string':
          type = {
            kind: 'primitive',
            primitiveType: 'string',
          };
          break;
        case 'func':
          type = {
            kind: 'function',
          };
          break;
        case 'enum':
          type = {
            kind: 'oneOfType',
            subTypes: reactType.value.map(v => parseValue(v.value)),
          };
          break;
        case 'custom':
          type = {
            kind: 'custom',
            raw: reactType.raw,
          };
          break;
        default:
          break;
      }

    } else if (flowType) {
      nullable = false;

      if (flowType.nullable != null) {
        nullable = flowType.nullable;
      }

      type = parseFlowType(flowType);
    }

    if (!type) {
      type = {
        kind: 'unknown',
        raw: null,
      };
    }

    let defaultValue = null;
    if (reactDocProp.defaultValue != null) {
      defaultValue = reactDocProp.defaultValue.value;
    }

    const required = reactDocProp.required;

    props[propName] = {
      type,
      required,
      defaultValue,
      nullable,
    };
  });

  return {
    kind: 'map',
    subTypes: props,
  };
}
