import { describe, expect, it } from 'vitest';
import { getLightboxControlState } from '../lib/lightbox-control-state';

describe('getLightboxControlState', () => {
  it('hides OCR action when text is saved and exposes a stable close label', () => {
    const state = getLightboxControlState({
      hasOcrText: true,
      hasOcrSaveFailure: false,
      isSharing: false,
      hasShareFailure: false,
      isOcrPending: false,
      hasImage: true,
    });

    expect(state.closeLabel).toBe('Close image preview');
    expect(state.ocrVisible).toBe(false);
    expect(state.share.accessibilityLabel).toBe('Share saved image');
  });

  it('keeps OCR retry visible after a metadata-save failure', () => {
    const state = getLightboxControlState({
      hasOcrText: true,
      hasOcrSaveFailure: true,
      isSharing: false,
      hasShareFailure: false,
      isOcrPending: false,
      hasImage: true,
    });

    expect(state.ocrVisible).toBe(true);
    expect(state.ocr.label).toBe('Retry saving text');
    expect(state.ocr.accessibilityLabel).toBe('Retry saving extracted text');
  });

  it('keeps share retry enabled after a failed share', () => {
    const state = getLightboxControlState({
      hasOcrText: false,
      hasOcrSaveFailure: false,
      isSharing: false,
      hasShareFailure: true,
      isOcrPending: false,
      hasImage: true,
    });

    expect(state.share.label).toBe('Retry share');
    expect(state.share.disabled).toBe(false);
  });

  it('disables both actions while their respective operation is busy', () => {
    const state = getLightboxControlState({
      hasOcrText: false,
      hasOcrSaveFailure: false,
      isSharing: true,
      hasShareFailure: false,
      isOcrPending: true,
      hasImage: true,
    });

    expect(state.share).toMatchObject({ label: 'Preparing image…', disabled: true, busy: true });
    expect(state.ocr).toMatchObject({ label: 'Extracting text…', disabled: true, busy: true });
  });

  it('does not show OCR retry when the image payload is unavailable', () => {
    expect(getLightboxControlState({
      hasOcrText: false,
      hasOcrSaveFailure: true,
      isSharing: false,
      hasShareFailure: false,
      isOcrPending: false,
      hasImage: false,
    }).ocrVisible).toBe(false);
  });
});
