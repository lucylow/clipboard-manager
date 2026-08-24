import { describe, expect, it } from 'vitest';
import {
  canApplyLightboxFeedback,
  createLightboxSessionController,
  isCurrentLightboxAction,
} from '../lib/lightbox-async-state';

describe('isCurrentLightboxAction', () => {
  it('rejects a result after the lightbox has closed', () => {
    expect(isCurrentLightboxAction({ activeItemId: null, actionItemId: 'image-1', isVisible: false })).toBe(false);
  });

  it('rejects a result for an item replaced while the action was pending', () => {
    expect(isCurrentLightboxAction({ activeItemId: 'image-2', actionItemId: 'image-1', isVisible: true })).toBe(false);
  });

  it('rejects a result from an earlier session when the same item was reopened', () => {
    expect(isCurrentLightboxAction({ activeItemId: 'image-1', actionItemId: 'image-1', isVisible: true, actionToken: 2, currentToken: 3 })).toBe(false);
  });

  it('accepts a result for the still-visible active item in the same session', () => {
    expect(isCurrentLightboxAction({ activeItemId: 'image-1', actionItemId: 'image-1', isVisible: true, actionToken: 3, currentToken: 3 })).toBe(true);
  });

  it('keeps the shared session contract deterministic for close, replacement, and reopen', () => {
    expect(canApplyLightboxFeedback({ activeItemId: null, sessionToken: 4, visible: false }, 'image-1', 4)).toBe(false);
    expect(canApplyLightboxFeedback({ activeItemId: 'image-2', sessionToken: 4, visible: true }, 'image-1', 4)).toBe(false);
    expect(canApplyLightboxFeedback({ activeItemId: 'image-1', sessionToken: 5, visible: true }, 'image-1', 4)).toBe(false);
    expect(canApplyLightboxFeedback({ activeItemId: 'image-1', sessionToken: 4, visible: true }, 'image-1', 4)).toBe(true);
  });
});


describe('createLightboxSessionController', () => {
  it('invalidates synchronously and rejects a pending action immediately', () => {
    const controller = createLightboxSessionController();
    const actionToken = controller.open('image-1');

    expect(controller.canApplyFeedback('image-1', actionToken)).toBe(true);
    controller.invalidate();

    expect(controller.getState()).toMatchObject({ activeItemId: null, visible: false });
    expect(controller.getState().sessionToken).toBe(actionToken + 1);
    expect(controller.canApplyFeedback('image-1', actionToken)).toBe(false);
  });

  it('does not double-invalidate when close cleanup runs more than once', () => {
    const controller = createLightboxSessionController();
    const actionToken = controller.open('image-1');

    controller.invalidate();
    controller.invalidate();

    expect(controller.getState().sessionToken).toBe(actionToken + 1);
    expect(controller.getState().visible).toBe(false);
  });

  it('rejects an old action after the same item is reopened', () => {
    const controller = createLightboxSessionController();
    const firstToken = controller.open('image-1');
    controller.invalidate();
    const reopenedToken = controller.open('image-1');

    expect(reopenedToken).toBe(firstToken + 2);
    expect(controller.canApplyFeedback('image-1', firstToken)).toBe(false);
    expect(controller.canApplyFeedback('image-1', reopenedToken)).toBe(true);
  });
});
