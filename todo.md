# Project TODO

- [x] Clipboard history home screen with search and type filters
- [x] Clipboard item cards with copy, favorite, and delete actions
- [x] Paste current system clipboard into local history
- [x] Favorites tab with empty and populated states
- [x] Settings tab with local preferences and clear-history confirmation
- [x] Item detail view for full content and actions
- [x] AsyncStorage persistence for history and settings, including Settings toggles
- [x] Custom Clipboard Manager icon and app branding configuration
- [x] Add clipboard and haptics Expo dependencies as needed
- [x] Run TypeScript and lint checks
- [x] Verify the main mobile UI at mobile preview size; desktop verification remains a future pass

- [x] Synchronize Favorites tab with the live persisted history
- [x] Add copy and favorite actions that work from the Favorites tab
- [x] Improve clipboard feedback and prevent duplicate saved entries
- [x] Add haptic feedback to primary clipboard actions

- [x] Persist the dark-mode preference for future theme integration
- [x] Show success feedback after clearing history
- [x] Refresh History when returning to the tab after external changes
- [x] Add a clear-history fallback that resets the visible seeded state safely

- [x] Add a clear-all history action with confirmation and consistent state reset
- [x] Keep item detail state synchronized after favorite and delete changes
- [x] Add a visible item count and empty-state update after local mutations
- [x] Improve action error handling for clipboard read and write failures

- [x] Add delete action inside the item-detail modal
- [x] Keep the detail modal synchronized after deleting or clearing items
- [x] Persist and restore the selected settings presentation state consistently
- [x] Add visible confirmation when detail actions mutate an item

- [x] Add editable categories to clipboard items
- [x] Add category filtering alongside type and favorites filters
- [x] Persist category changes from the item-detail modal
- [x] Keep category state synchronized across History and Favorites

- [x] Show category badges on History cards
- [x] Show category badges on Favorites cards
- [x] Keep Favorites category display current after returning from History
- [x] Improve category chip visual hierarchy and accessibility

- [x] Search across source app and category metadata
- [x] Show an explicit no-results state for active searches and filters
- [x] Add a one-tap clear-search interaction with accessible labeling
- [x] Keep result counts accurate for combined search and filter queries

- [x] Show explicit saved feedback when a preference changes
- [x] Add a clear explanation for the current appearance mode
- [x] Add haptic feedback for preference toggles
- [x] Make clear-history feedback resilient across repeated settings visits

- [x] Detect and save image clipboard content when available
- [x] Preserve image metadata for media-aware cards and details
- [x] Add image-specific copy feedback and safe fallback behavior
- [x] Keep image entries searchable and compatible with existing filters

- [x] Add OCR text extraction metadata for saved images
- [x] Include OCR text in image search and item details
- [x] Add full-screen image lightbox for History and Favorites
- [x] Add desktop drag-and-drop image ingestion with mobile-safe fallback
- [x] Validate OCR failure, preview dismissal, and unsupported-drop states at the implementation and preview level

- [x] Prevent overlapping OCR requests and show an in-progress state
- [x] Add retry OCR action when extraction fails
- [x] Keep lightbox controls safe around the mobile bottom and top insets
- [x] Avoid retaining oversized image payloads when a save fails

- [x] Show OCR text snippets on image cards when available
- [x] Show image dimensions and extraction status in image details
- [x] Add clearer tap affordance for opening image previews on mobile
- [x] Keep OCR text and image metadata visible in Favorites cards

- [x] Add a safe persisted-image size guard before AsyncStorage writes
- [x] Show image saving and OCR progress as a non-blocking mobile status state
- [x] Add pressed-state feedback to image preview and primary media actions
- [x] Keep corrupted image entries recoverable without crashing the history list

- [x] Add complete accessibility labels and states to primary History actions
- [x] Announce OCR and image-save progress through accessible status text
- [x] Improve pressed and disabled feedback for Paste and OCR retry controls
- [x] Ensure image preview controls remain usable with large text and narrow screens

