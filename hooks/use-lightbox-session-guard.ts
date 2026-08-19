import { useCallback, useEffect, useRef } from 'react';
import { isCurrentLightboxAction } from '@/lib/lightbox-async-state';

export function useLightboxSessionGuard(itemId: string | null) {
  const itemIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    itemIdRef.current = itemId;
    sessionRef.current += 1;
  }, [itemId]);

  const canApplyFeedback = useCallback((actionItemId: string, actionToken: number) => {
    return isCurrentLightboxAction({
      activeItemId: itemIdRef.current,
      actionItemId,
      isVisible: itemIdRef.current !== null,
      actionToken,
      currentToken: sessionRef.current,
    });
  }, []);

  return { itemIdRef, sessionRef, canApplyFeedback };
}
