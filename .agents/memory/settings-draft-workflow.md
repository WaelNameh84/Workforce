---
name: Settings draft workflow
description: The settings screen must preview edits without applying them globally until explicit save.
---

Settings editing uses a local draft state. The live application state and browser storage must change only after the user presses a save action; preview dialogs render the draft and must clearly communicate that it is temporary.

**Why:** Users need to compare settings safely and discard experiments without changing the running product.

**How to apply:** Keep edits, preview/replay actions, and section navigation inside the settings draft. Commit the draft and any related appearance or locale state together from the explicit save action.