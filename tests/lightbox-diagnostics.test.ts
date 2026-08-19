import { describe, expect, it } from "vitest";

import {
  createLightboxInteractionAdapter,
  type LightboxInteractionDiagnostics,
} from "../lib/lightbox-interaction-adapter";
import {
  diagnosticsEqual,
  lightboxStateEqual,
} from "../lib/lightbox-diagnostics";

function diagnostics(): LightboxInteractionDiagnostics {
  return createLightboxInteractionAdapter().getDiagnostics();
}

describe("lightbox diagnostics equality", () => {
  it("treats equivalent state snapshots as equal", () => {
    const previous = diagnostics();
    const next = diagnostics();

    expect(lightboxStateEqual(previous.state, next.state)).toBe(true);
    expect(diagnosticsEqual(previous, next)).toBe(true);
  });

  it.each([
    ["visible", (value: LightboxInteractionDiagnostics) => ({ ...value, state: { ...value.state, visible: true } })],
    ["busy", (value: LightboxInteractionDiagnostics) => ({ ...value, state: { ...value.state, actionBusy: true } })],
    ["retry", (value: LightboxInteractionDiagnostics) => ({ ...value, state: { ...value.state, retryAvailable: true } })],
    ["pending events", (value: LightboxInteractionDiagnostics) => ({ ...value, pendingEventCount: 1 })],
    ["listeners", (value: LightboxInteractionDiagnostics) => ({ ...value, listenerCount: 1 })],
    ["notifying", (value: LightboxInteractionDiagnostics) => ({ ...value, notifying: true })],
    ["released", (value: LightboxInteractionDiagnostics) => ({ ...value, released: true })],
  ])("detects a changed %s field", (_label, mutate) => {
    const previous = diagnostics();
    const next = mutate(previous);

    expect(diagnosticsEqual(previous, next)).toBe(false);
  });

  it("does not mutate compared snapshots", () => {
    const previous = diagnostics();
    const next = diagnostics();
    const previousBefore = JSON.stringify(previous);
    const nextBefore = JSON.stringify(next);

    expect(diagnosticsEqual(previous, next)).toBe(true);
    expect(JSON.stringify(previous)).toBe(previousBefore);
    expect(JSON.stringify(next)).toBe(nextBefore);
  });

  it("remains stable across repeated equal-snapshot checks", () => {
    const previous = diagnostics();
    const next = diagnostics();

    expect(Array.from({ length: 10 }, () => diagnosticsEqual(previous, next))).toEqual(
      Array.from({ length: 10 }, () => true),
    );
  });

  it("detects combined lifecycle and state changes as one meaningful update", () => {
    const previous = diagnostics();
    const next = {
      ...previous,
      state: {
        visible: true,
        actionBusy: true,
        retryAvailable: true,
      },
      pendingEventCount: 2,
      listenerCount: 3,
      notifying: true,
      released: true,
    };

    expect(diagnosticsEqual(previous, next)).toBe(false);
  });

  it("keeps repeated fixture cleanup isolated from a fresh adapter", () => {
    const first = createLightboxInteractionAdapter();
    const firstSnapshot = first.getDiagnostics();
    expect(first.release()).toBe(true);
    expect(first.release()).toBe(false);

    const second = createLightboxInteractionAdapter();
    const secondSnapshot = second.getDiagnostics();
    expect(secondSnapshot.released).toBe(false);
    expect(diagnosticsEqual(firstSnapshot, secondSnapshot)).toBe(true);
    second.release();
  });
});
