import { useCallback, useEffect, useRef } from 'react';
import {
  createLightboxSessionController,
  type LightboxSessionController,
} from '@/lib/lightbox-async-state';

export function useLightboxSessionGuard(itemId: string | null) {
  const controllerRef = useRef<LightboxSessionController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createLightboxSessionController();
  }
  const controller = controllerRef.current;
  const itemIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    itemIdRef.current = itemId;
    if (itemId === null) {
      controller.invalidate();
      sessionRef.current = controller.getState().sessionToken;
      return;
    }
    sessionRef.current = controller.open(itemId);
  }, [controller, itemId]);

  const invalidateSession = useCallback(() => {
    itemIdRef.current = null;
    controller.invalidate();
    sessionRef.current = controller.getState().sessionToken;
  }, [controller]);

  const canApplyFeedback = useCallback(
    (actionItemId: string, actionToken: number) => {
      return controller.canApplyFeedback(actionItemId, actionToken);
    },
    [controller],
  );

  return { sessionRef, canApplyFeedback, invalidateSession };
}
