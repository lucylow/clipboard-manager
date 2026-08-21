import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const sensitiveClientFiles = [
  "lib/_core/auth.ts",
  "lib/_core/api.ts",
  "app/oauth/callback.tsx",
];

describe("privacy-safe client diagnostics", () => {
  it("does not log credentials, profile data, or API response bodies", () => {
    for (const relativePath of sensitiveClientFiles) {
      const source = readFileSync(resolve(projectRoot, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/console\.(log|warn|error|debug)\s*\(/);
    }
  });
});
