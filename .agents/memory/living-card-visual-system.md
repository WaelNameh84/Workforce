---
name: Living card visual system
description: The product-wide card treatment for colored, animated module cards.
---

All module cards should use a shared visual treatment with a meaningful accent color, a restrained glow, a slow moving shimmer, and small floating light details. The treatment must remain readable in both light and dark themes and respect `prefers-reduced-motion`.

**Why:** The product owner wants every app card to feel like the departments board rather than a collection of plain white panels; centralizing the treatment keeps new sections consistent.

**How to apply:** Reuse the shared living/legacy card classes and provide a semantic per-module accent instead of creating one-off animation rules for each page.