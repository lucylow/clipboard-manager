import {
  reduceLightboxInteraction,
  type LightboxInteractionEvent,
  type LightboxInteractionState,
} from './lightbox-interaction-state';

type LightboxInteractionListener = (state: LightboxInteractionState) => void;

const CLOSED_STATE: LightboxInteractionState = {
  visible: false,
  actionBusy: false,
  retryAvailable: false,
};

/**
 * Bounds work created by pathological re-entrant listeners. Events already in
 * the queue retain FIFO order; once the per-drain budget is exhausted, pending
 * re-entrant work is discarded and the adapter is immediately ready for a
 * later user-driven dispatch.
 */
export const LIGHTBOX_MAX_PENDING_EVENTS = 64;

export function createLightboxInteractionAdapter(initialState: LightboxInteractionState = CLOSED_STATE) {
  let state = { ...initialState };
  const listeners = new Set<LightboxInteractionListener>();
  const pendingEvents: LightboxInteractionEvent[] = [];
  let pendingEventHead = 0;
  let isNotifying = false;
  const readState = () => ({ ...state });

  const dispatch = (event: LightboxInteractionEvent) => {
    if (pendingEvents.length - pendingEventHead >= LIGHTBOX_MAX_PENDING_EVENTS) return readState();
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
        [...listeners].forEach((listener) => {
          try {
            listener(readState());
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
    subscribe: (listener: LightboxInteractionListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open: () => dispatch({ type: 'open' }),
    close: () => dispatch({ type: 'close' }),
    startAction: () => dispatch({ type: 'action-start' }),
    succeed: () => dispatch({ type: 'action-success' }),
    fail: () => dispatch({ type: 'action-failure' }),
  };
}
