import { PsychometricStore } from '../mockData';

export interface IRepository<T, ID = string> {
  getAll(): T[];
  getById(id: ID): T | undefined;
  add(item: Partial<T>): boolean | string | Promise<boolean | string>;
  update(id: ID, item: Partial<T>): boolean | string | Promise<boolean | string>;
  delete(id: ID): boolean | void | Promise<boolean | void>;
}

export abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  protected store: PsychometricStore;

  constructor(store: PsychometricStore) {
    this.store = store;
  }

  abstract getAll(): T[];
  abstract getById(id: ID): T | undefined;
  abstract add(item: Partial<T>): boolean | string | Promise<boolean | string>;
  abstract update(id: ID, item: Partial<T>): boolean | string | Promise<boolean | string>;
  abstract delete(id: ID): boolean | void | Promise<boolean | void>;
}