- [x] Recover gracefully from malformed AsyncStorage JSON
- [x] Show a clear notice when saved history is repaired or reset
- [x] Keep persistence writes serialized to avoid stale concurrent saves
- [x] Preserve valid entries when one saved record is invalid

- [x] Refresh Favorites after every focus and navigation return
- [x] Keep Favorites image OCR and category metadata current after History changes
- [x] Add safe empty-state handling after unfavorite and delete mutations
- [x] Prevent stale tab writes from overwriting newer local history state

- [x] Add multi-select mode for History items
- [x] Add batch favorite and batch delete actions with confirmation
- [x] Keep selection state safe across filtering and tab focus changes
- [x] Add accessible selection counts and cancel controls

- [x] Add batch category actions for selected History items
- [x] Persist batch category changes through the shared storage queue
- [x] Show confirmation feedback after batch category assignment
- [x] Keep selection mode accessible while category actions are available

- [x] Add export text for selected clipboard items
- [x] Add native share-sheet support with a clipboard fallback on web
- [x] Keep image selections represented safely in exported content
- [x] Add accessible export/share feedback and cancel behavior

- [x] Add an image-specific save/share action from the lightbox
- [x] Export image entries with OCR context without duplicating oversized payloads
- [x] Add image action feedback for unavailable or corrupted media
- [x] Keep image actions accessible in History and Favorites previews

- [x] Add a premium plan presentation in Settings
- [x] Add a local entitlement state with a free-tier default
- [x] Gate a clearly premium-only capability without breaking core free usage
- [x] Add a non-transactional upgrade CTA placeholder for future store integration

- [x] Add a dedicated Clipboard Pro upgrade detail modal
- [x] Show premium feature benefits and free-tier availability clearly
- [x] Add a recoverable restore-entitlement action placeholder
- [x] Keep export gating feedback linked to the upgrade journey

- [x] Add a clear Free versus Clipboard Pro comparison section
- [x] Show which features remain available on the free plan
- [x] Add restore-purchase preparation copy and loading-safe feedback
- [x] Keep upgrade and restore actions explicitly non-transactional until billing is integrated

- [x] Refine Clipboard Pro value messaging around concrete user outcomes
- [x] Add clearer entitlement status indicators to gated export actions
- [x] Add a transparent free-tier usage-limit presentation without enforcing billing
- [x] Keep upgrade, restore, and limit messaging explicitly non-transactional until store billing is integrated

- [x] Add local usage-foundation state for future OCR and export limits
- [x] Show transparent usage context in the Clipboard Pro upgrade journey
- [x] Improve the gated export prompt with a direct benefit and current entitlement status
- [x] Keep usage tracking informational and non-blocking until billing and limits are enabled

- [x] Introduce a structured local entitlement record with status, source, and validation state
- [x] Make upgrade and restore feedback distinguish local preview state from future store validation
- [x] Add a clear manage-plan status treatment for active and inactive entitlements
- [x] Keep entitlement architecture ready for server receipt validation without enabling payments

- [x] Add a dedicated manage-plan status view for active and inactive entitlement states
- [x] Show future subscription metadata placeholders without inventing billing details
- [x] Add clear non-transactional store-management and cancellation guidance
- [x] Keep manage-plan actions safe when store billing is unavailable

- [x] Add benefit-led upgrade framing tied to batch export outcomes
- [x] Add clear billing-readiness status without implying an active subscription
- [x] Add a safe waitlist or notify-when-billing-is-live interaction placeholder
- [x] Keep conversion messaging honest and non-transactional in preview mode

- [x] Add a concise upgrade decision summary with the primary Pro outcome
- [x] Add a billing-readiness checklist that distinguishes configured from unavailable capabilities
- [x] Add a safe plan-selection placeholder without showing invented prices or renewal terms
- [x] Keep decision-support messaging non-transactional and accessible

