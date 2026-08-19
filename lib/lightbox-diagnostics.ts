import type { LightboxInteractionDiagnostics } from "@/lib/lightbox-interaction-adapter";

export type LightboxDiagnosticsState = LightboxInteractionDiagnostics["state"];

export function lightboxStateEqual(
  previous: LightboxDiagnosticsState,
  next: LightboxDiagnosticsState,
): boolean {
  return (
    previous.visible === next.visible &&
    previous.actionBusy === next.actionBusy &&
    previous.retryAvailable === next.retryAvailable
  );
}

export function diagnosticsEqual(
  previous: LightboxInteractionDiagnostics,
  next: LightboxInteractionDiagnostics,
): boolean {
  return (
    previous.pendingEventCount === next.pendingEventCount &&
    previous.listenerCount === next.listenerCount &&
    previous.notifying === next.notifying &&
    previous.released === next.released &&
    lightboxStateEqual(previous.state, next.state)
  );
}
