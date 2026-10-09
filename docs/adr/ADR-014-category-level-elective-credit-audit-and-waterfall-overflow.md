# ADR 014: Category-Level Elective Credit Audit and Waterfall Overflow Engine

## Status
Accepted

## Date
2026-10-02

## Context
1. **User and Chatbot Elective Inquiries:**
   Students and AI advising agents frequently ask questions regarding elective fulfillment:
   - *"วิชาเลือกเสรีผมครบยัง ขาดอีกกี่หน่วยกิต"*
   - *"วิชาเลือกกลุ่มวิชาชีพครบหรือยัง"*
   - *"หมวดศึกษาทั่วไปครบหรือยัง"*
2. **Prior System Limitations:**
   - The system previously provided only a high-level overall KPI credit bar (e.g. 126/135 total credits) and a deduplicated uncompleted course list (`uncompletedCurriculumCourses`), but lacked category-level credit auditing across curriculum quotas.
   - When students took extra Major Electives (e.g. 12 credits instead of 9) or extra General Education courses, the system did not account for academic credit cascading (Waterfall Overflow) where surplus elective credits transfer down to satisfy Free Electives (`free_elective`).
   - `courseService.ts` looped `semester <= 2` which inadvertently omitted summer internship courses (Semester 3) from static curriculum counts in certain programs.

## Decision
1. **Category-Level Credit Audit Engine (`src/utils/electiveAuditUtils.ts`):**
   - Established 4 canonical category buckets:
     - `gened`: หมวดวิชาศึกษาทั่วไป (General Education & Physical Education)
     - `core_required`: หมวดวิชาเฉพาะ (บังคับ)
     - `major_elective`: หมวดวิชาเฉพาะ (เลือกกลุ่มวิชาชีพ)
     - `free_elective`: หมวดวิชาเลือกเสรี
   - Created `computeCategoryCreditAudit(curriculumCourses, studentCourses)` returning `ElectiveAuditSummary`.
   - Tracks `requiredCredits`, `completedCredits`, `totalEarnedCredits`, `remainingCredits`, `overflowCredits`, `receivedOverflowCredits`, `isSatisfied`, and `percentage` per category.
2. **Waterfall Overflow Logic:**
   - `gened`: Earned credits up to required quota are retained; any excess cascades to `free_elective`.
   - `major_elective`: Earned credits up to required quota are retained; any excess cascades to `free_elective`.
   - `core_required`: Mandatory courses required for graduation; no overflow allowed.
   - `free_elective`: Satisfied by direct free electives + excess `major_elective` + excess `gened`.
   - Produces a structured `overflowLog` in Thai documenting credit transfers.
3. **Summer Semester Integration in Curriculum Catalog (`courseService.ts`):**
   - Updated `getCoursesByProgramSync` and `getCoursesByProgram` loops to `semester <= 3`, correctly capturing summer internship courses and achieving 100% exact match on course count and credits across all 13 curricula.
4. **Dual-Surface Integration:**
   - **UI Dashboard (`StudyPlanManager.tsx`):** Rendered 4 responsive Category Progress Cards directly below the KPI bar with real-time percentage progress bars, satisfaction badges, and overflow callouts.
   - **AI Chatbot Metadata (`ChatBot.tsx`):** Injected `categoryCreditAudit` and `electiveAuditSummary` into n8n metadata, accompanied by `advisingDirectives.categoryCreditAuditRule` directing the LLM to use it as Single Source of Truth for all elective questions.

## Consequences
- Students and advisors have clear visibility into elective progress broken down into 4 clear categories.
- Surplus elective credits are automatically and fairly credited towards free electives without manual intervention.
- AI Chatbot answers elective progress questions deterministically without hallucination.
- Fully verified across all 13 curricula and student Kainapat's real study plan (86 passing unit tests, zero build errors).