- [x] Add an explicit preview-mode trust note near upgrade actions
- [x] Add local upgrade-interest and billing-notice measurement metadata
- [x] Show a clearer distinction between informational usage tracking and enforced limits
- [x] Keep all measurement local, non-identifying, and non-transactional

- [x] Add a local-only telemetry preference with an explicit off state
- [x] Add a clear monetization privacy explanation near usage tracking
- [x] Make usage and interest counters respect the local telemetry preference
- [x] Keep entitlement and upgrade-state messaging clear when telemetry is disabled

- [x] Add a delete-local-monetization-data action with confirmation
- [x] Show a clear opt-in status label and what data is retained locally
- [x] Make disabling measurement optionally clear recorded usage and event metadata
- [x] Keep entitlement state separate from optional monetization measurement data

- [x] Add a concise privacy explanation link or expandable note near monetization controls
- [x] Show when local plan-interest feedback was saved without exposing identifying data
- [x] Make the delete-local-data result more explicit about what was removed
- [x] Keep all privacy and interest messaging non-transactional and accessible

- [x] Add a concise in-app privacy policy entry point for monetization measurement
- [x] Show when local monetization data was last cleared or indicate that none exists
- [x] Clarify that deleting measurement data does not affect clipboard history or entitlement state
- [x] Keep privacy lifecycle messaging non-transactional and accessible

- [x] Add a clear policy version or preview-status label in the privacy modal
- [x] Show local data categories and retention behavior in a compact summary
- [x] Add a clearer empty-state treatment after local monetization data is deleted
- [x] Keep privacy copy concise, accessible, and non-transactional

- [x] Add an actionable policy acknowledgment state without implying legal acceptance
- [x] Add a clearer upgrade-readiness checklist summary to Settings
- [x] Link readiness items to the relevant future billing or privacy setup state
- [x] Keep all actions local, reversible, accessible, and non-transactional

- [x] Add a clearer billing-readiness detail view with configured and unavailable states
- [x] Add a persistent Settings privacy shortcut for revisiting policy details
- [x] Make privacy acknowledgment status visible without implying legal consent
- [x] Keep all readiness and privacy actions local, reversible, accessible, and non-transactional

- [x] Add a store-integration readiness checklist with product, receipt, and management states
- [x] Clarify which future product metadata is required before prices can be shown
- [x] Add a safe configuration-status summary without exposing invented billing details
- [x] Keep all store-readiness actions local, reversible, accessible, and non-transactional

- [x] Add a concise next-step guidance card for future billing configuration
- [x] Add explicit owner/setup states for products, validation, and store management
- [x] Keep guidance informative without collecting credentials or claiming billing is active
- [x] Keep all setup guidance local, reversible, accessible, and non-transactional

- [x] Add a compact product-catalog placeholder with clearly unavailable status
- [x] Distinguish configured benefits from pending product and price metadata
- [x] Add a clear “no purchase controls yet” explanation near the upgrade CTA
- [x] Keep product-catalog presentation local, reversible, accessible, and non-transactional

- [x] Add a skeleton loading state for product-catalog metadata
- [x] Add a clearly labeled mock product preview with IDs, prices, and renewal terms
- [x] Keep mock catalog data visibly non-purchasable and separate from live entitlements
- [x] Improve Clipboard Pro benefits hierarchy with relevant icons and accessible labels

- [x] Inspect and resolve current TypeScript, Metro, and dev-server errors
- [x] Add product-catalog loading timeout and recoverable error state
- [x] Add safe error feedback for monetization persistence and restore actions
- [x] Keep error states accessible and prevent failed preview data from looking purchasable

- [x] Inspect current build, Metro, and preview errors after the latest checkpoint
- [x] Add stronger initialization failure handling for monetization state
- [x] Add retry-safe recovery for catalog and entitlement flows
- [x] Keep error notices accessible, actionable, and non-transactional

