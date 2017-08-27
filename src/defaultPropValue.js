/** @flow */

export default function defaultPropValue(prop: Object): mixed {
  if (prop.type) {
    return defaultReactPropValue(prop.type);
  } else if (prop.flowtype) {
    return defaultFlowTypeValue(prop.flowtype);
  } else {
    return null;
  }
}

function defaultReactPropValue(type: Object): mixed {
  const simpleValue = defaultValueForSimpleType(type.name);
  if (simpleValue != null) {
    return simpleValue;
  }

  return null;
}

function defaultFlowTypeValue(type: Object): mixed {
  const simpleValue = defaultValueForSimpleType(type.name);
  if (simpleValue != null) {
    return simpleValue;
  }

  return null;
}

function defaultValueForSimpleType(typeName: string): mixed {
  switch (typeName) {
    case 'string':
      return 'Hello world';
    case 'number':
      return 3;
    case 'bool':
      return false;
    default:
      return null;
  }
}
