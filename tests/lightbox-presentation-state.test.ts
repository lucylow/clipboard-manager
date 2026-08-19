import { describe, expect, it } from 'vitest';
import { getLightboxPresentationState } from '../lib/lightbox-presentation-state';

const base = {
  hasOcrText: false,
  hasOcrSaveFailure: false,
  isSharing: false,
  hasShareFailure: false,
  isOcrPending: false,
};

describe('getLightboxPresentationState', () => {
  it('keeps interaction state aligned with a visible idle lightbox', () => {
    const state = getLightboxPresentationState({ ...base, hasImage: true });
    expect(state.interaction).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
    expect(state.visibility.visible).toBe(true);
  });

  it('exposes one busy state and retry state from the same presentation inputs', () => {
    const busy = getLightboxPresentationState({ ...base, hasImage: true, isOcrPending: true });
    expect(busy.interaction).toEqual({ visible: true, actionBusy: true, retryAvailable: false });

    const retry = getLightboxPresentationState({ ...base, hasImage: true, hasShareFailure: true });
    expect(retry.interaction).toEqual({ visible: true, actionBusy: false, retryAvailable: true });
  });

  it('keeps OCR and sharing retries coherent when both operations have failed', () => {
    const state = getLightboxPresentationState({ ...base, hasImage: true, hasOcrText: true, hasOcrSaveFailure: true, hasShareFailure: true });
    expect(state.interaction).toEqual({ visible: true, actionBusy: false, retryAvailable: true });
    expect(state.controls.ocrVisible).toBe(true);
    expect(state.controls.ocr.label).toBe('Retry saving text');
    expect(state.controls.share.label).toBe('Retry share');
  });

  it('preserves a share retry label while disabling it during OCR work', () => {
    const state = getLightboxPresentationState({ ...base, hasImage: true, hasShareFailure: true, isOcrPending: true });
    expect(state.interaction).toEqual({ visible: true, actionBusy: true, retryAvailable: true });
    expect(state.controls.share).toMatchObject({ label: 'Retry share', disabled: true, busy: false });
  });

  it('keeps the interaction state closed when the image payload is unavailable', () => {
    const state = getLightboxPresentationState({ ...base, hasImage: false, hasOcrSaveFailure: true });
    expect(state.interaction).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(state.visibility.visible).toBe(false);
    expect(state.controls.ocrVisible).toBe(false);
  });
});
