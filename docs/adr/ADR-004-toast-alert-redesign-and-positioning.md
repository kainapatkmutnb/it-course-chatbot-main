# ADR 004: Toast Notification Redesign and Top-Right Viewport Positioning

## Status
Accepted

## Date
2026-09-12

## Context
1. **Viewport Collision with Chatbot Toggle:**
   The default Radix UI `ToastViewport` was positioned at `bottom-right` (`sm:bottom-0 sm:right-0`). Because the persistent Chatbot Toggle button is docked at `bottom: 20px, right: 20px` with `z-index: 1000`, toast notifications (such as login success, save confirmation, and error banners) were directly obscured by the chatbot button.
2. **Visual Hierarchy and Semantic Clarity:**
   The previous toast design was a stark white box with a thin dark border and no contextual status icons. Users were unable to quickly distinguish success confirmations from operational errors at a glance.
3. **Application-Wide Consistency:**
   More than 90 `toast()` calls are distributed throughout the codebase (authentication, user administration, course management, audit logs, and dashboard exports). A centralized presentation upgrade was required to enhance all notifications without modifying individual call sites.

## Decision
1. **Relocate Viewport to Top-Right:**
   - Position `ToastViewport` at `top-3 right-3` on mobile and `sm:top-4 sm:right-4` on desktop with `z-[99999]`.
   - Update `Sonner` in `App.tsx` to `position="top-right"` for uniformity.
   - This cleanly decouples all system notifications from the bottom-right action area.

2. **Automated Semantic Icon & Variant Resolution:**
   - Enhance `Toaster.tsx` with smart variant resolution (`getToastMeta`):
     - **Success (Green)**: Matches success keywords (e.g. `สำเร็จ`, `เรียบร้อย`, `บันทึก`) or `variant: "success"` with an emerald `CheckCircle2` icon badge.
     - **Destructive (Red)**: Matches error keywords or `variant: "destructive"` with a rose `AlertCircle` icon badge.
     - **Warning (Amber)**: Matches warning keywords with an amber `AlertTriangle` icon badge.
     - **Default / Info (Blue)**: Informational icon `Info` with indigo/blue badge.

3. **Modern Glassmorphic Visual Design:**
   - Container styled with `rounded-2xl`, `backdrop-blur-md bg-white/95 dark:bg-slate-900/95`, soft multi-layer drop shadows, and subtle semantic border highlights.
   - Distinct, accessible close button (`ToastClose`) with soft circular hover background.
   - Smooth slide-in animations from top/right.

4. **Inline Alert Enhancement:**
   - Refine `Alert` in `src/components/ui/alert.tsx` with rounded corners and tinted semantic backgrounds.

## Consequences
- Eliminates any overlap or interaction conflict with the Chatbot Toggle button.
- All 90+ toast calls across the system immediately gain modern, colored semantic cards with status icons.
- Toast notifications appear in the standard eye-level position (Top-Right) favored by enterprise web applications.
