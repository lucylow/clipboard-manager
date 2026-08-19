export type HistoryRecoveryOperation = () => Promise<void>;

export function createHistoryRecoveryCoordinator(operation: HistoryRecoveryOperation) {
  let inFlight: Promise<void> | null = null;

  return {
    run(): Promise<void> {
      if (inFlight) return inFlight;
      inFlight = Promise.resolve()
        .then(operation)
        .finally(() => { inFlight = null; });
      return inFlight;
    },
    isRunning(): boolean {
      return inFlight !== null;
    },
  };
}
