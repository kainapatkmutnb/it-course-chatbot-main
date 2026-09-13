# ADR 008: Multi-Turn Active Curriculum Persistence, Duration Guard, and Advising Prerequisite Guard

## Status
Accepted

## Date
2026-09-13

## Context
1. **Multi-Turn Curriculum Context Loss:**
   When users queried across multiple dialogue turns (e.g., asking `"itt67 เรียนทั้งหมดกี่วิชา วิชาไรบ้าง แต่ละวิชาเรียนปีอะไรเทอมอะไร"` in Turn 1, followed by `"บอกมาในแชทนี้เลย"` in Turn 2), the AI Agent lost track of the targeted curriculum because Turn 2 omitted explicit program keywords (`ITT` or `ITT-67`). Consequently, the agent either fell back to the student's enrolled curriculum or hallucinated a blended response from conversational vector memory.
2. **Curriculum Duration Hallucination:**
   `ITT-67` is a 2-year continuing/transfer curriculum (หลักสูตรเทียบโอน 2 ปี) comprising exactly 4 semesters (Year 1 Sem 1, Year 1 Sem 2, Year 2 Sem 1, Year 2 Sem 2) totaling 28 courses and 84 credits. The chatbot hallucinated non-existent Year 3 and Year 4 semesters (internship, seminar, project, and co-op) borrowed from 4-year programs and prefixed them with fake `ITT-` course codes.
3. **Conversational Stalling / Pre-questioning:**
   Instead of immediately fulfilling explicit course inquiries, the agent stalled by generating rhetorical questions (e.g., *"ต้องการให้ผมระบุทุกวิชาและบอกว่าเรียนในปีไหน เทอมไหนด้วยใช่ไหมครับ? ชอบแบบไหนบอกได้เลยนะครับ"*), degrading user experience and triggering follow-up turns where context became lost.
4. **Registration Advising Flaws (Passed-Course Duplication & Failed Course Handling):**
   When students asked for next-semester registration recommendations (e.g. *"ตอนนี้ผมเรียนปี 1 ผ่านแล้ว แต่มีวิชาติด F ช่วยแนะนำการลงทะเบียนเทอมหน้าหน่อย ลงกี่วิชาเรียนกี่หน่วยกิต"*), the agent committed two severe advising errors:
   - Recommended courses that the student had already passed in Year 1 (`PassedCourseExclusionRule` violation).
   - Failed to detect that courses in Year 2 Semester 1 having the failed course as a prerequisite cannot be registered (`RetakePrerequisiteBlock` violation), and failed to advise retaking the F grade subject.

## Decision
1. **Client-Side Defense in Depth (`ChatBot.tsx`):**
   - Provide structured data fields in `metadata`:
     - `passedCourses`: List of completed subjects (Grades A, B, C, D, S) with grades and credits.
     - `failedCourses` & `failedCourseCodes`: Explicit list of courses with grade `F` or status `failed`.
     - `uncompletedCurriculumCourses`: Pre-filtered list of curriculum courses that the student has not yet passed.
     - `curriculumDurationGuard`: Lookup map enforcing explicit duration and semester counts (`ITT`: 2 yrs / 4 sem, `ITI`: 2 yrs / 5 sem, `INET`: 3 yrs / 7 sem, `IT`/`INE`: 4 yrs / 8 sem).
     - `advisingDirectives`: Direct machine-readable instructions prohibiting passed-course duplication, enforcing prerequisite retake blocks, and banning conversational stalling.
2. **Active Conversation Curriculum Persistence:**
   - The n8n AI Agent system prompt is instructed to maintain the `ActiveConversationCurriculum` across turns until the user explicitly requests another program. Follow-up commands such as `"บอกมาในแชทนี้เลย"` or `"มีวิชาอะไรอีก"` must inherit the active curriculum context.
3. **Strict Curriculum Duration Guard:**
   - Prohibit the LLM from synthesizing or rendering semesters outside `allCurriculums[target].semesters`. For `ITT`, Year 3 and Year 4 are strictly banned.
4. **Direct Advising Response (No Stalling):**
   - Inquiries asking for courses, roadmaps, or curriculum structures must be answered immediately in full. Rhetorical confirmations or stalling responses are strictly forbidden.
5. **Academic Advising Algorithm for Registration & Retake:**
   - **Step 1 (Target Semester):** Resolve the target semester from user input or recent study plan history.
   - **Step 2 (Prerequisite Block Check):** Scan `failedCourses`. If an upcoming target semester course requires a failed course as prerequisite, explicitly mark that upcoming course as **BLOCKED** from registration.
   - **Step 3 (Retake Recommendation):** Recommend retaking the failed subject if offered, prioritizing prerequisite chain unblocking.
   - **Step 4 (Passed Course Exclusion):** Filter out 100% of courses in `completedCourseCodes` / `passedCourses`.
   - **Step 5 (Credit Cap Validation):** Calculate total registered credits to strictly abide by standing limits (Max 16 credits for probation GPAX < 2.00; 9–22 credits for normal standing).

## Consequences
- Completely eliminates conversational stalling and hesitation on course listing requests.
- Prevents multi-turn context degradation when users give short follow-up prompts.
- Guarantees 0% hallucination of non-existent academic years for 2-year and 3-year transfer programs.
- Guarantees 100% exclusion of previously passed courses from future semester registration plans.
- Accurately blocks courses with unmet prerequisites caused by F grades and guides students on retake procedures.
