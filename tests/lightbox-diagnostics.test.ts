import { describe, expect, it } from "vitest";

import {
  createLightboxInteractionAdapter,
  type LightboxInteractionDiagnostics,
} from "../lib/lightbox-interaction-adapter";
import {
  diagnosticsEqual,
  lightboxStateEqual,
  type LightboxDiagnosticsSnapshot,
  type ReadonlyLightboxDiagnostics,
} from "../lib/lightbox-diagnostics";

type DiagnosticsAdapter = ReturnType<typeof createLightboxInteractionAdapter>;
type DiagnosticsMutationCase = readonly [
  label: string,
  mutate: (value: LightboxDiagnosticsSnapshot) => LightboxInteractionDiagnostics,
];

const diagnosticsMutationCases: readonly DiagnosticsMutationCase[] = [
  ["visible", (value) => ({ ...value, state: { ...value.state, visible: true } })],
  ["busy", (value) => ({ ...value, state: { ...value.state, actionBusy: true } })],
  ["retry", (value) => ({ ...value, state: { ...value.state, retryAvailable: true } })],
  ["pending events", (value) => ({ ...value, pendingEventCount: 1 })],
  ["listeners", (value) => ({ ...value, listenerCount: 1 })],
  ["notifying", (value) => ({ ...value, notifying: true })],
  ["released", (value) => ({ ...value, released: true })],
];

function withDiagnosticsAdapter<T>(work: (adapter: DiagnosticsAdapter) => T): T {
  const adapter = createLightboxInteractionAdapter();
  try {
    return work(adapter);
  } finally {
    adapter.release();
  }
}

function readDiagnosticsSnapshot(): LightboxDiagnosticsSnapshot {
  return withDiagnosticsAdapter((adapter) => adapter.getDiagnostics());
}

function expectReleased(adapter: DiagnosticsAdapter | undefined): void {
  expect(adapter?.getDiagnostics().released).toBe(true);
}

describe("lightbox diagnostics equality", () => {
  it("treats equivalent state snapshots as equal", () => {
    const previous = readDiagnosticsSnapshot();
    const next = readDiagnosticsSnapshot();

    expect(lightboxStateEqual(previous.state, next.state)).toBe(true);
    expect(diagnosticsEqual(previous, next)).toBe(true);
  });

  it.each(diagnosticsMutationCases)("detects a changed %s field", (_label, mutate) => {
    const previous = readDiagnosticsSnapshot();
    const next = mutate(previous);

    expect(diagnosticsEqual(previous, next)).toBe(false);
  });

  it("preserves compatibility for the deprecated readonly snapshot alias", () => {
    const adapter = createLightboxInteractionAdapter();
    try {
      const canonicalSnapshot: LightboxDiagnosticsSnapshot = adapter.getDiagnostics();
      const deprecatedSnapshot: ReadonlyLightboxDiagnostics = canonicalSnapshot;
      const canonicalFromDeprecated: LightboxDiagnosticsSnapshot = deprecatedSnapshot;
      expect(diagnosticsEqual(canonicalFromDeprecated, canonicalSnapshot)).toBe(true);
    } finally {
      adapter.release();
    }
  });

  it("keeps the canonical snapshot export consumable at the adapter boundary", () => {
    const adapter = createLightboxInteractionAdapter();
    try {
      const snapshot: LightboxDiagnosticsSnapshot = adapter.getDiagnostics();
      expect(diagnosticsEqual(snapshot, adapter.getDiagnostics())).toBe(true);
    } finally {
      adapter.release();
    }
  });

  it("accepts frozen nested snapshots without mutation", () => {
    const previous = Object.freeze({
      ...readDiagnosticsSnapshot(),
      state: Object.freeze({ visible: false, actionBusy: false, retryAvailable: false }),
    });
    const next = Object.freeze({
      ...readDiagnosticsSnapshot(),
      state: Object.freeze({ visible: false, actionBusy: false, retryAvailable: false }),
    });

    expect(Array.from({ length: 16 }, () => diagnosticsEqual(previous, next))).toEqual(
      Array.from({ length: 16 }, () => true),
    );
    expect(previous.state).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
    expect(next.state).toEqual({ visible: false, actionBusy: false, retryAvailable: false });
  });

  it("does not mutate compared snapshots", () => {
    const previous = readDiagnosticsSnapshot();
    const next = readDiagnosticsSnapshot();
    const previousBefore = JSON.stringify(previous);
    const nextBefore = JSON.stringify(next);

    expect(diagnosticsEqual(previous, next)).toBe(true);
    expect(JSON.stringify(previous)).toBe(previousBefore);
    expect(JSON.stringify(next)).toBe(nextBefore);
  });

  it("remains stable across repeated equal-snapshot checks", () => {
    const previous = readDiagnosticsSnapshot();
    const next = readDiagnosticsSnapshot();

    expect(Array.from({ length: 10 }, () => diagnosticsEqual(previous, next))).toEqual(
      Array.from({ length: 10 }, () => true),
    );
  });

  it("detects combined changes in frozen snapshots as one meaningful update", () => {
    const previous = Object.freeze({
      ...readDiagnosticsSnapshot(),
      state: Object.freeze({ visible: false, actionBusy: false, retryAvailable: false }),
    });
    const next = Object.freeze({
      ...previous,
      state: Object.freeze({ visible: true, actionBusy: true, retryAvailable: true }),
      pendingEventCount: 2,
      listenerCount: 3,
      notifying: true,
      released: true,
    });

    expect(diagnosticsEqual(previous, next)).toBe(false);
  });

  it("detects combined lifecycle and state changes as one meaningful update", () => {
    const previous = readDiagnosticsSnapshot();
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

  it("releases the fixture adapter after successful test work", () => {
    let createdAdapter: DiagnosticsAdapter | undefined;
    const result = withDiagnosticsAdapter((adapter) => {
      createdAdapter = adapter;
      return adapter.open();
    });

    expect(result).toEqual({ visible: true, actionBusy: false, retryAvailable: false });
    expectReleased(createdAdapter);
  });

  it("releases the fixture adapter when test work throws", () => {
    let createdAdapter: DiagnosticsAdapter | undefined;

    expect(() =>
      withDiagnosticsAdapter((adapter) => {
        createdAdapter = adapter;
        throw new Error("fixture failure");
      }),
    ).toThrow("fixture failure");

    expectReleased(createdAdapter);
  });

  it("supports repeated callback execution before final fixture cleanup", () => {
    const states = withDiagnosticsAdapter((adapter) => [
      adapter.getState(),
      adapter.open(),
      adapter.close(),
    ]);

    expect(states).toEqual([
      { visible: false, actionBusy: false, retryAvailable: false },
      { visible: true, actionBusy: false, retryAvailable: false },
      { visible: false, actionBusy: false, retryAvailable: false },
    ]);
  });

  it("keeps a cleaned-up fixture snapshot detached from a fresh adapter", () => {
    const cleanedSnapshot = withDiagnosticsAdapter((adapter) => {
      adapter.open();
      return adapter.getDiagnostics();
    });
    cleanedSnapshot.state.visible = false;
    cleanedSnapshot.released = true;

    const fresh = createLightboxInteractionAdapter();
    try {
      expect(fresh.getDiagnostics()).toEqual({
        state: { visible: false, actionBusy: false, retryAvailable: false },
        pendingEventCount: 0,
        listenerCount: 0,
        notifying: false,
        released: false,
      });
    } finally {
      fresh.release();
    }
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
