# Clipboard Manager Mobile Interface Design

## Product direction

Clipboard Manager is an offline-first utility for quickly finding and reusing copied text and images. The interface follows mainstream iOS conventions: a calm warm-neutral canvas, clear hierarchy, rounded cards, compact controls, and one-handed actions anchored near the lower half of the screen.

## Screen list

### History (Home)

The primary screen shows a large title, a compact status summary, a search field, filter chips for All, Text, Images, and Favorites, followed by a chronological list of clipboard cards. Each card exposes a leading type icon, timestamp, content preview, optional source/category metadata, favorite control, and a primary Copy action. A floating add/paste action lets the user pull the current system clipboard into history.

### Favorites

A focused list of pinned clipboard entries with the same card interaction model as History. The empty state explains how to favorite an item and provides a route back to the full history.

### Settings

Settings is grouped into Clipboard, Appearance, and Data sections. The first pass includes auto-save behavior, image capture preference, retention period, dark mode preference, and a clear-history action with confirmation. Subscription and secure PIN controls are presented as planned affordances but remain local-only until explicitly integrated.

### Item detail

A detail sheet or route presents the full clipboard content, metadata, favorite toggle, category, and actions to copy, share, or delete. Long text uses a readable scrollable layout; image entries show a preview.

## Primary content and functionality

The core interaction is local and deterministic. Users can search the seeded history, filter by type, copy an item back to the system clipboard, favorite/unfavorite entries, paste the current clipboard into the app, and delete entries. AsyncStorage persistence is appropriate for this first implementation; cloud sync, monetization, and background monitoring remain future integrations.

## Key user flows

1. **Find and reuse text:** User opens History → types into Search → taps a result's Copy button → sees a confirmation toast/banner.
2. **Capture current clipboard:** User taps the paste/add control → app reads the system clipboard asynchronously → if non-empty, it adds a new text entry at the top and confirms the save.
3. **Keep an important entry:** User taps the star on a card → card moves into Favorites filtering and the icon changes state.
4. **Inspect an entry:** User taps a card → Item Detail opens → user copies, favorites, shares, or deletes the entry.
5. **Manage retention:** User opens Settings → changes retention preference or chooses Clear History → destructive action requires confirmation.

## Visual system

- **Canvas:** `#F6F4F1` warm off-white for a softer utility surface.
- **Primary ink:** `#1F2933` deep slate for readable hierarchy.
- **Muted ink:** `#7B8794` for timestamps and helper copy.
- **Accent:** `#E76F51` coral for primary actions and active states.
- **Accent dark:** `#C9553B` for pressed states.
- **Soft accent:** `#FCE5DE` for selected chips and highlighted controls.
- **Card surface:** `#FFFFFF` with `#E8E4DF` borders.
- **Image tint:** `#E8DFF5` lavender.
- **Success tint:** `#DDF3E4` mint.

Typography uses a strong 30–32 pt page title, 17 pt card titles, 14–15 pt body copy, and 12–13 pt metadata. Spacing follows an 8 pt rhythm with 20–24 pt horizontal margins. Interactive targets are at least 44 pt high, and primary actions use subtle opacity/scale feedback rather than heavy animation.
