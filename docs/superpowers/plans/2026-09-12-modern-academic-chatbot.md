# Modern Academic Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a compact, accessible Modern Academic visual treatment for the existing IT Course Assistant without changing its n8n or Firebase behavior.

**Architecture:** Keep `ChatBot.tsx` responsible for chat initialization, metadata, feedback monitoring, and rendering non-chat states. Keep all n8n markup overrides and responsive presentation in `ChatBot.css`, scoped under `#n8n-chat`; add a dependency-free Node verification script that prevents CI colors and selectors from leaking outside this component.

**Tech Stack:** React 18, TypeScript, Vite 5, CSS, `@n8n/chat`, Node built-in `assert`.

## Global Constraints

- Preserve the webhook URL, `createChat` options, initial messages, metadata, session-storage keys, and feedback trigger behavior verbatim.
- Do not add packages or replace `@n8n/chat`.
- Retain the existing navy, white, and blue institutional palette; use one blue accent and no purple gradient.
- Scope all chat UI CSS under `#n8n-chat`, except the existing print hide rule and the feedback banner class.
- Keep the floating chat usable at a viewport width of 320px and use visible keyboard focus states.

---

### Task 1: Add a focused chatbot visual-contract check

**Files:**
- Create: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/test-chatbot-theme.mjs`
- Modify: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/package.json`

**Interfaces:**
- Consumes: `src/components/chat/ChatBot.css` and `src/components/chat/ChatBot.tsx` as UTF-8 source files.
- Produces: `npm run test:chatbot-theme`, a zero-dependency static regression check with exit code 0 on success.

- [ ] **Step 1: Write the failing test**

Create `test-chatbot-theme.mjs` with this exact content before changing the component or CSS:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [css, component] = await Promise.all([
  readFile(new URL('./src/components/chat/ChatBot.css', import.meta.url), 'utf8'),
  readFile(new URL('./src/components/chat/ChatBot.tsx', import.meta.url), 'utf8'),
]);

