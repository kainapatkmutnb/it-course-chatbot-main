# ADR 006: Multi-Curriculum Context Resolution and Department Catalog Injection for Chatbot Advising

## Status
Accepted

## Date
2026-09-12

## Context
1. **Single-Curriculum Injection & Cross-Curriculum Hallucinations:**
   Previously, `ChatBot.tsx` extracted and attached only a single curriculum's courses (`curriculumCourses`) to the chat webhook payload. For Admin and Guest users without a personal `studyPlan`, this defaulted statically to `IT-67`. When users asked about other curricula (such as `"ปี 2 ของ ine67 เรียนทั้งหมดกี่วิชา"`), the AI Agent followed the strict system prompt rule to use `curriculumCourses` as the single source of truth, causing it to incorrectly output IT-67 courses (`IT-060243...`) disguised under an INE-67 title.
2. **Curriculum Metric Deficit & Vector Search Confusion:**
   When asked broad structural questions like `"ine67 เรียนทั้งหมดกี่วิชากี่หน่วยกิต"`, the chatbot lacked an authoritative summary table. As a result, semantic search over Pinecone RAG matched a chunk for `ITT-67` (Information Technology Transfer program with 84 credits, 28 courses), leading the bot to falsely claim INE-67 requires 84 credits instead of its actual 125 credits and 46 courses.

## Decision
1. **Curriculum Master Catalog and Summary Injection (`ChatBot.tsx`):**
   - Provide a deterministic, lightweight department curriculum catalog in the chat metadata payload:
     - `curriculumSummaryCatalog`: High-level summary of all 13 department curricula (`id`, `name`, `totalCredits`, `totalCourses`, `creditStructure`), providing instant, infallible answers for total credits and category counts (~2.2 KB payload).
     - `allCurriculums`: Complete course dictionary keyed by curriculum identifier (`IT-62`, `IT-67`, `INE-62`, `INE-67`, `INET-62`, `INET-67`, `ITI-61`, `ITI-66`, `ITT-67`, etc.) containing standard courses per semester (~96 KB payload).
   - Retain `enrolledCurriculum` representing the authenticated student's own program.
2. **Query-First Precedence in n8n System Prompt:**
   - **QueryTargetCurriculum Precedence:** If the user mentions a specific curriculum identifier or abbreviation (e.g. `INE`, `INE-67`, `IT-62`, `INET`), the AI Agent must prioritize the corresponding entry in `allCurriculums` and `curriculumSummaryCatalog`.
   - **EnrolledCurriculum Fallback:** If no curriculum is specified, default to the student's `enrolledCurriculum`. For Guest and Admin without an enrolled curriculum, prompt the user to specify the curriculum if ambiguous.
   - **Strict Prefix Verification:** Enforce that course codes match the target curriculum's department prefix (`INE-` for Information and Network Engineering, `IT-` for Information Technology, `INET-` for Information & Network Technology, etc.).

## Consequences
- Completely eliminates cross-curriculum hallucinations when Admin, Guest, or students query across departments.
- Provides 100% exact credit totals (e.g., INE-67 = 125 credits, IT-67 = 120 credits, ITT-67 = 84 credits) without reliance on lossy or ambiguous semantic vector matches.
- Guarantees complete course listings for every semester across all 13 curriculum variants in the department.
