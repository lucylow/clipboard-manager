export type AsyncOperation<T> = () => Promise<T>;

export function createSingleFlight<T>() {
  let inFlight: Promise<T> | null = null;

  return {
    run(operation: AsyncOperation<T>): Promise<T> {
      if (inFlight) return inFlight;
      inFlight = operation().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
    isRunning() {
      return inFlight !== null;
    },
  };
}
