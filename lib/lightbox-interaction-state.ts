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
  const visible = options.hasImage === true;
  return {
    visible,
    actionBusy: visible && (options.isSharing === true || options.isOcrPending === true),
    retryAvailable: visible && (options.hasShareFailure === true || options.hasOcrSaveFailure === true),
  };
}

function normalizeInteractionState(candidate: unknown): LightboxInteractionState {
  if (
    candidate &&
    typeof candidate === 'object' &&
    typeof (candidate as LightboxInteractionState).visible === 'boolean' &&
    typeof (candidate as LightboxInteractionState).actionBusy === 'boolean' &&
    typeof (candidate as LightboxInteractionState).retryAvailable === 'boolean'
  ) {
    return candidate as LightboxInteractionState;
  }
  const input = candidate && typeof candidate === 'object' ? (candidate as Partial<LightboxInteractionState>) : {};
  return {
    visible: input.visible === true,
    actionBusy: input.actionBusy === true,
    retryAvailable: input.retryAvailable === true,
  };
}

export function reduceLightboxInteraction(
  state: LightboxInteractionState,
  event: LightboxInteractionEvent,
): LightboxInteractionState {
  const normalizedState = normalizeInteractionState(state);
  switch (event.type) {
    case 'open':
      return { visible: true, actionBusy: false, retryAvailable: false };
    case 'close':
      return normalizedState.visible ? { visible: false, actionBusy: false, retryAvailable: false } : normalizedState;
    case 'action-start':
      return !normalizedState.visible || normalizedState.actionBusy
        ? normalizedState
        : { ...normalizedState, actionBusy: true, retryAvailable: false };
    case 'action-success':
      return !normalizedState.visible || (!normalizedState.actionBusy && !normalizedState.retryAvailable)
        ? normalizedState
        : { ...normalizedState, actionBusy: false, retryAvailable: false };
    case 'action-failure':
      return !normalizedState.visible || (!normalizedState.actionBusy && normalizedState.retryAvailable)
        ? normalizedState
        : { ...normalizedState, actionBusy: false, retryAvailable: true };
    default:
      return normalizedState;
  }
}
