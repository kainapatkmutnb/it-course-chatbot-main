# ADR 012: Curriculum Wildcard Deduplication and Prioritized Category-Quota Matching

## Status
Accepted

## Date
2026-10-02

## Context
1. **Curriculum Placeholders vs. Real Enrollments:**
   KMUTNB university curricula define elective quotas using wildcard course codes (e.g., `080xxxxxx` for General Education electives, `0602333xx` for Major electives, `xxxxxxxxx` for Free electives, and `080303xxx` for PE and Social Sciences electives). When students take actual courses, their transcripts register concrete course codes (such as `080303504` Golf, `060233308` Cloud Systems Engineering, or `080303601` Life and Environment).

2. **The Bug Reported by User:**
   When a student asked the chatbot: *"ผมเหลือวิชาที่ยังไม่ได้เรียนคือวิชาไร"*, the bot replied that the student had not completed 11 courses, 9 of which were wildcards:
   - `040203111` Engineering Mathematics I
   - `080xxxxxx` GenEd Elective 1
   - `080303xxx` PE & Recreation Elective
   - `040203112` Engineering Mathematics II
   - `xxxxxxxx` Free Elective 1
   - `080xxxxxx` GenEd Elective 2
   - `0602333xx` Major Elective 1
   - `0602333xx` Major Elective 2
   - `0602333xx` Major Elective 3
   - `080xxxxxx` GenEd Elective 3
   - `xxxxxxxx` Free Elective 2

   In reality, student Kainapat (INE-62) had passed 46 courses (123 credits) including all required electives (3 Major electives, 1 PE course, 3 GenEd electives, and 2 Free electives). However, because `ChatBot.tsx` relied on exact literal code string equality (`!completedCourseCodes.includes(c.code)`), concrete codes never matched wildcard placeholders, leaving all wildcards in `uncompletedCurriculumCourses`.

## Decision
1. **Deduplication Engine (`src/utils/curriculumDeduplicationUtils.ts`):**
   - **Wildcard Detection (`isWildcardCourseCode`):** Identifies wildcard codes containing placeholder patterns (`/x{2,}/i`).
   - **Elective Categorization (`categorizeElectiveCourse`):** Maps both curriculum placeholders and student electives into bucket types:
     - `pe`: Physical education courses (checks for keywords "กีฬา", "นันทนาการ", and code prefix `0803035`). Note: `080303xxx` is *not* blindly classified as `pe` because it also encompasses Social Sciences & Humanities.
     - `major_elective`: Major electives (checks for keywords "วิชาชีพ", "วิชาเลือก", and code prefixes `0602333`, `060xxxxxx`).
     - `gened`: General Education electives (checks for "ศึกษาทั่วไป", "สังคมศาสตร์", "มนุษยศาสตร์", "กลุ่มวิชาภาษา", and `080` prefix).
     - `free_elective`: Free electives (fallback and catch-all for any unconsumed courses).
   - **Prioritized Multi-Pass Matching (`computeUncompletedCurriculumCourses`):**
     - Step 1: Match concrete curriculum courses directly against passed courses (`passedCodesSet`).
     - Step 2: Pool all unmatched passed courses taken by the student.
     - Step 3: Satisfy specific wildcard slots in order of specificity:
       - **Pass 1 (PE):** Satisfy `pe` slots with `pe` courses in pool.
       - **Pass 2 (Major):** Satisfy `major_elective` slots with `major_elective` courses in pool.
       - **Pass 3 (GenEd):** Satisfy `gened` slots with `gened` courses in pool.
       - **Pass 4 (Free Elective):** Satisfy `free_elective` slots with any remaining courses in the pool.
     - Step 4: Any remaining unsatisfied wildcard slots are added to uncompleted courses.
     - Step 5: Sort uncompleted courses by academic year and semester for clean chronological advising.

2. **ChatBot Advising Injection (`ChatBot.tsx`):**
   - Integrated `computeUncompletedCurriculumCourses` to dynamically calculate `uncompletedCurriculumCourses`.
   - Injected directive `uncompletedCoursesAnsweringRule` to explicitly forbid repeating wildcards when electives are satisfied, and ground LLM answers in `uncompletedCurriculumCourses` as the Single Source of Truth.

## Consequences
- Unit tests (`tests/study-plan/curriculumDeduplication.test.ts`) verify that Kainapat's 10 curriculum wildcards are 100% satisfied and deducted.
- The AI Chatbot accurately states the true remaining courses (e.g. Math 1, Math 2, Project 2) rather than displaying placeholder strings.
- All 29 unit tests pass and production build succeeds without regressions.
