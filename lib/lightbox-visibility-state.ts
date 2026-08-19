export type LightboxVisibilityState = {
  visible: boolean;
  contentReady: boolean;
  closeLabel: string;
};

export function getLightboxVisibilityState(itemPresent: boolean): LightboxVisibilityState {
  return {
    visible: itemPresent,
    contentReady: itemPresent,
    closeLabel: 'Close image preview',
  };
}
