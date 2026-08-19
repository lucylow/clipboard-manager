import { describe, expect, it } from 'vitest';
import { createLightboxInteractionAdapter } from '../lib/lightbox-interaction-adapter';

describe('createLightboxInteractionAdapter', () => {
  it('publishes open, busy, failure, retry, and success transitions in order', () => {
    const adapter = createLightboxInteractionAdapter();
    const states: string[] = [];
    const unsubscribe = adapter.subscribe((state) => states.push(`${state.visible}:${state.actionBusy}:${state.retryAvailable}`));

    adapter.open();
    adapter.startAction();
    adapter.fail();
    adapter.startAction();
    adapter.succeed();
    unsubscribe();

    expect(states).toEqual(['true:false:false', 'true:true:false', 'true:false:true', 'true:true:false', 'true:false:false']);
  });

  it('does not publish a closed action start or a late failure after close', () => {
    const adapter = createLightboxInteractionAdapter();
    const states: string[] = [];
    adapter.subscribe((state) => states.push(`${state.visible}:${state.actionBusy}:${state.retryAvailable}`));

    adapter.startAction();
    adapter.fail();
    adapter.open();
    adapter.close();
    adapter.fail();

    expect(adapter.getState()).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(states).toEqual(['true:false:false', 'false:false:false']);
  });

  it('supports unsubscribe without affecting the adapter state', () => {
    const adapter = createLightboxInteractionAdapter();
    const listener = () => undefined;
    const unsubscribe = adapter.subscribe(listener);

    expect(unsubscribe()).toBe(true);
    expect(adapter.open()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });
});
