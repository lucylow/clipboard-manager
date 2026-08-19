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

  const dispatch = (event: LightboxInteractionEvent) => {
    const nextState = reduceLightboxInteraction(state, event);
    if (nextState === state) return state;
    state = nextState;
    listeners.forEach((listener) => listener(state));
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
