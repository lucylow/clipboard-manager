export type LightboxOperation = 'ocr' | 'share';

/** Prevent OCR extraction and image sharing from running concurrently. */
export function createLightboxOperationGuard() {
  let activeOperation: LightboxOperation | null = null;

  const isValidOperation = (operation: unknown): operation is LightboxOperation =>
    operation === 'ocr' || operation === 'share';

  return {
    acquire(operation: LightboxOperation) {
      if (!isValidOperation(operation) || activeOperation !== null) return false;
      activeOperation = operation;
      return true;
    },
    release(operation: LightboxOperation) {
      if (!isValidOperation(operation) || activeOperation !== operation) return false;
      activeOperation = null;
      return true;
    },
    get active() {
      return activeOperation;
    },
  };
}

export type LightboxOperationGuard = ReturnType<typeof createLightboxOperationGuard>;
