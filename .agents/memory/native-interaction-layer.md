---
name: Native interaction layer
description: Shared mobile behaviors should live at the application shell level and degrade safely on desktop browsers
---

Treat mobile-native behaviors as a shared interaction layer: keep navigation gestures, connectivity status, refresh affordances, splash presentation, and system theme resolution near the app shell, while keeping entity-specific long-press actions inside the relevant feature page.

**Why:** These behaviors affect every screen and are easiest to keep consistent when they are not reimplemented page by page; browser APIs such as share, vibration, online status, and matchMedia can be unavailable or user-cancelled.

**How to apply:** Prefer progressive enhancement with feature detection and safe fallbacks (copy, no-op, or visible status) so desktop preview and mobile browsers both remain usable.