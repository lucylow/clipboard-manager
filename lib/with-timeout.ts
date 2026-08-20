export function withTimeout<T>(operation: PromiseLike<T> | T, timeoutMs: number, message = 'Operation timed out'): Promise<T> {
  const safeTimeout = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : 0;
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, safeTimeout);
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    try {
      Promise.resolve(operation).then(
        (value) => settle(() => resolve(value)),
        (error) => settle(() => reject(error)),
      );
    } catch (error) {
      settle(() => reject(error));
    }
  });
}
