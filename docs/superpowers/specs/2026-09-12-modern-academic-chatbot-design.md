# Modern Academic Chatbot redesign

## Goal

Refresh the IT Course Assistant chat UI so it feels contemporary, calm, and credible while retaining the department's navy, white, and blue CI. Preserve all existing n8n chat behavior, webhook integration, session metadata, and feedback collection.

## Scope

- Restyle the n8n chat surface through the existing `ChatBot.css` override layer.
- Keep the existing floating chat behavior and responsive viewport constraints.
- Improve the welcome, message, input, loading, and error states.
- Add lightweight interaction polish: visible focus states and restrained hover/pressed feedback.

## Visual direction

The **Modern Academic Chat Surface** uses a deep navy header, an off-white blue-tinted conversation area, and one considered blue accent. The header is compact and contains an information hierarchy: product name, concise supporting copy, then an availability cue. It avoids stacked gradients and excess decoration.

Bot messages are white with a fine blue-tinted boundary; user messages use the department blue. Text keeps Noto Sans Thai, with clearer size, weight, spacing, and line-height distinctions. The input sits in a distinct, calm composer area at the bottom of the window.

## Components and states

| Area | Design behavior |
| --- | --- |
| Header | Compact navy field, subtle cyan rule, clear title/subtitle hierarchy. |
| Welcome | Short introduction with three suggested-question controls when supported by the n8n markup; no change to conversation initialization. |
| Conversation | Spacious reading rhythm, differentiated bot/user bubbles, low-contrast scrollbar. |
| Composer | Large legible text field, clear keyboard focus, compact blue send control with hover and pressed feedback. |
| Loading | CI-aligned skeleton or restrained progress treatment instead of the generic blue spinner. |
| Error | Calm navy/blue information panel with an explicit retry-oriented explanation; no yellow warning-card visual. |
| Feedback banner | Retain behavior but align surfaces, focus styles, spacing, and responsive position with the new chat window. |

## Architecture and data flow

`ChatBot.tsx` continues to initialize `@n8n/chat`, deliver the same initial messages and metadata, and observe messages for feedback. Styling remains isolated in `ChatBot.css`; no webhook endpoint, authentication state, Firebase read, or session-storage contract changes. CSS selectors must remain scoped under `#n8n-chat` so the rest of the site is unaffected.

## Responsive and accessibility requirements

- The chat window must use dynamic viewport-safe sizing and remain usable at 320px wide.
- Controls must retain visible keyboard focus and adequate contrast.
- Hover effects must not be essential to understand any control.
- Motion is short and limited; it must not interfere with reading or scrolling.
- The feedback banner must not cover the composer on narrow screens.

## Validation

1. Build the Vite app successfully.
2. Verify the welcome state, active conversation, input focus, and open/close launcher state on desktop and mobile widths.
3. Verify loading and connection-error states retain their existing behavior and have the new visual treatment.
4. Confirm the feedback banner still appears after its existing message-count threshold and can be dismissed.
5. Confirm no CSS selectors affect components outside `#n8n-chat`.

## Out of scope

- Changing n8n workflow, webhook, chat content, AI behavior, authentication, or Firebase data.
- Replacing the chat provider or adding a design dependency.
- A full application-wide CI redesign.