- [x] Inspect current build, runtime, and resource-pressure failures after the latest checkpoint
- [x] Add a consolidated local-state hydration recovery path
- [x] Improve retry behavior and feedback for monetization state operations
- [x] Keep recovery states accessible and preserve safe Free-plan behavior

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add a one-tap retry path for local monetization hydration warnings
- [x] Harden catalog retry timers and entitlement restore state transitions
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add stronger recovery feedback for repeated hydration failures
- [x] Make catalog and entitlement retries guard against duplicate in-flight actions
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add clearer recovery progress feedback for local-state retries
- [x] Harden catalog and entitlement failure transitions against stale state
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add stronger recovery feedback for stale or incomplete local-state hydration
- [x] Harden catalog loading and entitlement restore cleanup paths
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add stronger recovery feedback for stale or incomplete local-state hydration
- [x] Harden catalog loading and entitlement restore cleanup paths
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add a safe reset path for corrupted local monetization state
- [x] Harden catalog and entitlement recovery against stale or malformed data
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add safe post-reset recovery feedback for local monetization state
- [x] Harden catalog and entitlement operations against repeated failures
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add safer post-reset failure recovery and user feedback
- [x] Harden catalog and entitlement operations against repeated or stale failures
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add clearer retry-progress and failure feedback for entitlement recovery
- [x] Harden catalog and local persistence operations against repeated or stale failures
- [x] Keep all error states accessible and preserve the safe Free-plan fallback

- [x] Inspect current build, runtime, and memory-pressure failures after the latest checkpoint
- [x] Add clearer recovery feedback for repeated reset and restore failures
- [x] Harden catalog and local persistence operations against stale or repeated failures
- [x] Keep all error states accessible and preserve the safe Free-plan fallback
- [x] Add deterministic tests for malformed clipboard storage payload recovery
- [x] Run TypeScript, lint, tests, and mobile Settings preview verification

- [x] Add mocked Settings tests for reset and restore overlap guards
- [x] Audit and reduce Metro memory-pressure causes in the development build process
- [x] Replace temporary pointerEvents usage with the standard React Native interaction pattern
- [x] Re-run tests, TypeScript, lint, and mobile preview verification

- [x] Audit History, Favorites, and Settings layouts for the highest-impact interface improvements
- [x] Improve visual hierarchy, spacing, and interaction feedback across the primary mobile screens
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks

- [x] Audit the latest History, Favorites, and Settings interface for another high-impact polish pass
- [x] Improve active filter clarity, summary scanability, and mobile interaction feedback
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks

- [x] Audit the latest core screens for another high-impact interface polish pass
- [x] Improve hierarchy, spacing, and interaction feedback without changing clipboard behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Polish tab-bar active states and elevation without deprecated shadow props
- [x] Remove render-time ThemeProvider console noise

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve visual consistency, content density, and mobile interaction states
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Align History and Favorites card actions with a clearer primary/secondary hierarchy
- [x] Run TypeScript, lint, and tests after the UI pass

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve hierarchy, spacing, and mobile interaction feedback without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Add pressed-state feedback to category filters and Favorites cards
- [x] Run TypeScript, lint, and tests after the UI pass

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve visual hierarchy, interaction feedback, and mobile usability without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Add a cohesive History summary panel around counts and Paste
- [x] Fix History card content overflow on narrow mobile layouts
- [x] Re-run TypeScript, lint, tests, and mobile preview verification

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve visual consistency, content hierarchy, and mobile interaction polish without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Add a compact Favorites summary row with the current saved count
- [x] Re-run TypeScript, lint, tests, and mobile preview verification

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve hierarchy, interaction states, and mobile spacing without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Add a compact Settings local-preview status badge matching the other core headers
- [x] Re-run TypeScript, lint, tests, and mobile preview verification

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve visual hierarchy, consistency, and mobile interaction polish without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Add pressed-state feedback to the Settings destructive action
- [x] Re-run TypeScript, lint, and tests after the UI pass

