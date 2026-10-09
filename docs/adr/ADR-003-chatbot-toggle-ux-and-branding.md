# ADR 003: Chatbot Toggle UX Enhancement and Welcome Screen White-labeling

## Status
Accepted

## Date
2026-09-12

## Context
1. **Duplicate "Powered by n8n" Attribution:**
   In the chat welcome screen, users observed two stacked lines:
   - Line 1: Plain text "Powered by n8n" originating from the application's configuration (`i18n.en.footer`).
   - Line 2: The default widget attribution component (`<PoweredBy />`) bundled inside `@n8n/chat`.
   This duplication cluttered the welcome view and conflicted with the desired institutional presentation of the KMUTNB IT department.

2. **Chatbot Toggle Visibility & Engagement:**
   The default launcher button was a static circular icon with minimal interaction feedback. Students navigating the curriculum portal often overlooked the assistant. A modern floating callout pill, online status indicator (green pulse), and refined hover/focus animations were requested to drive engagement without obstructing core UI navigation.

## Decision
1. **White-labeling the Welcome Screen:**
   - Set `i18n.en.footer` to empty string in `ChatBot.tsx`.
   - Apply CSS overrides to completely hide `.chat-powered-by`, `.chat-get-started-footer`, and `.chat-footer`.
   - Ensure zero visual clutter or third-party vendor links appear on the welcome screen.

2. **Clean Minimalist Toggle Launcher:**
   - Evaluated a floating callout pill and online status dot. User feedback indicated these extra elements cluttered and partially obstructed table/card rows on dashboards.
   - Removed the floating pill and pulse badge to preserve an uncluttered, distraction-free interface.
   - Retained the enhanced circular toggle button (`.chat-window-toggle`) with sleek gradient (`#2563eb` to `#4f46e5`), translucent border highlight, and polished hover/active micro-interactions.
   - Maintained full print suppression under `@media print`.

## Consequences
- The welcome screen is clean, professional, and branded specifically for the department.
- The interface remains clean and distraction-free without floating badges obstructing page content.
- Fast, tactile hover interactions on the circular launcher button.
