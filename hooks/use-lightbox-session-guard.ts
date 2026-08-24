import { useCallback, useEffect, useRef } from 'react';
import { canApplyLightboxFeedback } from '@/lib/lightbox-async-state';

export function useLightboxSessionGuard(itemId: string | null) {
  const itemIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    itemIdRef.current = itemId;
    sessionRef.current += 1;
  }, [itemId]);

  const invalidateSession = useCallback(() => {
    itemIdRef.current = null;
    sessionRef.current += 1;
  }, []);

  const canApplyFeedback = useCallback((actionItemId: string, actionToken: number) => {
    return canApplyLightboxFeedback({
      activeItemId: itemIdRef.current,
      sessionToken: sessionRef.current,
      visible: itemIdRef.current !== null,
    }, actionItemId, actionToken);
  }, []);

  return { sessionRef, canApplyFeedback, invalidateSession };
}
