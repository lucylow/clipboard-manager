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

type InteractionStateOptions = {
  hasImage: boolean;
  isSharing: boolean;
  isOcrPending: boolean;
  hasShareFailure: boolean;
  hasOcrSaveFailure: boolean;
};

function readStrictBoolean(options: InteractionStateOptions, key: keyof InteractionStateOptions): boolean {
  try {
    return options[key] === true;
  } catch {
    return false;
  }
}

export function getLightboxInteractionState(options: InteractionStateOptions): LightboxInteractionState {
  const visible = readStrictBoolean(options, 'hasImage');
  return {
    visible,
    actionBusy: visible && (readStrictBoolean(options, 'isSharing') || readStrictBoolean(options, 'isOcrPending')),
    retryAvailable: visible && (readStrictBoolean(options, 'hasShareFailure') || readStrictBoolean(options, 'hasOcrSaveFailure')),
  };
}

function normalizeInteractionState(candidate: unknown): LightboxInteractionState {
  if (!candidate || typeof candidate !== 'object') {
    return { visible: false, actionBusy: false, retryAvailable: false };
  }
  try {
    const input = candidate as Partial<LightboxInteractionState>;
    if (
      typeof input.visible === 'boolean' &&
      typeof input.actionBusy === 'boolean' &&
      typeof input.retryAvailable === 'boolean'
    ) {
      return candidate as LightboxInteractionState;
    }
    return {
      visible: input.visible === true,
      actionBusy: input.actionBusy === true,
      retryAvailable: input.retryAvailable === true,
    };
  } catch {
    return { visible: false, actionBusy: false, retryAvailable: false };
  }
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