- [x] Audit the latest core screens for another high-impact interface refinement
- [x] Improve visual hierarchy, consistency, and mobile interaction polish without changing behavior
- [x] Verify the refined interface at mobile portrait sizes and rerun project checks
- [x] Refine tab-bar label typography and remove deprecated shadow props
- [x] Re-run TypeScript, lint, and tests after the UI pass

- [x] Audit History, Favorites, and Settings flows for the highest-impact usability improvements
- [x] Improve discoverability, action feedback, and flow clarity without changing the privacy model
- [x] Verify core flows at mobile portrait sizes and rerun project checks
- [x] Add accessible Paste progress feedback for reading and saving clipboard content
- [x] Fix History card text overflow on narrow mobile layouts
- [x] Re-run TypeScript, lint, and tests after the UX pass

- [x] Audit synchronization and discovery flows for the next highest-impact UX improvement
- [x] Improve synchronization feedback and flow clarity without changing the privacy model
- [x] Verify core flows at mobile portrait sizes and rerun project checks
- [x] Make pull-to-refresh synchronize persisted history and report completion or failure
- [x] Re-run TypeScript, lint, tests, and mobile preview verification

- [ ] Audit status and discovery flows for the next highest-impact UX improvement
- [ ] Improve status clarity and mobile flow smoothness without changing the privacy model
- [ ] Verify core flows at mobile portrait sizes and rerun project checks

- [x] Audit discovery and feedback flows for the next highest-impact UX improvement
- [x] Improve discoverability and flow feedback without changing the privacy model
- [x] Verify core flows at mobile portrait sizes and rerun project checks
- [x] Make the History header Settings shortcut navigate to the Settings screen
- [x] Re-run TypeScript, lint, tests, and mobile preview verification

- [x] Audit History–Settings navigation, refresh failure, and filter flows
- [x] Add smooth navigation transition animations between History and Settings
- [x] Add a visible refresh-failure recovery action with retry behavior
- [x] Add a compact mobile filter bottom sheet for type and category filters
- [x] Verify the new flows at mobile portrait sizes and rerun project checks
- [x] Run TypeScript, lint, and tests for the three UX features

- [x] Audit the latest code for high-impact maintainability and resilience gaps
- [x] Implement targeted code-quality and reliability improvements without changing privacy behavior
- [x] Run automated checks and verify core behavior before checkpointing
- [x] Make History notice timers cleanup-safe and prevent stale timer overwrites
- [x] Handle local premium-state hydration failures with a safe Free-plan fallback

- [x] Audit the latest code for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Extract latest-notice timer behavior into a reusable cleanup-safe controller
- [x] Add deterministic tests for notice replacement and disposal

- [x] Audit the latest code and resource usage for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Remove duplicate initial History hydration to reduce overlapping storage reads
- [x] Re-run TypeScript, lint, and tests after the hydration cleanup

- [x] Audit storage concurrency and History hydration paths for overlapping reads
- [x] Implement single-flight loading and resilience improvements
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Share concurrent History hydration requests through a single in-flight promise
- [x] Add tests for concurrent sharing and post-failure recovery

- [x] Audit the latest code for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Convert synchronous single-flight operation throws into recoverable promise rejections
- [x] Add deterministic coverage for synchronous failure recovery


- [x] Audit the latest code for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Prevent ignored storage-write promises from producing unhandled rejection noise
- [x] Add deterministic coverage for serialized write recovery after failure

- [x] Audit the latest code for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Add bounded History storage-read recovery through a reusable timeout helper
- [x] Add deterministic coverage for timeout success, rejection, and stall recovery

- [x] Audit the latest code for the next high-impact reliability gap
- [x] Implement a targeted maintainability or resilience improvement
- [x] Add deterministic tests and rerun all project checks before checkpointing
- [x] Bound shared clipboard writes and read-modify-write updates with timeout recovery
- [x] Add deterministic stalled-write recovery coverage with fake timers

