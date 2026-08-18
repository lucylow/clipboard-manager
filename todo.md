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
