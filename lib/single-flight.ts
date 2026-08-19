export type AsyncOperation<T> = () => Promise<T>;

export function createSingleFlight<T>() {
  let inFlight: Promise<T> | null = null;

  return {
    run(operation: AsyncOperation<T>): Promise<T> {
      if (inFlight) return inFlight;
      try {
        inFlight = Promise.resolve(operation()).finally(() => {
          inFlight = null;
        });
        return inFlight;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    isRunning() {
      return inFlight !== null;
    },
  };
}
