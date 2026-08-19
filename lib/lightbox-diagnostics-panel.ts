import type {
  LightboxInteractionAdapter,
  LightboxInteractionDiagnostics,
} from "./lightbox-interaction-adapter";

export type LightboxAction = "open" | "close" | "startAction" | "succeed" | "fail";

export type LightboxActionControl = readonly [action: LightboxAction, label: string];

export const LIGHTBOX_ACTION_CONTROLS: readonly LightboxActionControl[] = [
  ["open", "Open"],
  ["close", "Close"],
  ["startAction", "Start action"],
  ["succeed", "Succeed"],
  ["fail", "Fail"],
];

export function runLightboxAction(
  adapter: LightboxInteractionAdapter,
  action: LightboxAction,
): LightboxInteractionDiagnostics {
  const diagnostics = adapter.getDiagnostics();
  if (diagnostics.released) return diagnostics;

  adapter[action]();
  return adapter.getDiagnostics();
}

export function resetLightboxAdapter(
  adapter: LightboxInteractionAdapter,
  createAdapter: () => LightboxInteractionAdapter,
): LightboxInteractionAdapter {
  adapter.release();
  return createAdapter();
}