- [x] Add visible, rollback-safe feedback when History persistence writes time out or fail
- [x] Prevent stale failed writes from reverting newer optimistic History mutations
- [x] Validate the persistence feedback change with TypeScript, lint, and deterministic tests

- [x] Extract rollback-safe History persistence into a reusable hook
- [x] Preserve visible write-failure feedback and stale-operation protection during extraction
- [x] Add focused regression coverage and rerun TypeScript, lint, and tests

- [x] Extract typed History item mutation helpers for favorite, category, and deletion updates
- [x] Preserve optimistic persistence and failure feedback across the helper migration
- [x] Add focused regression coverage and rerun TypeScript, lint, and tests

- [x] Migrate batch category mutations to the typed item mutation helper
- [x] Preserve category feedback and optimistic persistence behavior
- [x] Add or update regression coverage and rerun TypeScript, lint, and tests

- [x] Make batch mutation handlers observe persistence failure results
- [x] Keep selection cleanup and success notices from masking failed saves
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Make clear-history success feedback depend on persistence success
- [x] Make single-item deletion and favorite mutations expose failed-save feedback consistently
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Await OCR metadata persistence and surface follow-up save failures
- [x] Keep the image preview and list state consistent when OCR metadata cannot be saved
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Track images whose OCR metadata could not be persisted
- [x] Add an accessible retry action for failed OCR metadata saves
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Make image sharing and selected export keep explicit recovery state on failure
- [x] Prevent stale busy states from blocking later image actions
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Add bounded cleanup for temporary native image-share files
- [x] Preserve sharing success and failure feedback when cleanup itself fails
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Extract a testable temporary-file cleanup helper
- [x] Cover cleanup success, deletion failure, and timeout without masking share results
- [x] Validate interrupted-operation recovery with TypeScript, lint, and tests

- [x] Add safe cleanup for abandoned export and image-share cache files
- [x] Bound cleanup work and avoid deleting unrelated user files
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Coordinate foreground cache cleanup with focus-based History hydration
- [x] Prevent overlapping resume maintenance and persisted History reads
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Coordinate native app resume with the existing single-flight cache cleanup
- [x] Prevent duplicate History hydration when app resume and tab focus occur together
- [x] Add regression coverage and rerun TypeScript, lint, and tests

- [x] Extract a testable lifecycle recovery coordinator for focus and app resume
- [x] Cover repeated lifecycle events without duplicate cleanup or hydration work
- [x] Rerun TypeScript, lint, and the full deterministic test suite

- [x] Identify whether the remaining pointerEvents warning comes from app code or an Expo dependency
- [x] Remove or isolate any app-owned deprecated pointerEvents usage without changing interaction behavior
- [x] Rerun TypeScript, lint, tests, and preview validation

- [x] Identify whether preview noise can be reduced through app configuration without hiding real errors
- [x] Keep dependency warnings documented as external rather than masking them in app code
- [x] Rerun TypeScript, lint, tests, and preview validation

- [x] Add local-only tracking for repeated lifecycle recovery failures
- [x] Show a concise actionable notice only after repeated failures without exposing sensitive data
- [x] Add deterministic coverage and rerun TypeScript, lint, and tests

- [x] Add a visible inline retry action for repeated History recovery failures
- [x] Keep retry state accessible and protected against overlapping recovery runs
- [x] Rerun TypeScript, lint, tests, and preview validation

- [x] Inspect and recover the managed preview service after its temporary outage
- [x] Preserve the latest guarded History retry behavior during service recovery
- [x] Rerun TypeScript, lint, tests, and capture a fresh preview

- [x] Add deterministic coverage for manual refresh racing with AppState resume
- [x] Verify one recovery operation and one retry path are preserved after the race
- [x] Rerun TypeScript, lint, tests, and preview validation

- [x] Diagnose whether preview refusal is caused by process churn, port binding, or proxy timing
- [x] Recover the managed preview without changing app behavior or masking runtime errors
- [x] Rerun TypeScript, lint, tests, and capture a stable preview
