export function isCurrentLightboxAction(options: {
  activeItemId: string | null;
  actionItemId: string;
  isVisible: boolean;
}): boolean {
  return options.isVisible && options.activeItemId === options.actionItemId;
}
