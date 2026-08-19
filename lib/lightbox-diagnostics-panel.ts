import type {
  LightboxInteractionAdapter,
  LightboxInteractionDiagnostics,
} from "./lightbox-interaction-adapter";

export type LightboxAction = "open" | "close" | "startAction" | "succeed" | "fail";

export type LightboxActionControl = Readonly<{
  action: LightboxAction;
  label: string;
}>;

export const LIGHTBOX_ACTION_CONTROLS: readonly LightboxActionControl[] = [
  { action: "open", label: "Open" },
  { action: "close", label: "Close" },
  { action: "startAction", label: "Start action" },
  { action: "succeed", label: "Succeed" },
  { action: "fail", label: "Fail" },
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
  const replacement = createAdapter();
  adapter.release();
  return replacement;
}
