/** @flow */

export function splitID(id: string): {type: string, objID: ?string} {
  const separatorIndex = id.indexOf(':');
  let type: string;
  let objID: ?string = null
  if (separatorIndex !== -1) {
    type = id.substr(0, separatorIndex);
    objID = id.substr(separatorIndex + 1);
  } else {
    type = id;
  }
  return {
    type,
    objID,
  };
}

export function makeID(type: string, objID: ?string): string {
  if (objID == null) {
    return type;
  }
  return type + ':' + objID;
}
