import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appConfig = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
const sensitiveClientFiles = [
  "lib/_core/auth.ts",
  "lib/_core/api.ts",
  "app/oauth/callback.tsx",
].map((file) => fs.readFileSync(path.join(root, file), "utf8"));

const requiredFiles = [
  "assets/images/icon.png",
  "assets/images/splash-icon.png",
  "assets/images/favicon.png",
  "eas.json",
];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const checks = [
  ["App name is not a template placeholder", /appName:\s*\"(?!\{\{)[^\"]+\"/.test(appConfig)],
  ["App slug is configured", /appSlug:\s*\"(?!\{\{)[^\"]+\"/.test(appConfig)],
  ["iOS bundle identifier is configured", /bundleIdentifier:\s*env\.iosBundleId/.test(appConfig)],
  ["iOS build number is configured", /buildNumber:\s*\"\d+\"/.test(appConfig)],
  ["Encryption declaration is present", /ITSAppUsesNonExemptEncryption:\s*false/.test(appConfig)],
  ["FileTimestamp privacy reason is declared", /NSPrivacyAccessedAPICategoryFileTimestamp/.test(appConfig) && /C617\.1/.test(appConfig)],
  ["Tracking is explicitly disabled", /NSPrivacyTracking:\s*false/.test(appConfig)],
  ["Sensitive client auth/API logging is absent", sensitiveClientFiles.every((source) => !/console\.(log|warn|error|debug)\s*\(/.test(source))],
  ["Expo SDK dependencies are aligned", packageJson.dependencies?.expo === "~54.0.37"],
  ["Expo Router is SDK-aligned", packageJson.dependencies?.["expo-router"] === "~6.0.24"],
  ["Sharing module is SDK-aligned", packageJson.dependencies?.["expo-sharing"] === "^14.0.8"],
  ["Unused microphone/video config plugins are absent", !/expo-audio|expo-video/.test(appConfig)],
  ["Unused audio/video dependencies are absent", !packageJson.dependencies?.["expo-audio"] && !packageJson.dependencies?.["expo-video"]],
  ["App branding logo is configured", /logoUrl:\s*"(?!")/.test(appConfig)],
  ["Production EAS profile is store-distributed", eas?.build?.production?.distribution === "store"],
  ["Production EAS profile auto-increments versions", eas?.build?.production?.autoIncrement === true],
  ["Required release assets exist", missingFiles.length === 0],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error("iOS release check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (missingFiles.length > 0) console.error(`Missing files: ${missingFiles.join(", ")}`);
  process.exit(1);
}

console.log(`iOS release check passed (${checks.length} checks).`);
