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
 * the queue retain FIFO order; only events arriving after the cap is reached
 * are discarded until the current notification drain makes progress.
 */
export const LIGHTBOX_MAX_PENDING_EVENTS = 64;

export function createLightboxInteractionAdapter(initialState: LightboxInteractionState = CLOSED_STATE) {
  let state = { ...initialState };
  const listeners = new Set<LightboxInteractionListener>();
  const pendingEvents: LightboxInteractionEvent[] = [];
  let isNotifying = false;

  const dispatch = (event: LightboxInteractionEvent) => {
    if (pendingEvents.length >= LIGHTBOX_MAX_PENDING_EVENTS) return state;
    pendingEvents.push(event);
    if (isNotifying) return state;

    isNotifying = true;
    let processedEvents = 0;
    try {
      while (pendingEvents.length > 0) {
        if (processedEvents >= LIGHTBOX_MAX_PENDING_EVENTS) {
          pendingEvents.length = 0;
          break;
        }
        const nextEvent = pendingEvents.shift();
        if (!nextEvent) continue;
        processedEvents += 1;
        const nextState = reduceLightboxInteraction(state, nextEvent);
        if (nextState === state) continue;
        state = nextState;
        [...listeners].forEach((listener) => {
          try {
            listener(state);
          } catch {
            // A UI subscriber must not interrupt the committed transition or other listeners.
          }
        });
      }
    } finally {
      isNotifying = false;
    }
    return state;
  };

  return {
    getState: () => state,
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
