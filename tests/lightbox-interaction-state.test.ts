import { describe, expect, it } from 'vitest';
import { getLightboxInteractionState, reduceLightboxInteraction, type LightboxInteractionState } from '../lib/lightbox-interaction-state';

const closed: LightboxInteractionState = { visible: false, actionBusy: false, retryAvailable: false };

describe('reduceLightboxInteraction', () => {
  it('normalizes malformed derived-state options to strict booleans', () => {
    const malformed = {
      hasImage: 'yes',
      isSharing: 1,
      isOcrPending: 'pending',
      hasShareFailure: true,
      hasOcrSaveFailure: {},
    } as unknown as Parameters<typeof getLightboxInteractionState>[0];

    expect(getLightboxInteractionState(malformed)).toEqual({
      visible: false,
      actionBusy: false,
      retryAvailable: false,
    });
  });


  it('isolates throwing derived-state option accessors', () => {
    const hostile = {
      get hasImage(): boolean { throw new Error('hostile hasImage'); },
      get isSharing(): boolean { throw new Error('hostile isSharing'); },
      isOcrPending: true,
      hasShareFailure: true,
      hasOcrSaveFailure: false,
    };

    expect(() => getLightboxInteractionState(hostile)).not.toThrow();
    expect(getLightboxInteractionState(hostile)).toEqual({
      visible: false,
      actionBusy: false,
      retryAvailable: false,
    });
  });

  it('returns detached derived-state snapshots across repeated reads', () => {
    const options = {
      hasImage: true,
      isSharing: true,
      isOcrPending: false,
      hasShareFailure: false,
      hasOcrSaveFailure: true,
    };
    const first = getLightboxInteractionState(options);
    const second = getLightboxInteractionState(options);
    first.visible = false;
    first.actionBusy = false;
    first.retryAvailable = false;

    expect(second).toEqual({ visible: true, actionBusy: true, retryAvailable: true });
    expect(second).not.toBe(first);
    expect(getLightboxInteractionState(options)).toEqual(second);
  });

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

  it('keeps closed close and success events as identity no-ops', () => {
    expect(reduceLightboxInteraction(closed, { type: 'close' })).toBe(closed);
    expect(reduceLightboxInteraction(closed, { type: 'action-success' })).toBe(closed);
  });

  it('normalizes malformed runtime states without leaking extra fields', () => {
    const malformed = {
      visible: 'yes',
      actionBusy: 1,
      retryAvailable: true,
      unexpected: 'discard-me',
    } as unknown as Parameters<typeof reduceLightboxInteraction>[0];
    const invalid = null as unknown as Parameters<typeof reduceLightboxInteraction>[0];

    expect(reduceLightboxInteraction(malformed, { type: 'close' })).toEqual({
      visible: false,
      actionBusy: false,
      retryAvailable: true,
    });
    expect(reduceLightboxInteraction(invalid, { type: 'action-success' })).toEqual({
      visible: false,
      actionBusy: false,
      retryAvailable: false,
    });
  });

  it('isolates throwing state getters and unusual object shapes', () => {
    const hostile = {
      get visible(): boolean { throw new Error('hostile visible'); },
      actionBusy: true,
      retryAvailable: true,
    } as unknown as Parameters<typeof reduceLightboxInteraction>[0];
    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype.visible = true;
    nullPrototype.actionBusy = false;
    nullPrototype.retryAvailable = true;

    expect(() => reduceLightboxInteraction(hostile, { type: 'close' })).not.toThrow();
    const safeClosed = { visible: false, actionBusy: false, retryAvailable: false };
    expect(reduceLightboxInteraction(hostile, { type: 'close' })).toEqual(safeClosed);
    expect(reduceLightboxInteraction(hostile, { type: 'action-start' })).toEqual(safeClosed);
    expect(reduceLightboxInteraction(hostile, { type: 'action-success' })).toEqual(safeClosed);
    expect(reduceLightboxInteraction(hostile, { type: 'action-failure' })).toEqual(safeClosed);
    expect(reduceLightboxInteraction(nullPrototype as Parameters<typeof reduceLightboxInteraction>[0], { type: 'action-success' })).toEqual({
      visible: true,
      actionBusy: false,
      retryAvailable: false,
    });
  });

  it('recovers to normal transitions after malformed-state input', () => {
    const malformed = null as unknown as Parameters<typeof reduceLightboxInteraction>[0];
    const recovered = reduceLightboxInteraction(malformed, { type: 'open' });
    expect(recovered).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
    expect(reduceLightboxInteraction(recovered, { type: 'action-start' })).toEqual({
      visible: true,
      actionBusy: true,
      retryAvailable: false,
    });
  });

  it('supports repeated recovery sequences after malformed inputs', () => {
    const malformed = undefined as unknown as Parameters<typeof reduceLightboxInteraction>[0];
    const firstOpen = reduceLightboxInteraction(malformed, { type: 'open' });
    const firstClose = reduceLightboxInteraction(firstOpen, { type: 'close' });
    const secondOpen = reduceLightboxInteraction(malformed, { type: 'open' });
    const secondBusy = reduceLightboxInteraction(secondOpen, { type: 'action-start' });

    expect(firstClose).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(secondBusy).toEqual({ visible: true, actionBusy: true, retryAvailable: false });
  });

  it('keeps normalized failure outputs detached across repeated calls', () => {
    const malformed = null as unknown as Parameters<typeof reduceLightboxInteraction>[0];
    const first = reduceLightboxInteraction(malformed, { type: 'action-success' });
    first.visible = true;
    first.actionBusy = true;
    first.retryAvailable = true;

    const second = reduceLightboxInteraction(malformed, { type: 'action-failure' });
    expect(second).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(second).not.toBe(first);
  });

  it('keeps invalid runtime events as identity no-ops across valid states', () => {
    const invalidEvent = { type: 'unexpected-event' } as unknown as Parameters<typeof reduceLightboxInteraction>[1];
    const states = [
      closed,
      { visible: true, actionBusy: false, retryAvailable: false },
      { visible: true, actionBusy: true, retryAvailable: false },
      { visible: true, actionBusy: false, retryAvailable: true },
    ];

    states.forEach((state) => {
      expect(reduceLightboxInteraction(state, invalidEvent)).toBe(state);
    });
  });

  it('keeps repeated action events as identity no-ops when state cannot change', () => {
    const idle = { visible: true, actionBusy: false, retryAvailable: false };
    const busy = { visible: true, actionBusy: true, retryAvailable: false };
    const failed = { visible: true, actionBusy: false, retryAvailable: true };

    expect(reduceLightboxInteraction(busy, { type: 'action-start' })).toBe(busy);
    expect(reduceLightboxInteraction(failed, { type: 'action-failure' })).toBe(failed);
    expect(reduceLightboxInteraction(idle, { type: 'action-success' })).toBe(idle);
  });
});
