import { describe, expect, it } from 'vitest';
import { reduceLightboxInteraction, type LightboxInteractionState } from '../lib/lightbox-interaction-state';

const closed: LightboxInteractionState = { visible: false, actionBusy: false, retryAvailable: false };

describe('reduceLightboxInteraction', () => {
  it('opens with a clean action state', () => {
    expect(reduceLightboxInteraction(closed, { type: 'open' })).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });

  it('does not start an action while closed', () => {
    expect(reduceLightboxInteraction(closed, { type: 'action-start' })).toEqual(closed);
  });

  it('shows retry after a visible action fails and clears it on success', () => {
    const opened = reduceLightboxInteraction(closed, { type: 'open' });
    const busy = reduceLightboxInteraction(opened, { type: 'action-start' });
    const failed = reduceLightboxInteraction(busy, { type: 'action-failure' });
    expect(failed).toEqual({ visible: true, actionBusy: false, retryAvailable: true });
    expect(reduceLightboxInteraction(failed, { type: 'action-start' })).toEqual({ visible: true, actionBusy: true, retryAvailable: false });
    expect(reduceLightboxInteraction(failed, { type: 'action-success' })).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
  });

  it('clears busy and retry state on rapid dismissal', () => {
    const failed = reduceLightboxInteraction({ visible: true, actionBusy: true, retryAvailable: false }, { type: 'action-failure' });
    expect(reduceLightboxInteraction(failed, { type: 'close' })).toEqual(closed);
  });

  it('ignores late failure after the lightbox has already closed', () => {
    expect(reduceLightboxInteraction(closed, { type: 'action-failure' })).toEqual(closed);
  });
});
