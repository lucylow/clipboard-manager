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

export function createLightboxInteractionAdapter(initialState: LightboxInteractionState = CLOSED_STATE) {
  let state = { ...initialState };
  const listeners = new Set<LightboxInteractionListener>();
  const pendingEvents: LightboxInteractionEvent[] = [];
  let isNotifying = false;

  const dispatch = (event: LightboxInteractionEvent) => {
    pendingEvents.push(event);
    if (isNotifying) return state;

    isNotifying = true;
    try {
      while (pendingEvents.length > 0) {
        const nextEvent = pendingEvents.shift();
        if (!nextEvent) continue;
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
