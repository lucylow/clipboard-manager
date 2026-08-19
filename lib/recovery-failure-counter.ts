export function createRecoveryFailureCounter(threshold = 3) {
  let failureCount = 0;

  return {
    recordFailure(): number {
      failureCount += 1;
      return failureCount;
    },
    reset(): void {
      failureCount = 0;
    },
    hasReachedThreshold(): boolean {
      return failureCount >= threshold;
    },
  };
}
