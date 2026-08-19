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

  it('coalesces consecutive duplicate re-entrant events but preserves distinct FIFO events', () => {
    const adapter = createLightboxInteractionAdapter();
    const seen: string[] = [];
    let queued = false;
    adapter.subscribe((state) => {
      seen.push(`${state.visible}:${state.actionBusy}:${state.retryAvailable}`);
      if (!queued && state.visible && !state.actionBusy) {
        queued = true;
        adapter.startAction();
        adapter.startAction();
        adapter.fail();
      }
    });

    adapter.open();

    expect(seen).toEqual([
      'true:false:false',
      'true:true:false',
      'true:false:true',
    ]);
    expect(adapter.getDiagnostics()).toMatchObject({ pendingEventCount: 0, notifying: false });
  });

  it('coalesces only pending duplicates after the queue head advances', () => {
    const adapter = createLightboxInteractionAdapter();
    const seen: string[] = [];
    let queued = false;
    adapter.subscribe((state) => {
      seen.push(`${state.visible}:${state.actionBusy}:${state.retryAvailable}`);
      if (!queued && state.visible && !state.actionBusy) {
        queued = true;
        adapter.startAction();
        adapter.fail();
        adapter.fail();
      }
    });

    adapter.open();

    expect(seen).toEqual([
      'true:false:false',
      'true:true:false',
      'true:false:true',
    ]);
    expect(adapter.getDiagnostics()).toMatchObject({ pendingEventCount: 0, notifying: false });
  });

  it('keeps diagnostics settled across frequent no-op and transition dispatches', () => {
    const adapter = createLightboxInteractionAdapter();
    let notifications = 0;
    adapter.subscribe(() => { notifications += 1; });

    for (let index = 0; index < 250; index += 1) {
      adapter.succeed();
      adapter.open();
      adapter.close();
    }

    expect(notifications).toBe(500);
    expect(adapter.getDiagnostics()).toMatchObject({
      pendingEventCount: 0,
      listenerCount: 1,
      notifying: false,
      released: false,
    });
  });

  it('isolates the adapter from mutations to caller-provided initial state', () => {
    const initialState = { visible: false, actionBusy: true, retryAvailable: true };
    const adapter = createLightboxInteractionAdapter(initialState);

    initialState.visible = true;
    initialState.actionBusy = false;
    initialState.retryAvailable = false;

    expect(adapter.getState()).toEqual({ visible: false, actionBusy: true, retryAvailable: true });
    expect(adapter.getDiagnostics().state).toEqual({ visible: false, actionBusy: true, retryAvailable: true });
  });

  it('delivers the current state to all listeners before re-entrant work', () => {
    const adapter = createLightboxInteractionAdapter();
    const seen: string[] = [];
    adapter.subscribe((state) => {
      seen.push(`first:${state.visible}:${state.actionBusy}`);
      if (state.visible && !state.actionBusy) adapter.startAction();
    });
    adapter.subscribe((state) => {
      seen.push(`second:${state.visible}:${state.actionBusy}`);
    });

    adapter.open();

    expect(seen).toEqual([
      'first:true:false',
      'second:true:false',
      'first:true:true',
      'second:true:true',
    ]);
  });

  it('defers resubscribed listeners until the next committed transition', () => {
    const adapter = createLightboxInteractionAdapter();
    const received: string[] = [];
    let unsubscribeFirst = () => false;
    let resubscribed = false;
    const first = () => {
      received.push('first');
      unsubscribeFirst();
      if (!resubscribed) {
        resubscribed = true;
        adapter.subscribe(() => received.push('replacement'));
      }
    };
    unsubscribeFirst = adapter.subscribe(first);
    adapter.subscribe(() => received.push('second'));

    adapter.open();
    expect(received).toEqual(['first', 'second']);
    adapter.close();

    expect(received).toEqual(['first', 'second', 'second', 'replacement']);
  });

  it('cleans replaced subscriptions when release occurs in the same notification', () => {
    const adapter = createLightboxInteractionAdapter();
    let unsubscribeReplacement = () => false;
    let replaced = false;
    adapter.subscribe(() => {
      if (!replaced) {
        replaced = true;
        adapter.subscribe(() => undefined);
      }
    });
    adapter.subscribe(() => {
      if (replaced) adapter.release();
    });

    adapter.open();

    expect(adapter.getDiagnostics()).toMatchObject({
      listenerCount: 0,
      pendingEventCount: 0,
      notifying: false,
      released: true,
    });
    expect(unsubscribeReplacement()).toBe(false);
  });

  it('keeps diagnostic listener counts aligned with independent cleanup handles', () => {
    const adapter = createLightboxInteractionAdapter();
    const listener = () => undefined;
    const first = adapter.subscribe(listener);
    const second = adapter.subscribe(listener);

    expect(adapter.getDiagnostics().listenerCount).toBe(2);
    expect(first()).toBe(true);
    expect(adapter.getDiagnostics().listenerCount).toBe(1);
    expect(second()).toBe(true);
    expect(adapter.getDiagnostics().listenerCount).toBe(0);
    expect(adapter.release()).toBe(true);
    expect(adapter.getDiagnostics().listenerCount).toBe(0);
  });

  it('reports queued and notifying diagnostics during a re-entrant drain', () => {
    const adapter = createLightboxInteractionAdapter();
    const inFlight: Array<{ pendingEventCount: number; notifying: boolean }> = [];
    adapter.subscribe((state) => {
      if (state.visible && !state.actionBusy) {
        adapter.startAction();
        const diagnostics = adapter.getDiagnostics();
        inFlight.push({ pendingEventCount: diagnostics.pendingEventCount, notifying: diagnostics.notifying });
      }
    });

    adapter.open();

    expect(inFlight).toEqual([{ pendingEventCount: 1, notifying: true }]);
    expect(adapter.getDiagnostics()).toMatchObject({ pendingEventCount: 0, notifying: false, released: false });
  });

  it('reports a read-only diagnostic snapshot across lifecycle states', () => {
    const adapter = createLightboxInteractionAdapter();
    const initial = adapter.getDiagnostics();
    expect(initial).toEqual({
      state: { visible: false, actionBusy: false, retryAvailable: false },
      pendingEventCount: 0,
      listenerCount: 0,
      notifying: false,
      released: false,
    });

    const unsubscribe = adapter.subscribe(() => undefined);
    adapter.open();
    const active = adapter.getDiagnostics();
    active.state.visible = false;
    expect(adapter.getDiagnostics()).toEqual({
      state: { visible: true, actionBusy: false, retryAvailable: false },
      pendingEventCount: 0,
      listenerCount: 1,
      notifying: false,
      released: false,
    });

    unsubscribe();
    expect(adapter.release()).toBe(true);
    expect(adapter.getDiagnostics()).toEqual({
      state: { visible: true, actionBusy: false, retryAvailable: false },
      pendingEventCount: 0,
      listenerCount: 0,
      notifying: false,
      released: true,
    });
  });

  it('blocks every public action after release with a stable snapshot', () => {
    const adapter = createLightboxInteractionAdapter();
    adapter.open();
    adapter.release();
    const released = adapter.getState();

    const results = [adapter.open(), adapter.close(), adapter.startAction(), adapter.succeed(), adapter.fail()];

    expect(results).toEqual([released, released, released, released, released]);
    expect(adapter.getState()).toEqual(released);
    expect(adapter.getDiagnostics().released).toBe(true);
  });

  it('keeps released diagnostics stable across repeated cleanup calls', () => {
    const adapter = createLightboxInteractionAdapter();
    adapter.subscribe(() => undefined);
    adapter.open();

    expect(adapter.release()).toBe(true);
    const released = adapter.getDiagnostics();
    expect(adapter.release()).toBe(false);
    expect(adapter.getDiagnostics()).toEqual(released);
    expect(adapter.getDiagnostics()).toEqual({
      state: { visible: true, actionBusy: false, retryAvailable: false },
      pendingEventCount: 0,
      listenerCount: 0,
      notifying: false,
      released: true,
    });
  });

  it('releases listeners and blocks future dispatches idempotently', () => {
    const adapter = createLightboxInteractionAdapter();
    let notifications = 0;
    const unsubscribe = adapter.subscribe(() => { notifications += 1; });

    expect(adapter.release()).toBe(true);
    expect(adapter.release()).toBe(false);
    expect(unsubscribe()).toBe(false);
    expect(adapter.open()).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(notifications).toBe(0);
    expect(adapter.subscribe(() => { notifications += 1; })()).toBe(false);
  });

  it('stops delivering the current notification cycle after release', () => {
    const adapter = createLightboxInteractionAdapter();
    const notifications: string[] = [];
    adapter.subscribe(() => {
      notifications.push('first');
      adapter.release();
    });
    adapter.subscribe(() => notifications.push('second'));

    adapter.open();

    expect(notifications).toEqual(['first']);
    expect(adapter.getState()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });

  it('clears re-entrant queued work when released during a drain', () => {
    const adapter = createLightboxInteractionAdapter();
    const notifications: string[] = [];
    adapter.subscribe((state) => {
      notifications.push(`${state.visible}:${state.actionBusy}`);
      if (state.visible && !state.actionBusy) {
        adapter.startAction();
        adapter.release();
      }
    });

    adapter.open();

    expect(notifications).toEqual(['true:false']);
    expect(adapter.getState()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
    expect(adapter.startAction()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
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

  it('reports the exact pending-event cap and recovers after capped work drains', () => {
    const adapter = createLightboxInteractionAdapter();
    let queued = false;
    let atCap = 0;
    adapter.subscribe((state) => {
      if (!queued && state.visible) {
        queued = true;
        for (let index = 0; index < LIGHTBOX_MAX_PENDING_EVENTS; index += 1) {
          adapter[index % 2 === 0 ? 'close' : 'open']();
        }
        atCap = adapter.getDiagnostics().pendingEventCount;
      }
    });

    adapter.open();

    expect(atCap).toBe(LIGHTBOX_MAX_PENDING_EVENTS);
    expect(adapter.getDiagnostics()).toMatchObject({ pendingEventCount: 0, notifying: false });
    expect(adapter.open()).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
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
