import { describe, expect, it } from 'vitest';
import { createSingleFlight } from '../lib/single-flight';

describe('single-flight loader', () => {
  it('shares the active promise across concurrent callers', async () => {
    const flight = createSingleFlight<number>();
    let resolveOperation!: (value: number) => void;
    const operation = new Promise<number>((resolve) => { resolveOperation = resolve; });

    const first = flight.run(() => operation);
    const second = flight.run(() => Promise.resolve(99));

    expect(first).toBe(second);
    expect(flight.isRunning()).toBe(true);
    resolveOperation(42);
    await expect(first).resolves.toBe(42);
    expect(flight.isRunning()).toBe(false);
  });

  it('allows a new operation after a failure', async () => {
    const flight = createSingleFlight<number>();
    await expect(flight.run(() => Promise.reject(new Error('storage locked')))).rejects.toThrow('storage locked');
    await expect(flight.run(() => Promise.resolve(7))).resolves.toBe(7);
    expect(flight.isRunning()).toBe(false);
  });
});
