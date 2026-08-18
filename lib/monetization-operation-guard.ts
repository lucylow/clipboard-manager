export type MonetizationOperation = 'reset' | 'restore';

/** Prevent reset and restore actions from running concurrently. */
export function createMonetizationOperationGuard() {
  let activeOperation: MonetizationOperation | null = null;

  return {
    acquire(operation: MonetizationOperation) {
      if (activeOperation !== null) return false;
      activeOperation = operation;
      return true;
    },
    release(operation: MonetizationOperation) {
      if (activeOperation === operation) activeOperation = null;
    },
    get active() {
      return activeOperation;
    },
  };
}
