---
name: Mobile scroll ownership
description: The main mobile scroll container must preserve native vertical scrolling while pull-to-refresh observes only the top edge
---

The main mobile scroll container owns vertical touch scrolling; pull-to-refresh may intercept only a downward gesture that begins at scrollTop zero, and must not rebind touch listeners during the gesture.

**Why:** Rebinding listeners while pull state changes (useCallback with [refreshing] dep + useEffect with callback deps) removes and re-adds the passive:false touchmove listener mid-gesture, which can leave the browser in an inconsistent scroll-blocked state. Upward scrolling sticks until a scroll-to-top control fires.

**Root cause pattern:** `useCallback(..., [refreshing])` + `useEffect(..., [onTouchMove])` = listener rebuilt every time `refreshing` flips. During momentum or mid-gesture, the old listener disappears and the browser loses track of whether to allow scrolling.

**Fix:** Register all touch listeners ONCE in a single `useEffect(fn, [])` with an empty dependency array. Store mutable values in refs (startYRef, pulling, pullYRef, refreshingRef). Callbacks close over refs, not state. Only call `e.preventDefault()` when `pulling.current === true` and `pullYRef.current > 0`. On upward movement (dy <= 0), null startYRef and return without preventDefault so native scroll-up is never blocked.

Also change `overscrollBehaviorY: 'auto'` → `'contain'` to prevent scroll chaining to the window.

**How to apply:** Any scroll container with a custom pull-to-refresh or drag gesture must use empty-dep useEffect + refs for callbacks. Never let reactive state (refreshing, isLoading, etc.) appear in the useEffect dependency array that registers passive:false touch listeners.
