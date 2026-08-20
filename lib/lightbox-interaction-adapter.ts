import {
  reduceLightboxInteraction,
  type LightboxInteractionEvent,
  type LightboxInteractionState,
} from './lightbox-interaction-state';

type LightboxInteractionListener = (state: LightboxInteractionState) => void;
type LightboxInteractionSubscription = { listener: LightboxInteractionListener };

export type LightboxInteractionDiagnostics = {
  state: LightboxInteractionState;
  pendingEventCount: number;
  listenerCount: number;
  notifying: boolean;
  released: boolean;
};

export interface LightboxInteractionAdapter {
  getState: () => LightboxInteractionState;
  getDiagnostics: () => LightboxInteractionDiagnostics;
  release: () => boolean;
  subscribe: (listener: LightboxInteractionListener) => () => boolean;
  open: () => LightboxInteractionState;
  close: () => LightboxInteractionState;
  startAction: () => LightboxInteractionState;
  succeed: () => LightboxInteractionState;
  fail: () => LightboxInteractionState;
}

const CLOSED_STATE: LightboxInteractionState = {
  visible: false,
  actionBusy: false,
  retryAvailable: false,
};

function normalizeInitialState(candidate: unknown): LightboxInteractionState {
  if (!candidate || typeof candidate !== 'object') return { ...CLOSED_STATE };
  const input = candidate as Partial<LightboxInteractionState>;
  return {
    visible: input.visible === true,
    actionBusy: input.actionBusy === true,
    retryAvailable: input.retryAvailable === true,
  };
}

/**
 * Bounds work created by pathological re-entrant listeners. Events already in
 * the queue retain FIFO order; once the per-drain budget is exhausted, pending
 * re-entrant work is discarded and the adapter is immediately ready for a
 * later user-driven dispatch.
 */
export const LIGHTBOX_MAX_PENDING_EVENTS = 64;

export function createLightboxInteractionAdapter(
  initialState: LightboxInteractionState = CLOSED_STATE,
): LightboxInteractionAdapter {
  let state = normalizeInitialState(initialState);
  const listeners = new Set<LightboxInteractionSubscription>();
  const pendingEvents: LightboxInteractionEvent[] = [];
  let pendingEventHead = 0;
  let isNotifying = false;
  let released = false;
  const readState = (): LightboxInteractionState => ({
    visible: state.visible,
    actionBusy: state.actionBusy,
    retryAvailable: state.retryAvailable,
  });
  const getPendingEventCount = () => Math.max(0, pendingEvents.length - pendingEventHead);
  const readDiagnostics = (): LightboxInteractionDiagnostics => ({
    state: readState(),
    pendingEventCount: getPendingEventCount(),
    listenerCount: listeners.size,
    notifying: isNotifying,
    released,
  });

  const dispatch = (event: LightboxInteractionEvent) => {
    if (released) return readState();
    if (getPendingEventCount() >= LIGHTBOX_MAX_PENDING_EVENTS) return readState();
    const lastPendingEvent = pendingEvents[pendingEvents.length - 1];
    if (isNotifying && lastPendingEvent?.type === event.type) return readState();
    pendingEvents.push(event);
    if (isNotifying) return readState();

    isNotifying = true;
    let processedEvents = 0;
    try {
      while (pendingEventHead < pendingEvents.length) {
        if (processedEvents >= LIGHTBOX_MAX_PENDING_EVENTS) {
          break;
        }
        const nextEvent = pendingEvents[pendingEventHead];
        pendingEventHead += 1;
        processedEvents += 1;
        const nextState = reduceLightboxInteraction(state, nextEvent);
        if (nextState === state) continue;
        state = nextState;
        [...listeners].forEach((subscription) => {
          if (released || !listeners.has(subscription)) return;
          try {
            subscription.listener(readState());
          } catch {
            // A UI subscriber must not interrupt the committed transition or other listeners.
          }
        });
      }
    } finally {
      pendingEvents.length = 0;
      pendingEventHead = 0;
      isNotifying = false;
    }
    return readState();
  };

  return {
    getState: readState,
    getDiagnostics: readDiagnostics,
    release: () => {
      if (released) return false;
      released = true;
      listeners.clear();
      pendingEvents.length = 0;
      pendingEventHead = 0;
      return true;
    },
    subscribe: (listener: LightboxInteractionListener) => {
      if (released || typeof listener !== 'function') return () => false;
      const subscription = { listener };
      listeners.add(subscription);
      let active = true;
      return () => {
        if (!active) return false;
        active = false;
        return listeners.delete(subscription);
      };
    },
    open: () => dispatch({ type: 'open' }),
    close: () => dispatch({ type: 'close' }),
    startAction: () => dispatch({ type: 'action-start' }),
    succeed: () => dispatch({ type: 'action-success' }),
    fail: () => dispatch({ type: 'action-failure' }),
  };
}
