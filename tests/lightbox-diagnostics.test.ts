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
});
