import { getImageActionPresentation, type ImageActionPresentation } from './image-action-state';

export type LightboxControlState = {
  closeLabel: string;
  share: ImageActionPresentation;
  ocr: ImageActionPresentation;
  ocrVisible: boolean;
};

export function getLightboxControlState(options: {
  hasOcrText: boolean;
  hasOcrSaveFailure: boolean;
  isSharing: boolean;
  hasShareFailure: boolean;
  isOcrPending: boolean;
  hasImage: boolean;
}): LightboxControlState {
  return {
    closeLabel: 'Close image preview',
    share: getImageActionPresentation('share', {
      busy: options.isSharing,
      failed: options.hasShareFailure,
    }),
    ocr: getImageActionPresentation('ocr', {
      busy: options.isOcrPending,
      failed: options.hasOcrSaveFailure,
    }),
    ocrVisible: options.hasImage && (!options.hasOcrText || options.hasOcrSaveFailure),
  };
}
