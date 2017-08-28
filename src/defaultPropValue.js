/** @flow */

export default function defaultPropValue(prop: Object): mixed {
  if (prop.type) {
    return defaultReactPropValue(prop);
  } else if (prop.flowtype) {
    return defaultFlowTypeValue(prop);
  } else {
    return undefined;
  }
}

function defaultReactPropValue(prop: Object): mixed {
  if (prop.defaultValue) {
    // React will use the default value if we give it nothing.
    return undefined;
  }

  const simpleValue = defaultValueForSimpleType(prop.type.name);
  if (simpleValue != null) {
    return simpleValue;
  }

  return undefined;
}

function defaultFlowTypeValue(prop: Object): mixed {
  const simpleValue = defaultValueForSimpleType(prop.flowtype.name);
  if (simpleValue != null) {
    return simpleValue;
  }

  return undefined;
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
      return undefined;
  }
}
