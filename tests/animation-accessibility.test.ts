import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("accessible motion", () => {
  it("uses the system Reduce Motion preference", () => {
    const source = read("hooks/use-reduced-motion.ts");
    expect(source).toContain("isReduceMotionEnabled");
    expect(source).toContain("reduceMotionChanged");
  });

  it("keeps entrance motion short and native-driver compatible", () => {
    const source = read("components/animated-entrance.tsx");
    expect(source).toContain("duration: 260");
    expect(source).toContain("useNativeDriver: true");
    expect(source).toContain("progress.setValue(1)");
  });

  it("uses reduced motion and staggered list entries on History", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("const reducedMotion = useReducedMotion()");
    expect(source).toContain("Math.min(index * 35, 180)");
    expect(source).toContain("key={`${filter}-${query.trim()}`}");
    expect(source).toContain("AnimatedStateIcon");
  });

  it("animates Favorites and state changes without bypassing reduced motion", () => {
    const favorites = read("app/(tabs)/favorites.tsx");
    const stateIcon = read("components/animated-state-icon.tsx");
    expect(favorites).toContain("Math.min(index * 35, 180)");
    expect(favorites).toContain("useReducedMotion");
    expect(stateIcon).toContain("active");
    expect(stateIcon).toContain("reducedMotion");
    expect(stateIcon).toContain("useNativeDriver: true");
  });

  it("keeps removal transitions reversible and persistence-aware", () => {
    const removal = read("components/animated-removal.tsx");
    const history = read("app/(tabs)/index.tsx");
    const favorites = read("app/(tabs)/favorites.tsx");
    expect(removal).toContain("duration: 180");
    expect(removal).toContain("reducedMotion");
    expect(removal).toContain("useNativeDriver: true");
    expect(history).toContain("setRemovingIds");
    expect(history).toContain("idsToRemove");
    expect(history).toContain("favoriteActionIdsRef.current.has(id)");
    expect(history).toContain("finally");
    expect(favorites).toContain("setRemovingIds");
    expect(favorites).toContain("favoriteActionIdsRef.current.has(id)");
  });

  it("animates completion feedback for clipboard actions", () => {
    const history = read("app/(tabs)/index.tsx");
    const favorites = read("app/(tabs)/favorites.tsx");
    expect(history).toContain("<AnimatedStateIcon active reducedMotion={reducedMotion}");
    expect(favorites).toContain("<AnimatedStateIcon active reducedMotion={reducedMotion}");
  });

  it("keeps media progress and lightbox motion accessible", () => {
    const history = read("app/(tabs)/index.tsx");
    const progress = read("components/animated-progress-pulse.tsx");
    expect(history).toContain("<AnimatedProgressPulse reducedMotion={reducedMotion}");
    expect(history).toContain("<AnimatedModalContent reducedMotion={reducedMotion}");
    expect(progress).toContain("reducedMotion");
    expect(progress).toContain("Animated.loop");
    expect(progress).toContain("useNativeDriver: true");
    expect(progress).toContain('accessibilityRole="progressbar"');
    expect(progress).toContain('accessibilityState={{ busy: true }}');
    expect(progress).toContain("return () => animation.stop()");
  });

  it("reuses the shared modal motion wrapper across collection screens", () => {
    const modal = read("components/animated-modal-content.tsx");
    const history = read("app/(tabs)/index.tsx");
    const favorites = read("app/(tabs)/favorites.tsx");
    expect(modal).toContain("AnimatedEntrance");
    expect(modal).toContain("reducedMotion");
    const sessionGuard = read("hooks/use-lightbox-session-guard.ts");
    expect(sessionGuard).toContain("const invalidateSession = useCallback");
    expect(sessionGuard).toContain("sessionRef.current += 1");
    expect(history).toContain("AnimatedModalContent");
    expect(favorites).toContain("AnimatedModalContent");
  });

  it("centralizes accessible media-action feedback", () => {
    const mediaAction = read("components/animated-media-action.tsx");
    const history = read("app/(tabs)/index.tsx");
    const favorites = read("app/(tabs)/favorites.tsx");
    expect(mediaAction).toContain("accessibilityState={{ busy, disabled }}");
    expect(mediaAction).toContain("AnimatedProgressPulse");
    expect(mediaAction).toContain("reducedMotion");
    expect(history).toContain("AnimatedMediaAction");
    expect(history).toContain("const closeLightbox = useCallback");
    expect(history).toContain("invalidateLightboxSession();");
    expect(favorites).toContain("AnimatedMediaAction");
    expect(favorites).toContain("const closeLightbox = ()");
    expect(favorites).toContain("invalidateLightboxSession();");
  });
});
