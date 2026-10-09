# Alert Timeout Progress QA

Date: 2026-09-13
Browser: Not run; Chrome and in-app browser control were unavailable in this session
Scope: Toast alerts, Login/Register inline errors, and chat feedback thank-you banner

## Automated Checks

| Check | Result | Notes |
|---|---|---|
| Baseline `npm run build` | Failed before changes | Sandbox denied esbuild access to parent directory while loading `vite.config.ts`; rerun with elevated permission after implementation. |
| Baseline `npm run lint` | Failed before changes | Existing repo-wide lint debt: 108 errors and 29 warnings, mainly `any`, hook deps, empty object interfaces, and `require()`. |
| Focused alert files lint | Passed | `npx eslint src/hooks/use-alert-countdown.ts src/components/ui/alert-timeout-progress.tsx src/components/ui/toaster.tsx src/hooks/use-toast.ts src/pages/Login.tsx src/pages/Register.tsx src/components/chat/FeedbackBanner.tsx` passed after replacing pre-existing `any` handlers in Login/Register with `unknown`. |
| Production build | Passed | `npm run build` passed with elevated permission. Vite reported existing chunk-size and dynamic/static import warnings. |
| TypeScript check | Passed | `npx tsc --noEmit` completed without errors. |
| Repo-wide lint | Failed with baseline debt | After this change the full lint count is 104 errors and 29 warnings; no focused alert-file lint errors remain. |

## Scenario Checklist

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Success toast | Emerald progress strip; 5s then closes | Covered by shared `TimedToast` implementation; browser QA not run | Not run |
| Error toast | Rose progress strip; 5s then closes | Covered by shared `TimedToast` implementation; browser QA not run | Not run |
| Warning toast | Amber progress strip; 5s then closes | Covered by shared `TimedToast` implementation; browser QA not run | Not run |
| Info/default toast | Blue progress strip; 5s then closes | Covered by shared `TimedToast` implementation; browser QA not run | Not run |
| Custom 2000ms toast | Half strip around 1s; closes around 2s | Duration is passed into shared countdown; browser QA not run | Not run |
| `duration: 0`, negative, or `Infinity` toast | No progress strip and no auto-dismiss | Hook returns `null` for non-positive or infinite duration; browser QA not run | Not run |
| `duration: undefined` / `NaN` toast | Uses default 5s countdown | `TimedToast` resolves both to 5000ms; browser QA not run | Not run |
| Hover / keyboard focus | Countdown keeps running; action/close remain usable | Radix timer is disabled and countdown uses elapsed time; browser QA not run | Not run |
| Return to tab before deadline | Remaining width follows elapsed real time | Hook refreshes on `visibilitychange` and `focus`; browser QA not run | Not run |
| Return to tab after deadline | Alert closes once browser resumes JavaScript | Hook checks the deadline on timeout, animation frame, visibility, and focus; browser QA not run | Not run |
| Close button / swipe | Closes immediately and cleans timer | Existing `onOpenChange` dismiss path remains; hook cleanup runs on unmount/open=false; browser QA not run | Not run |
| Toast replaced at second 4 | New toast starts full and old timer cannot close it | Countdown is mounted per toast id and old fallback timer was removed; browser QA not run | Not run |
| Update same toast id title/description | Countdown does not restart | Reset key is the toast id, not content; browser QA not run | Not run |
| Update same toast id duration | Countdown restarts with new duration | Duration is an effect dependency; browser QA not run | Not run |
| Login error | Rose strip counts down 5s and clears error | Login now uses shared countdown; browser QA not run | Not run |
| Register error changed | Strip and 5s countdown restart for new message | Register reset key is the error message; browser QA not run | Not run |
| Inline error cleared before timeout | Strip disappears and no stale callback fires | Hook cleanup runs when `active` becomes false; browser QA not run | Not run |
| Feedback save success | Emerald strip counts down 1.5s and dismisses banner | Feedback success now uses shared countdown; browser QA not run | Not run |
| Feedback idle or submit failure | No countdown strip is shown | Countdown is active only after `submittedFeedback` is set; browser QA not run | Not run |
| Static alerts / dialogs | No progress strip and no auto-dismiss | No static alert/dialog files were modified; browser QA not run | Not run |
| Mobile 375px, desktop, dark mode | Strip sits at bottom edge without covering text | CSS uses absolute bottom 3px strip; browser QA not run | Not run |
| Reduced motion | Strip updates in coarse steps while deadline stays the same | Hook throttles paints to about 250ms under reduced motion; browser QA not run | Not run |
| React StrictMode / unmount before deadline | No double dismissal or stale callback | Cleanup cancels timeout, frame, and listeners; browser QA not run | Not run |

## Implementation Notes

- `useAlertCountdown` owns both the remaining fraction and expiration callback for timed alerts.
- Radix Toast auto-dismiss is disabled with `duration={Infinity}` so toast progress and dismissal share one timer owner.
- The old `toast()` fallback timeout was removed; the existing remove queue still handles the 1000ms exit cleanup after dismissal.
- Static alerts, dialogs, and unused Sonner toasts are intentionally outside this countdown surface.
