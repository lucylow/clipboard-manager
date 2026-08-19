export type LightboxSessionState = {
  activeItemId: string | null;
  sessionToken: number;
  visible: boolean;
};

export function canApplyLightboxFeedback(session: LightboxSessionState, actionItemId: string, actionToken: number): boolean {
  return session.visible && session.activeItemId === actionItemId && session.sessionToken === actionToken;
}

export function isCurrentLightboxAction(options: {
  activeItemId: string | null;
  actionItemId: string;
  isVisible: boolean;
  actionToken?: number;
  currentToken?: number;
}): boolean {
  const tokenMatches = options.actionToken === undefined || options.currentToken === undefined || options.actionToken === options.currentToken;
  return options.isVisible && options.activeItemId === options.actionItemId && tokenMatches;
}
