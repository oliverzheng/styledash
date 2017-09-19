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

const examplePrivacy: PrivacyType<EntExample> = {
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
};

export default class EntExample extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'example',
      defaultColumnNames: [
        'id',
        'name',
        'component_id',
        'code',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'component_id',
      ],
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
  ): Promise<this> {
    const exampleID = await this._genCreate(
      vc,
      {
        name: exampleName,
        component_id: componentID,
        code,
      },
    );
    return await this.genEnforce(vc, exampleID);
  }

  async genSetCode(code: string): Promise<boolean> {
    const res = await this._genMutate(
      { code },
    );

    // TODO pull this into the mutator once we have object caching
    this._data['code'] = code;

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

  // Mutations

  /* TODO (graphql resolver) */
  name() { return this.getName(); }
  exampleID() { return this.getID(); }
  component() { return this.genComponent(); }
  code() { return this.getCode(); }
}
