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
});
