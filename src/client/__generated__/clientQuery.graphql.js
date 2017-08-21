/**
 * @flow
 * @relayHash d44eb0e26487007451fb04f18251e2d8
 */

/* eslint-disable */

'use strict';

/*::
import type {ConcreteBatch} from 'relay-runtime';
export type clientQueryResponse = {|
  +hello: ?string;
|};
*/


/*
query clientQuery {
  hello
}
*/

const batch /*: ConcreteBatch*/ = {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "clientQuery",
    "selections": [
      {
        "kind": "ScalarField",
        "alias": null,
        "args": null,
        "name": "hello",
        "storageKey": null
      }
    ],
    "type": "Query"
  },
  "id": null,
  "kind": "Batch",
  "metadata": {},
  "name": "clientQuery",
  "query": {
    "argumentDefinitions": [],
    "kind": "Root",
    "name": "clientQuery",
    "operation": "query",
    "selections": [
      {
        "kind": "ScalarField",
        "alias": null,
        "args": null,
        "name": "hello",
        "storageKey": null
      }
    ]
  },
  "text": "query clientQuery {\n  hello\n}\n"
};

module.exports = batch;
