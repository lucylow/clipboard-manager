# Clipboard Manager — iOS App Store Release Checklist

## Validated in the project

The project has a production-oriented Expo configuration with the display name `Clipboard Manager`, the bundle identifier `com.app.clipboardmanager`, iOS build number `1`, the app icon and splash assets, an explicit encryption declaration, and an EAS production profile configured for store distribution with automatic version increments. Expo SDK dependencies are aligned with the installed SDK compatibility set, and unused microphone/video config plugins are not enabled.

The release check is available through:

```bash
pnpm release:check
```

The current validation baseline is TypeScript, Expo lint, the release check, and the deterministic Vitest suite. The latest run passed all available tests, with one pre-existing authentication test skipped by design.

## Required Apple Developer and App Store Connect work

| Area | Required action |
|---|---|
| Apple Developer account | Confirm the Apple Developer Program membership and create or select the App ID matching `com.app.clipboardmanager`. |
| Signing | Let EAS manage distribution credentials, or provide an existing distribution certificate and provisioning profile through the authenticated EAS account. |
| App Store Connect app | Create the app record with the exact bundle identifier, display name, primary language, SKU, and availability. |
| Store metadata | Supply the final subtitle, description, keywords, support URL, marketing URL if used, category, age rating answers, and copyright information. |
| Privacy | Publish a privacy policy URL and complete App Store Connect privacy nutrition-label declarations. Review clipboard, locally stored content, OCR processing, diagnostics, and any optional monetization measurement disclosures. Audit the final IPA and bundled SDKs for required-reason API declarations in `PrivacyInfo.xcprivacy`; Apple states that missing required-reason declarations can block App Store Connect acceptance [1]. |
| Screenshots | Capture current-device screenshots for the required iPhone display sizes and any iPad sizes retained by the configuration. |
| Monetization | Provide the final App Store product identifiers, prices, renewal terms, and receipt-validation service before enabling real purchase controls. |
| Review notes | Explain that clipboard history is stored locally, that OCR is optional, and that billing controls remain unavailable until store products are configured. |
| Build and submit | Run the authenticated EAS production build with a current Apple-supported SDK image, install the resulting IPA on a physical iOS device or TestFlight, complete smoke testing, then submit through App Store Connect. Apple’s current submission guidance specifies the minimum SDK requirement for uploads, so the actual EAS build log must be checked before submission [2]. |

## Release gates before submission

Do not submit until the production IPA has been tested on at least one physical iPhone. Verify first launch, permission prompts, clipboard text and image flows, OCR failure recovery, sharing, deletion and clear-history confirmation, Settings hydration, light/dark appearance, VoiceOver labels, offline behavior, and restoration after force quit. Confirm that no preview-only billing language, placeholder price, debug endpoint, or development server dependency is present in the production build.

Publishing and App Store Connect submission are intentionally not performed by this project pass. The project is prepared for those authenticated steps, but they require the app owner’s Apple Developer credentials, store metadata, privacy policy, and final legal declarations.

## References

[1]: https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api "Apple Developer — Describing use of required reason API"
[2]: https://developer.apple.com/app-store/submitting/ "Apple Developer — Submit your apps and games today"