assert.match(css, /#n8n-chat\s+\.chat-window[\s\S]*?border-radius:\s*24px/i);
assert.match(css, /#n8n-chat[\s\S]*?background:\s*#0b1637/i);
assert.match(css, /#n8n-chat[\s\S]*?:focus-visible[\s\S]*?outline/i);
assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*?max-width:\s*calc\(100vw\s*-\s*24px\)/i);
assert.doesNotMatch(css, /#n8n-chat[\s\S]*?4f46e5/i);
assert.match(component, /className="chatbot-state chatbot-state--loading"/);
assert.match(component, /className="chatbot-state chatbot-state--error"/);
assert.match(component, /aria-live="polite"/);

console.log('Chatbot visual contract passed.');
```

- [ ] **Step 2: Add the command and verify red**

Add the script entry below to the `scripts` object in `package.json`:

```json
"test:chatbot-theme": "node test-chatbot-theme.mjs"
```

Run: `npm run test:chatbot-theme`

Expected: the command fails because the current stylesheet uses a 20px chat radius, a `#4f46e5` gradient, and the component does not yet expose the state classes.

- [ ] **Step 3: Commit the red contract**

```powershell
git add package.json test-chatbot-theme.mjs
git commit -m "test: define chatbot visual contract"
```

### Task 2: Apply the Modern Academic n8n chat surface

**Files:**
- Modify: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/src/components/chat/ChatBot.css`
- Test: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/test-chatbot-theme.mjs`

**Interfaces:**
- Consumes: n8n-generated elements beneath `#n8n-chat` and the existing `.chat-feedback-*` elements.
- Produces: a desktop and mobile-safe visual override without altering chat DOM creation or message delivery.

- [ ] **Step 1: Replace the current gradient-based chat rules with the following foundation**

Keep the existing font import and print rule. Replace the chat-window, header, message-body, bot/user-message, composer, send-button, launcher, and responsive rules with these values:

```css
#n8n-chat .chat-window,
#n8n-chat .n8n-chat__window {
  width: min(25rem, calc(100vw - 2rem)) !important;
  max-height: min(44rem, calc(100dvh - 2rem)) !important;
  border: 1px solid rgba(11, 22, 55, 0.12) !important;
  border-radius: 24px !important;
  box-shadow: 0 24px 56px rgba(11, 22, 55, 0.22) !important;
  overflow: hidden !important;
  font-family: 'Noto Sans Thai', sans-serif !important;
}

#n8n-chat .chat-window-header,
#n8n-chat .n8n-chat__window--header {
  position: relative !important;
  background: #0b1637 !important;
  padding: 1.15rem 1.35rem 1rem !important;
}

#n8n-chat .chat-window-header::after,
#n8n-chat .n8n-chat__window--header::after {
  content: '' !important;
  position: absolute !important;
  right: 1.35rem !important;
  bottom: 0 !important;
  left: 1.35rem !important;
  height: 2px !important;
  background: #38bdf8 !important;
  opacity: 0.9 !important;
}

#n8n-chat .chat-window-header h1,
#n8n-chat .chat-window-header .title,
#n8n-chat [class*="chatWindowHeader"] h1,
#n8n-chat [class*="chatWindowHeader"] [class*="title"] {
  color: #fff !important;
  font-size: 1.18rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.025em !important;
  line-height: 1.3 !important;
}

#n8n-chat .chat-window-header p,
#n8n-chat .chat-window-header .subtitle,
#n8n-chat [class*="chatWindowHeader"] p,
#n8n-chat [class*="chatWindowHeader"] [class*="subtitle"] {
  color: rgba(255, 255, 255, 0.72) !important;
  font-size: 0.84rem !important;
  line-height: 1.55 !important;
}

#n8n-chat .chat-messages-list,
#n8n-chat [class*="chatMessages"],
#n8n-chat [class*="messages"] {
  background: #f5f8fc !important;
  padding: 1.1rem !important;
  gap: 0.85rem !important;
}

#n8n-chat [class*="botMessage"],
#n8n-chat .chat-message-bot,
#n8n-chat [data-role="bot"] {
  max-width: 86% !important;
  background: #fff !important;
  border: 1px solid rgba(11, 22, 55, 0.09) !important;
  border-radius: 14px 14px 14px 4px !important;
  box-shadow: none !important;
  color: #172554 !important;
}

#n8n-chat [class*="userMessage"],
#n8n-chat .chat-message-user,
#n8n-chat [data-role="user"] {
  max-width: 82% !important;
  background: #1769aa !important;
  border-radius: 14px 14px 4px 14px !important;
  box-shadow: 0 6px 16px rgba(23, 105, 170, 0.2) !important;
  color: #fff !important;
}

#n8n-chat [class*="input"],
#n8n-chat .chat-input,
#n8n-chat [class*="inputArea"] {
  background: #fff !important;
  border-top: 1px solid rgba(11, 22, 55, 0.1) !important;
  padding: 0.9rem 1rem 1rem !important;
}

#n8n-chat textarea,
#n8n-chat input[type="text"] {
  min-height: 3rem !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 14px !important;
  background: #f8fafc !important;
  color: #172554 !important;
}

#n8n-chat textarea:focus-visible,
#n8n-chat input[type="text"]:focus-visible,
#n8n-chat button:focus-visible,
.chat-feedback-banner button:focus-visible {
  outline: 3px solid rgba(56, 189, 248, 0.55) !important;
  outline-offset: 2px !important;
}

#n8n-chat [class*="sendButton"],
#n8n-chat button[type="submit"],
#n8n-chat [class*="send"] button {
  background: #1769aa !important;
  border-radius: 12px !important;
  box-shadow: none !important;
}

#n8n-chat [class*="sendButton"]:hover,
#n8n-chat button[type="submit"]:hover {
  background: #0f5a94 !important;
  transform: translateY(-1px) !important;
}

#n8n-chat [class*="sendButton"]:active,
#n8n-chat button[type="submit"]:active {
  transform: translateY(0) scale(0.98) !important;
}

@media (max-width: 480px) {
  #n8n-chat .chat-window,
  #n8n-chat .n8n-chat__window {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100dvh - 24px) !important;
    border-radius: 20px !important;
  }
}
```

- [ ] **Step 2: Preserve and align the feedback banner**

Within the existing `.chat-feedback-*` rules, change the banner background to `#ffffff`, border to `rgba(11, 22, 55, 0.12)`, title color to `#172554`, and shadow to `0 18px 42px rgba(11, 22, 55, 0.18)`. Keep its existing trigger, actions, dismiss behavior, and mobile placement; do not modify `FeedbackBanner.tsx`.

- [ ] **Step 3: Run the visual contract**

Run: `npm run test:chatbot-theme`

Expected: `Chatbot visual contract passed.`

- [ ] **Step 4: Commit the CSS surface**

```powershell
git add src/components/chat/ChatBot.css test-chatbot-theme.mjs package.json
git commit -m "feat(chat): apply modern academic visual surface"
```

### Task 3: Bring loading and connection-error states into the same visual system

**Files:**
- Modify: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/src/components/chat/ChatBot.tsx`
- Modify: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/src/components/chat/ChatBot.css`
- Test: `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/test-chatbot-theme.mjs`

**Interfaces:**
- Consumes: existing `dataIsLoading`, `isInitializing`, and `chatError` values.
- Produces: semantic `role` and `aria-live` state announcements; no change to error creation or chat initialization.

- [ ] **Step 1: Update the loading return in `ChatBot.tsx`**

Replace the existing loading JSX with:

```tsx
return (
  <div className="chatbot-state chatbot-state--loading" role="status" aria-live="polite">
    <div className="chatbot-state__panel">
      <span className="chatbot-state__eyebrow">IT COURSE ASSISTANT</span>
      <div className="chatbot-state__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>กำลังเตรียมผู้ช่วยแนะนำหลักสูตร</p>
    </div>
  </div>
);
```

- [ ] **Step 2: Update the error return in `ChatBot.tsx`**

Replace the existing yellow warning-card JSX with:

```tsx
return (
  <div className="chatbot-state chatbot-state--error" role="alert">
    <div className="chatbot-state__panel">
      <span className="chatbot-state__eyebrow">IT COURSE ASSISTANT</span>
      <h3>ยังเชื่อมต่อผู้ช่วยไม่ได้</h3>
      <p>{chatError}</p>
      <p className="chatbot-state__hint">โปรดลองใหม่อีกครั้งในภายหลัง หรือติดต่อผู้ดูแลระบบ</p>
    </div>
  </div>
);
```

- [ ] **Step 3: Add the state styles to the bottom of `ChatBot.css` before the print rule**

```css
.chatbot-state {
  display: grid;
  min-height: 18rem;
  place-items: center;
  padding: 1.5rem;
  font-family: 'Noto Sans Thai', sans-serif;
}

.chatbot-state__panel {
  width: min(100%, 25rem);
  border: 1px solid rgba(11, 22, 55, 0.12);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(11, 22, 55, 0.12);
  color: #172554;
  padding: 1.5rem;
  text-align: center;
}

.chatbot-state__eyebrow {
  color: #1769aa;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.chatbot-state__panel h3 {
  margin: 0.65rem 0 0.4rem;
  font-size: 1.2rem;
}

.chatbot-state__panel p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.chatbot-state__hint {
  margin-top: 0.85rem !important;
  color: #64748b !important;
  font-size: 0.86rem;
}

.chatbot-state__skeleton {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}

.chatbot-state__skeleton span {
  height: 0.65rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #e8eef7 25%, #f7faff 50%, #e8eef7 75%);
  background-size: 200% 100%;
  animation: chatbotSkeleton 1.35s ease-in-out infinite;
}

.chatbot-state__skeleton span:nth-child(2) { width: 82%; justify-self: center; }
.chatbot-state__skeleton span:nth-child(3) { width: 64%; justify-self: center; }

@keyframes chatbotSkeleton {
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .chatbot-state__skeleton span,
  #n8n-chat .chat-window {
    animation: none !important;
  }
}
```

- [ ] **Step 4: Verify the contract and production build**

Run: `npm run test:chatbot-theme`

Expected: `Chatbot visual contract passed.`

Run: `npm run build`

Expected: Vite completes with `✓ built` and no TypeScript compile error.

- [ ] **Step 5: Perform the manual responsive check**

Run: `npm run dev -- --host 127.0.0.1`

Open the app, launch chat, and verify these states at 1440px and 320px viewport widths:

1. Header title and subtitle stay visible without occupying more than roughly one-quarter of the chat window.
2. Bot and user bubbles remain readable and aligned to opposite sides.
3. Keyboard Tab reveals a focus ring on the composer and send button.
4. The composer remains visible above the feedback banner.
5. Temporarily set `VITE_N8N_WEBHOOK_URL` to an unavailable local endpoint, reload, and verify the error panel copy and layout; restore the environment value without committing it.

- [ ] **Step 6: Commit the completed state treatment**

```powershell
git add src/components/chat/ChatBot.tsx src/components/chat/ChatBot.css test-chatbot-theme.mjs package.json
git commit -m "feat(chat): refine loading and error states"
```

## Plan self-review

- Spec coverage: Tasks 2 and 3 cover the compact header, CI palette, reading hierarchy, composer, responsive behavior, focus styles, feedback alignment, loading, and error states. The n8n workflow and data paths are explicitly untouched.
- Placeholder scan: No deferred requirements or unspecified implementation steps remain.
- Type consistency: No new application interfaces are introduced; state classes are asserted by the static contract and are defined by Task 3.
