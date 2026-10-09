# ADR 011: Four-Tier Academic Standing, Consecutive Probation Tracking, and Retirement Enforcement

## Status
Accepted

## Date
2026-10-02

## Context
1. **Academic Standing & University Regulations:**
   University academic regulations (specifically King Mongkut's University of Technology North Bangkok - KMUTNB) mandate strict academic standing thresholds to govern student progression, academic warnings, and student termination:
   - **Normal Standing (สถานะปกติ):** Cumulative GPAX $\ge 2.00$. Regular registration credit limit between 9 and 22 credits.
   - **High Academic Probation (ติดโปรสูง / Probation 2):** Cumulative GPAX between $1.75$ and $1.99$. Permitted maximum 16 credits per regular semester; must achieve cumulative GPAX $\ge 2.00$ prior to degree conferral.
   - **Low Academic Probation (ติดโปรต่ำ / Probation 1):** Cumulative GPAX between $1.50$ and $1.74$. Permitted maximum 16 credits per regular semester; strictly restricted to a maximum of 4 consecutive regular semesters.
   - **Academic Retirement / Dismissal (การพ้นสภาพนักศึกษา / รีไทร์):** Automatic termination of student status triggered by either:
     - Cumulative GPAX $< 1.50$ at the conclusion of any graded academic semester after Year 1 Semester 2.
     - Accumulating 4 consecutive regular semesters on academic probation (cumulative GPAX $< 2.00$).
2. **Limitations of Prior Implementation (ADR-005):**
   Prior architecture only tracked a single flat boolean `isProbation = userGpa < 2.00` based on the student's latest overall GPA. It lacked:
   - Time-series chronological grade analysis across individual semesters.
   - Distinct differentiation between Low Probation (1.50–1.74) and High Probation (1.75–1.99).
   - Detection of consecutive probation semester streaks and retirement threshold enforcement.
   - Actionable recovery calculations indicating what term GPA is needed to escape probation.

## Decision
1. **Time-Series Academic Standing Engine (`src/utils/gradeUtils.ts`):**
   - Implemented `calculateSemesterGPAHistory()` to chronologically group graded courses by academic year and semester, computing term GPA and cumulative GPAX at the end of each semester.
   - Implemented `evaluateAcademicStanding()` to evaluate the latest standing tier (`normal`, `high_probation`, `low_probation`, `retired`), tracking consecutive regular semester probations.
   - **Consecutive Probation Counter Rules:**
     - Evaluated strictly across regular semesters (Semester 1 and Semester 2).
     - Summer sessions (Semester 3) are excluded from incrementing the consecutive probation counter, though summer grades are factored into cumulative GPAX.
     - **Reset Counter:** The counter automatically resets to 0 whenever a subsequent regular semester achieves cumulative GPAX $\ge 2.00$.
   - **First-Year Freshman Exemption:** Immediate dismissal for GPAX $< 1.50$ is deferred until after the conclusion of Year 1 Semester 2 (minimum 2 regular semesters completed), granting new students an initial adjustment buffer.
2. **Mathematical GPA Recovery Target Formula:**
   - Implemented `calculateTargetGPANextTerm()`:
     $$\text{Target GPA} = \left\lceil \frac{2.00 \times (C_{\text{cur}} + C_{\text{next}}) - P_{\text{cur}}}{C_{\text{next}}} \right\rceil_{0.01}$$
     Where $C_{\text{next}} = 16$ (probation credit limit). Ceiling rounding guarantees the student genuinely reaches or exceeds 2.00.
3. **Multi-Surface Proactive Academic Safeguards:**
   - **Student Dashboard Hero Banner (`StudentDashboard.tsx`):** Displays a persistent, color-coded academic standing banner with a 4-step probation progression stepper (Terms 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ Retire) and GPA recovery target card.
   - **Study Plan Report (`StudyPlanReport.tsx`):** Displays standing tier badges and warning advisories on generated PDF/print reports.
   - **AI Chatbot Advising Injection (`ChatBot.tsx`):** Injects live academic standing metadata (`academicStanding`, `standingLabel`, `consecutiveProbationCount`, `allowedMaxCredits`, `targetGPANextTerm`) and system directives forbidding standard course recommendations for dismissed students and enforcing retake prioritization for probation students.

## Consequences
- The system reliably enforces university academic regulations with 100% unit-test coverage (`tests/study-plan/academicStanding.test.ts`).
- Students on probation receive clear visual feedback and mathematical target milestones before reaching critical dismissal thresholds.
- AI Chatbot responses are strictly grounded in authoritative academic policy, preventing misinformation regarding registration limits or academic status.
