import { describe, expect, it } from 'vitest';
import {
  createLightboxInteractionAdapter,
  LIGHTBOX_MAX_PENDING_EVENTS,
} from '../lib/lightbox-interaction-adapter';

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

  it('isolates throwing subscribers while preserving later notifications and state', () => {
    const adapter = createLightboxInteractionAdapter();
    const received: string[] = [];
    adapter.subscribe(() => { throw new Error('subscriber failure'); });
    adapter.subscribe((state) => received.push(`${state.visible}:${state.actionBusy}`));

    expect(() => adapter.open()).not.toThrow();
    expect(() => adapter.startAction()).not.toThrow();

    expect(received).toEqual(['true:false', 'true:true']);
    expect(adapter.getState()).toEqual({ visible: true, actionBusy: true, retryAvailable: false });
  });

  it('queues re-entrant events until every listener sees the current transition', () => {
    const adapter = createLightboxInteractionAdapter();
    const first: string[] = [];
    const second: string[] = [];
    adapter.subscribe((state) => {
      first.push(`${state.visible}:${state.actionBusy}`);
      if (state.visible && !state.actionBusy) adapter.startAction();
    });
    adapter.subscribe((state) => second.push(`${state.visible}:${state.actionBusy}`));

    adapter.open();

    expect(first).toEqual(['true:false', 'true:true']);
    expect(second).toEqual(['true:false', 'true:true']);
    expect(adapter.getState()).toEqual({ visible: true, actionBusy: true, retryAvailable: false });
  });

  it('supports unsubscribe without affecting the adapter state', () => {
    const adapter = createLightboxInteractionAdapter();
    const listener = () => undefined;
    const unsubscribe = adapter.subscribe(listener);

    expect(unsubscribe()).toBe(true);
    expect(adapter.open()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });

  it('keeps resubscribed listeners isolated from stale unsubscribe handles', () => {
    const adapter = createLightboxInteractionAdapter();
    let notifications = 0;
    const listener = () => { notifications += 1; };
    const firstUnsubscribe = adapter.subscribe(listener);
    expect(firstUnsubscribe()).toBe(true);
    const secondUnsubscribe = adapter.subscribe(listener);

    expect(firstUnsubscribe()).toBe(false);
    adapter.open();

    expect(notifications).toBe(1);
    expect(secondUnsubscribe()).toBe(true);
    expect(secondUnsubscribe()).toBe(false);
  });

  it('isolates public and listener state snapshots from internal mutation', () => {
    const adapter = createLightboxInteractionAdapter();
    let listenerState: ReturnType<typeof adapter.getState> | undefined;
    adapter.subscribe((state) => {
      listenerState = state;
      state.visible = false;
    });

    const result = adapter.open();
    result.visible = false;
    const current = adapter.getState();
    current.visible = false;

    expect(listenerState).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(adapter.getState()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });

  it('caps pathological re-entrant event growth and recovers for later dispatches', () => {
    const adapter = createLightboxInteractionAdapter();
    let notifications = 0;
    let unsubscribe = () => false;
    unsubscribe = adapter.subscribe((state) => {
      notifications += 1;
      if (notifications === LIGHTBOX_MAX_PENDING_EVENTS) {
        unsubscribe();
        return;
      }
      adapter[state.visible ? 'close' : 'open']();
    });

    adapter.open();

    expect(notifications).toBe(LIGHTBOX_MAX_PENDING_EVENTS);
    expect(adapter.getState()).toEqual({ visible: false, actionBusy: false, retryAvailable: false });

    expect(adapter.open()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });
});
