---
name: ZOIKO sidebar rail
description: Collapsible desktop sidebar: collapsed icon rail vs expanded label view.
---

## Behaviour
- **Collapsed** (default on load): 64px wide (`W_COLLAPSED`). Shows logo icon only, nav icons centered, no labels.
- **Expanded**: 240px wide (`W_EXPANDED`). Shows horizontal logo + coloured ZOIKO text, labels, section headers.
- **Expansion triggers**: `onMouseEnter` OR `onFocus` on the `<motion.aside>`. Collapse on `onMouseLeave` / `onBlur` (blur checks `relatedTarget` to avoid collapsing when focus moves within sidebar). 120ms debounce prevents flicker.
- **Pin toggle**: `sidebarPinned` state locks it open. Button uses `PanelLeftOpen` / `PanelLeftClose` icons from lucide. Pinned state is in-memory only (not persisted to localStorage).

## Animation
Framer Motion `motion.aside` with `animate={{ width }}`, spring damping 30 / stiffness 300. Labels use `AnimatePresence` + `motion.span` with `width: 0 → auto` so they don't push layout during transition.

## Accessibility
- `<aside aria-label="Main navigation">`
- All nav links: `aria-label={item.label}` + `aria-current="page"` when active
- Bible/Play buttons: explicit `aria-label` (not just `title`)
- Pin button: `aria-label` reflects current state
- Keyboard users get the same expand behaviour as hover users via `onFocus`

## Play dropdown re-anchoring
The `useEffect` that recomputes `playAnchorRect` includes `desktopExpanded` in its deps so the fixed dropdown re-anchors when sidebar width animates.

**Why:** Without this, opening Play while the sidebar is mid-transition leaves the dropdown visually detached from the button.

## Mobile
Mobile drawer (hamburger + slide-from-left) is completely separate from the desktop rail — it uses `sidebarOpen` boolean state with `AnimatePresence`. The desktop rail only renders on `md:` breakpoint and up.
