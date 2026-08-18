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
