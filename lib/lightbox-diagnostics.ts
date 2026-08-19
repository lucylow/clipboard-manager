import type { LightboxInteractionDiagnostics } from "@/lib/lightbox-interaction-adapter";

export type LightboxDiagnosticsState = LightboxInteractionDiagnostics["state"];
export type LightboxDiagnosticsSnapshot = Readonly<LightboxInteractionDiagnostics> & {
  readonly state: Readonly<LightboxDiagnosticsState>;
};

/** @deprecated Prefer LightboxDiagnosticsSnapshot for new consumers. */
export type ReadonlyLightboxDiagnostics = LightboxDiagnosticsSnapshot;

export function lightboxStateEqual(
  previous: Readonly<LightboxDiagnosticsState>,
  next: Readonly<LightboxDiagnosticsState>,
): boolean {
  return (
    previous.visible === next.visible &&
    previous.actionBusy === next.actionBusy &&
    previous.retryAvailable === next.retryAvailable
  );
}

export function diagnosticsEqual(
  previous: LightboxDiagnosticsSnapshot,
  next: LightboxDiagnosticsSnapshot,
): boolean {
  return (
    previous.pendingEventCount === next.pendingEventCount &&
    previous.listenerCount === next.listenerCount &&
    previous.notifying === next.notifying &&
    previous.released === next.released &&
    lightboxStateEqual(previous.state, next.state)
  );
}
