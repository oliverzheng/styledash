/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
  genDeferCanSeePrivacyTo,
  genDeferCanMutatePrivacyTo,
} from './BaseEnt';
import EntComponent from './EntComponent';

let examplePrivacy;

export default class EntExample extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'example',
      defaultColumnNames: [
        'id',
        'name',
        'component_id',
        'code',
        'serialized_element',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'component_id',
      ],
      foreignKeys: {
        'component_id': {
          referenceEnt: EntComponent,
          onDelete: 'cascade',
        },
      },
      typeName: 'example',
      privacy: examplePrivacy,
    };
  }

  getName(): string {
    return this._getStringData('name');
  }

  getComponentID(): string {
    return this._getIDData('component_id');
  }

  getCode(): string {
    return this._getStringData('code');
  }

  getSerializedElement(): ?string {
    return this._getNullableStringData('serialized_element');
  }

  async genComponent(): Promise<EntComponent> {
    return await EntComponent.genEnforce(
      this.getViewerContext(),
      this.getComponentID(),
    );
  }

  // Mutations

  static async genCreate(
    vc: ViewerContext,
    componentID: string,
    exampleName: string,
    code: string,
    serializedElement: ?string,
  ): Promise<this> {
    const exampleID = await this._genCreate(
      vc,
      {
        name: exampleName,
        component_id: componentID,
        code,
        serialized_element: serializedElement,
      },
    );
    return await this.genEnforce(vc, exampleID);
  }

  async genSetCode(
    code: string,
    serializedElement: ?string,
  ): Promise<boolean> {
    const res = await this._genMutate(
      {
        code,
        serialized_element: serializedElement,
      },
    );

    // TODO pull this into the mutator once we have object caching
    this._data['code'] = code;
    this._data['serialized_element'] = serializedElement;

    return res;
  }

  // Static helpers

  static async genExamplesForComponent(
    component: EntComponent,
  ): Promise<Array<this>> {
    return await EntExample.genWhere(
      component.getViewerContext(),
      'component_id',
      component.getID(),
    );
  }
}

BaseEnt.registerEnt(EntExample);

examplePrivacy = (({
  async genCanViewerSee(obj: EntExample): Promise<boolean> {
    const component = await EntComponent.genNullable(
      obj.getViewerContext(),
      obj.getComponentID(),
    );
    if (!component) {
      return false;
    }
    return await genDeferCanSeePrivacyTo(component);
  },

  async genCanViewerMutate(obj: EntExample): Promise<boolean> {
    const component = await EntComponent.genNullable(
      obj.getViewerContext(),
      obj.getComponentID(),
    );
    if (!component) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(component);
  },

  async genCanViewerDelete(obj: EntExample): Promise<boolean> {
    const component = await EntComponent.genNullable(
      obj.getViewerContext(),
      obj.getComponentID(),
    );
    if (!component) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(component);
  },

  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const componentID = data['component_id'];
    invariant(typeof componentID === 'string', 'ComponentID must be a string');

    const component = await EntComponent.genNullable(vc, componentID);
    if (!component) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(component);
  },
}): PrivacyType<EntExample>);
