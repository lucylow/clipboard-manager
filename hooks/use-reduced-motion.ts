import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

/**
 * Mirrors the operating system's Reduce Motion preference.
 * Motion callers should use this to switch to immediate state changes.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReducedMotion(enabled);
      })
      .catch(() => {
        // Keep motion enabled when the platform cannot expose the preference.
      });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
