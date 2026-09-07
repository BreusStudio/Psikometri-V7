import { PsychometricStore } from '../mockData';

export class ClassesRepository {
  private store: PsychometricStore;

  constructor(store: PsychometricStore) {
    this.store = store;
  }

  getClasses(): string[] {
    return this.store.getRegisteredClasses();
  }

  addClass(className: string): boolean {
    return this.store.addRegisteredClass(className);
  }

  deleteClass(className: string): boolean {
    return this.store.deleteRegisteredClass(className);
  }

  async clearAllClasses(): Promise<void> {
    return this.store.clearAllClasses();
  }

  getCohorts(): number[] {
    return this.store.getRegisteredCohorts();
  }

  addCohort(cohort: number): boolean {
    return this.store.addRegisteredCohort(cohort);
  }

  deleteCohort(cohort: number): boolean {
    return this.store.deleteRegisteredCohort(cohort);
  }

  async clearAllCohorts(): Promise<void> {
    return this.store.clearAllCohorts();
  }
}
