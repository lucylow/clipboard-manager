import { describe, expect, it } from 'vitest';
import { getImageActionPresentation } from '../lib/image-action-state';

describe('getImageActionPresentation', () => {
  it('keeps OCR extraction accessible and disabled while busy', () => {
    expect(getImageActionPresentation('ocr', { busy: true, failed: false })).toEqual({
      label: 'Extracting text…',
      accessibilityLabel: 'Extracting text from image',
      disabled: true,
      busy: true,
    });
  });

  it('exposes a retryable OCR save state after metadata persistence fails', () => {
    expect(getImageActionPresentation('ocr', { busy: false, failed: true })).toEqual({
      label: 'Retry saving text',
      accessibilityLabel: 'Retry saving extracted text',
      disabled: false,
      busy: false,
    });
  });

  it('keeps image sharing retryable after a failed share', () => {
    expect(getImageActionPresentation('share', { busy: false, failed: true })).toEqual({
      label: 'Retry share',
      accessibilityLabel: 'Retry sharing saved image',
      disabled: false,
      busy: false,
    });
  });

  it('disables sharing while another image action is active', () => {
    expect(getImageActionPresentation('share', { busy: false, failed: false, blocked: true })).toMatchObject({
      label: 'Share image',
      disabled: true,
      busy: false,
    });
  });

  it('does not expose a stale retry label after a successful share', () => {
    expect(getImageActionPresentation('share', { busy: false, failed: false })).toEqual({
      label: 'Share image',
      accessibilityLabel: 'Share saved image',
      disabled: false,
      busy: false,
    });
  });
});
