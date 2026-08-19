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

  it("returns detached diagnostics that cannot mutate the live adapter", () => {
    const adapter = createLightboxInteractionAdapter();

    try {
      const diagnostics = runLightboxAction(adapter, "open");
      diagnostics.state.visible = false;
      diagnostics.released = true;

      expect(adapter.getDiagnostics()).toMatchObject({
        released: false,
        state: { visible: true },
      });
    } finally {
      adapter.release();
    }
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

  it("does not notify stale subscribers after repeated resets", () => {
    const notifications: string[] = [];
    const first = createLightboxInteractionAdapter();
    const firstUnsubscribe = first.subscribe((state) => notifications.push(`first:${state.visible}`));
    const second = resetLightboxAdapter(first, createLightboxInteractionAdapter);
    const secondUnsubscribe = second.subscribe((state) => notifications.push(`second:${state.visible}`));
    const third = resetLightboxAdapter(second, createLightboxInteractionAdapter);

    third.open();

    expect(notifications).toEqual([]);
    expect(firstUnsubscribe()).toBe(false);
    expect(secondUnsubscribe()).toBe(false);
    expect(third.getDiagnostics().listenerCount).toBe(0);

    third.release();
  });

  it("keeps the current adapter usable when replacement creation fails", () => {
    const adapter = createLightboxInteractionAdapter();
    const createReplacement = () => {
      throw new Error("replacement unavailable");
    };

    expect(() => resetLightboxAdapter(adapter, createReplacement)).toThrow("replacement unavailable");
    expect(adapter.getDiagnostics().released).toBe(false);

    adapter.open();
    expect(adapter.getDiagnostics().state.visible).toBe(true);
    adapter.release();
  });
});
