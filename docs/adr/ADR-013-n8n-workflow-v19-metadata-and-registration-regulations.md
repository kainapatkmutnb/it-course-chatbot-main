# ADR 013: n8n Chatbot Workflow v19.19 Metadata Alignment and Academic Registration Rules

## Status
Accepted

## Date
2026-10-02

## Context
1. **Chatbot Advising Workflow Upgrade (n8n v19.19):**
   The AI advising workflow orchestrated via n8n was updated to version `v19.19`. The workflow relies on client-injected metadata as the Single Source of Truth for university academic policies, curriculum constraints, and student registration status.
2. **Discrepancies in Previous Frontend Metadata:**
   - **Summer Registration Limit:** Previous metadata set `summerSemester.maxCredits = 6`, whereas university regulations permit up to **9 credits** during the summer session.
   - **Consecutive Probation Naming:** The workflow standardizes on the canonical field `consecutiveBelow2Terms` (number of consecutive regular terms with cumulative GPAX < 2.00) while legacy systems expect `consecutiveProbationCount`.
   - **Rigid Probation Cap:** Prior implementation treated probation `maxCredits = 16` as a fixed scalar instead of a credit range `probationCreditRange: { min: 15, max: 16 }` with petition guidelines.
   - **Authorized Overload Flag:** Absence of `registrationCreditLimitAuthorized` flag prevented advising agents from identifying students who received dean-approved overloads.
   - **Study Mode Tracking:** The system lacked formal differentiation between Regular (`regular`: 9–22 credits) and Special/Evening (`special_evening`: 6–18 credits) program tracks.

## Decision
1. **Summer Session Credit Limit Updated to 9 Credits:**
   - Updated `registrationRules.summerSemester` in `ChatBot.tsx` to `maxCredits: 9` with note `'ภาคเรียนฤดูร้อนลงทะเบียนได้ไม่เกิน 9 หน่วยกิต'`.
   - Updated guest and advising status summaries across the application to reflect 9 credits.
2. **Canonical and Legacy Consecutive Term Tracking:**
   - Added `consecutiveBelow2Terms: number` to `AcademicStandingResult` in `src/utils/gradeUtils.ts` and populated in `evaluateAcademicStanding()`.
   - Maintained `consecutiveProbationCount` concurrently for backward compatibility.
   - Guaranteed non-null numeric values (0 fallback) across both student and guest profiles.
3. **Probation Credit Range Definition:**
   - Added `probationCreditRange: { min: 15, max: 16 }` to metadata and standing evaluations.
   - Maintained `allowedMaxCredits: 16` as the standard fallback cap.
4. **Authorized Registration Credit Limit Support:**
   - Added `registrationCreditLimitAuthorized: boolean` (default `false`) derived from `studyPlan` or `user` profile.
   - Injected `creditLimitSource: 'approved'` when `registrationCreditLimitAuthorized` is `true`.
5. **Study Mode Support (`regular` vs `special_evening`):**
   - Added `StudyMode = 'regular' | 'special_evening'` type in `src/types/auth.ts`.
   - Injected `studyMode` and `programType` into top-level metadata and `studentStanding`.
   - Enforced 9–22 credits for `regular` and 6–18 credits for `special_evening` (Summer $\le$ 9 for both).
6. **No Client-Side Intent Classification:**
   - All routing, reasoning, and intent classification remain strictly within n8n workflow v19.19; the client only provides clean, authoritative ground-truth metadata.

## Consequences
- The client-side metadata aligns 100% with the contract expected by n8n Workflow v19.19.
- Verified across all unit test cases (Cases A–G in `tests/study-plan/n8nWorkflowMetadata.test.ts`).
- Fully backward compatible with existing UI and data structures.
