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

2. **Proactive ChatbotCalloutPill:**
   - Add a dismissible floating pill badge ("💬 สอบถามหลักสูตร IT ที่นี่") adjacent to the toggle button.
   - Attach click handlers allowing users to trigger the chat launcher directly from the pill.
   - Hide the pill automatically when the chat window is active or on mobile viewports (`max-width: 640px`).

3. **ChatStatusIndicator (Pulse Dot):**
   - Add a pulsating green status badge (`.chat-status-pulse`) positioned at the top-right corner of the toggle button.
   - Provides clear real-time feedback that the AI advising service is online and active.

4. **Toggle Micro-Interactions & Styling:**
   - Enhance `.chat-window-toggle` with a multi-stop gradient (`#2563eb` to `#4f46e5`), subtle border highlights, and smooth scaling on hover/active states.
   - Hide all chat elements and floating badges under `@media print`.

## Consequences
- The welcome screen is clean, professional, and branded specifically for the department.
- Students receive clear, attractive cues regarding the availability of AI course advising.
- Responsive styles prevent UI blockage on mobile devices.
