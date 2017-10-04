/** @flow */

import PromisePool from 'es6-promise-pool';

import EntComponent from '../entity/EntComponent';
import EntRepository from '../entity/EntRepository';
import type { CompiledComponent } from './genCompileRepo';
import {printError} from '../consoleUtil';

export type SaveCompiledRepoOptions = {
  concurrency: number,
  deleteOldComponents: boolean,
  onComponentSaved?: ?((component: EntComponent, isNew: boolean) => any),
  onComponentToBeDeleted?: ?((component: EntComponent) => any),
};

export default async function genSaveCompiledRepo(
  repo: EntRepository,
  components: Array<CompiledComponent>,
  options: SaveCompiledRepoOptions,
): Promise<void> {
  let oldComponents = {};
  if (options.deleteOldComponents) {
    oldComponents = await repo.genComponents();
  }

  const componentsLeftToSave = components.slice(0);
  const saveComponentPool = new PromisePool(
    (): ?Promise<Object> => {
      if (componentsLeftToSave.length === 0) {
        return null;
      }
      const compiledComponent = componentsLeftToSave.shift();

      return (async () => {
        const existingComponent = await
          EntComponent.genComponentInRepositoryWithFilepath(
            repo,
            compiledComponent.relativeFilepath,
          );

        let newComponent;
        if (existingComponent) {
          await existingComponent.genUpdateComponent(
            JSON.stringify(compiledComponent.doc),
            compiledComponent.compiledBundle,
          );
        } else {
          newComponent = await EntComponent.genCreate(
            repo.getViewerContext(),
            compiledComponent.name,
            repo.getID(),
            compiledComponent.relativeFilepath,
            compiledComponent.compiledBundle,
            JSON.stringify(compiledComponent.doc),
          );
        }

        return {
          entComponent: existingComponent || newComponent,
          isNew: existingComponent == null,
        };
      })();
    },
    options.concurrency,
  );

  const newComponentsByID = {};
  saveComponentPool.addEventListener('fulfilled', event => {
    const {entComponent, isNew} = event.data.result;

    newComponentsByID[entComponent.getID()] = entComponent;

    if (options.onComponentSaved) {
      options.onComponentSaved(entComponent, isNew);
    }
  });
  saveComponentPool.addEventListener('rejected', event => {
    printError(`Error while saving component: ${event.data.error}`);
  });

  await saveComponentPool.start();

  let componentsToDelete = [];
  oldComponents.forEach(oldComponent => {
    if (!newComponentsByID[oldComponent.getID()]) {
      componentsToDelete.push(oldComponent);
    }
  });

  const componentsLeftToDelete = componentsToDelete.slice(0);
  const deleteComponentPool = new PromisePool(
    (): ?Promise<void> => {
      if (componentsLeftToDelete.length === 0) {
        return null;
      }
      const oldComponent = componentsLeftToDelete.shift();

      return (async () => {
        if (options.onComponentToBeDeleted) {
          options.onComponentToBeDeleted(oldComponent);
        }

        await oldComponent.genDelete();
      })();
    },
    options.concurrency,
  );
  await deleteComponentPool.start();
}
