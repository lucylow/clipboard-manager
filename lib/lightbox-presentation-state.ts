import { getLightboxControlState, type LightboxControlState } from './lightbox-control-state';
import { getLightboxVisibilityState, type LightboxVisibilityState } from './lightbox-visibility-state';

export type LightboxPresentationState = {
  visibility: LightboxVisibilityState;
  controls: LightboxControlState;
};

export function getLightboxPresentationState(options: {
  hasImage: boolean;
  hasOcrText: boolean;
  hasOcrSaveFailure: boolean;
  isSharing: boolean;
  hasShareFailure: boolean;
  isOcrPending: boolean;
}): LightboxPresentationState {
  return {
    visibility: getLightboxVisibilityState(options.hasImage),
    controls: getLightboxControlState(options),
  };
}
