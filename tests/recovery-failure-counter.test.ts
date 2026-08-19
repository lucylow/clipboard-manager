import { describe, expect, it } from 'vitest';
import { createRecoveryFailureCounter } from '../lib/recovery-failure-counter';

describe('recovery failure counter', () => {
  it('reaches the diagnostic threshold without exposing error details', () => {
    const counter = createRecoveryFailureCounter(3);

    expect(counter.recordFailure()).toBe(1);
    expect(counter.hasReachedThreshold()).toBe(false);
    expect(counter.recordFailure()).toBe(2);
    expect(counter.hasReachedThreshold()).toBe(false);
    expect(counter.recordFailure()).toBe(3);
    expect(counter.hasReachedThreshold()).toBe(true);
  });

  it('resets after a successful recovery', () => {
    const counter = createRecoveryFailureCounter(2);
    counter.recordFailure();
    counter.recordFailure();
    expect(counter.hasReachedThreshold()).toBe(true);

    counter.reset();
    expect(counter.hasReachedThreshold()).toBe(false);
    expect(counter.recordFailure()).toBe(1);
  });
});
