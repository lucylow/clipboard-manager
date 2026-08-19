export type LightboxOperation = 'ocr' | 'share';

/** Prevent OCR extraction and image sharing from running concurrently. */
export function createLightboxOperationGuard() {
  let activeOperation: LightboxOperation | null = null;

  return {
    acquire(operation: LightboxOperation) {
      if (activeOperation !== null) return false;
      activeOperation = operation;
      return true;
    },
    release(operation: LightboxOperation) {
      if (activeOperation === operation) activeOperation = null;
    },
    get active() {
      return activeOperation;
    },
  };
}

export type LightboxOperationGuard = ReturnType<typeof createLightboxOperationGuard>;

