import { describe, expect, it } from "vitest";

import { createLightboxInteractionAdapter } from "../lib/lightbox-interaction-adapter";
import {
  LIGHTBOX_ACTION_CONTROLS,
  resetLightboxAdapter,
  runLightboxAction,
} from "../lib/lightbox-diagnostics-panel";

describe("lightbox diagnostics panel controls", () => {
  it("keeps the visible action controls in their stable UI order", () => {
    expect(LIGHTBOX_ACTION_CONTROLS).toEqual([
      ["open", "Open"],
      ["close", "Close"],
      ["startAction", "Start action"],
      ["succeed", "Succeed"],
      ["fail", "Fail"],
    ]);
  });

  it("runs a live action and returns the committed diagnostics snapshot", () => {
    const adapter = createLightboxInteractionAdapter();

    try {
      const diagnostics = runLightboxAction(adapter, "open");

      expect(diagnostics.state.visible).toBe(true);
      expect(diagnostics.released).toBe(false);
    } finally {
      adapter.release();
    }
  });

  it("does not dispatch actions after the adapter has been released", () => {
    const adapter = createLightboxInteractionAdapter();
    adapter.release();

    const diagnostics = runLightboxAction(adapter, "open");

    expect(diagnostics.released).toBe(true);
    expect(diagnostics.state.visible).toBe(false);
  });

  it("releases the old adapter and returns a fresh replacement", () => {
    const adapter = createLightboxInteractionAdapter();
    adapter.open();

    const replacement = resetLightboxAdapter(adapter, createLightboxInteractionAdapter);

    expect(adapter.getDiagnostics().released).toBe(true);
    expect(replacement).not.toBe(adapter);
    expect(replacement.getDiagnostics()).toMatchObject({
      released: false,
      pendingEventCount: 0,
      listenerCount: 0,
      state: { visible: false, actionBusy: false, retryAvailable: false },
    });

    replacement.release();
  });
});
