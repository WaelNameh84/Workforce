---
name: Mobile scroll ownership
description: The main mobile scroll container must be viewport-constrained so it is the actual scroll element, not the window
---

## Root cause

The outer layout wrapper must use `h-screen` / `h-[100dvh]` (not `min-h-screen`).  
The inner main column must use `min-h-0` (not `min-h-screen`).

**Why:** `min-h-screen` lets the wrapper grow beyond the viewport. When it does, the *window* scrolls instead of the `PullToRefresh` scroll container. The scroll container's `scrollTop` stays 0, so `canPull()` always returns `true`. Then when the user tries to scroll **up** (finger moves down = dy > 0), pull-to-refresh treats it as a pull gesture and calls `e.preventDefault()`, blocking the window scroll entirely. Result: downward scroll works, upward scroll is frozen.

**Fix applied:**
- Outer flex wrapper: `class="h-screen flex ..."` + `style={{ height: '100dvh' }}` (dvh handles mobile address-bar shrink/grow)
- Inner main column: `class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden"` (no min-h-screen)

## Pull-to-refresh listener stability

Touch listeners must be registered **once** in `useEffect(fn, [])` with an empty dependency array. Storing mutable values in refs (startYRef, pulling, pullYRef, refreshingRef) keeps callbacks stable. Never let reactive state (refreshing, isLoading, etc.) appear in the useEffect dependency array that registers passive:false touch listeners — rebinding mid-gesture breaks scroll.

**How to apply:** Any scroll container + pull-to-refresh must use `h-screen`/`h-[100dvh]` on the layout wrapper, and `flex-1 min-h-0 overflow-y-auto` on the scroll container, so the element's own `scrollTop` is the scroll authority.
