export type LightboxInteractionState = {
  visible: boolean;
  actionBusy: boolean;
  retryAvailable: boolean;
};

export type LightboxInteractionEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'action-start' }
  | { type: 'action-success' }
  | { type: 'action-failure' };

export function getLightboxInteractionState(options: {
  hasImage: boolean;
  isSharing: boolean;
  isOcrPending: boolean;
  hasShareFailure: boolean;
  hasOcrSaveFailure: boolean;
}): LightboxInteractionState {
  const visible = options.hasImage;
  return {
    visible,
    actionBusy: visible && (options.isSharing || options.isOcrPending),
    retryAvailable: visible && (options.hasShareFailure || options.hasOcrSaveFailure),
  };
}

export function reduceLightboxInteraction(
  state: LightboxInteractionState,
  event: LightboxInteractionEvent,
): LightboxInteractionState {
  switch (event.type) {
    case 'open':
      return { visible: true, actionBusy: false, retryAvailable: false };
    case 'close':
      return { visible: false, actionBusy: false, retryAvailable: false };
    case 'action-start':
      return state.visible ? { ...state, actionBusy: true, retryAvailable: false } : state;
    case 'action-success':
      return { ...state, actionBusy: false, retryAvailable: false };
    case 'action-failure':
      return state.visible ? { ...state, actionBusy: false, retryAvailable: true } : state;
  }
}
