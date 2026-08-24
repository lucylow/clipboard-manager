export type LightboxSessionState = {
  activeItemId: string | null;
  sessionToken: number;
  visible: boolean;
};

export function canApplyLightboxFeedback(
  session: LightboxSessionState,
  actionItemId: string,
  actionToken: number,
): boolean {
  return (
    session.visible &&
    session.activeItemId === actionItemId &&
    session.sessionToken === actionToken
  );
}

export function isCurrentLightboxAction(options: {
  activeItemId: string | null;
  actionItemId: string;
  isVisible: boolean;
  actionToken?: number;
  currentToken?: number;
}): boolean {
  const tokenMatches =
    options.actionToken === undefined ||
    options.currentToken === undefined ||
    options.actionToken === options.currentToken;
  return options.isVisible && options.activeItemId === options.actionItemId && tokenMatches;
}

export type LightboxSessionController = {
  getState: () => LightboxSessionState;
  open: (itemId: string) => number;
  invalidate: () => void;
  canApplyFeedback: (actionItemId: string, actionToken: number) => boolean;
};

/**
 * Owns the synchronous portion of a lightbox session lifecycle. Keeping this
 * state outside React effects makes close/cancel behavior deterministic while
 * async share and OCR work is still pending.
 */
export function createLightboxSessionController(
  initialToken = 0,
): LightboxSessionController {
  let state: LightboxSessionState = {
    activeItemId: null,
    sessionToken: initialToken,
    visible: false,
  };

  const advance = () => {
    state = { ...state, sessionToken: state.sessionToken + 1 };
    return state.sessionToken;
  };

  return {
    getState: () => state,
    open: (itemId) => {
      const sessionToken = advance();
      state = { activeItemId: itemId, sessionToken, visible: true };
      return sessionToken;
    },
    invalidate: () => {
      if (!state.visible && state.activeItemId === null) {
        return;
      }
      const sessionToken = advance();
      state = { activeItemId: null, sessionToken, visible: false };
    },
    canApplyFeedback: (actionItemId, actionToken) =>
      canApplyLightboxFeedback(state, actionItemId, actionToken),
  };
}
