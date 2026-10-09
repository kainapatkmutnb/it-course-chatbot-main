# Current-System Draw.io Diagram Design

## Goal

Replace the four diagrams in `diagrams/diagrams2` with source-audited Draw.io diagrams and embedded-source PNG exports, then align the architecture section of `README.md` with the same current runtime model.

## Chosen approach

Use a balanced, source-audited view: show enough implementation detail to explain the real system without turning each image into a file inventory. This is preferred over either a high-level conceptual view, which would hide important runtime behavior, or an exhaustive module graph, which would create crowded edges and unreadable labels.

## Shared visual system

- White, opaque canvas compliant with ADR-007.
- 3200 px-wide retina PNG exports with embedded Draw.io source.
- Thai-first labels with concise English technical terms where useful.
- Navy for people/application entry points, cyan for UI, teal for domain logic, amber for Firebase, violet for AI services, and rose for data stores.
- Orthogonal connectors routed through dedicated gutters. Connectors must not cross nodes, labels, or unrelated connectors.
- Short edge labels placed in whitespace; include a small legend on every diagram.
- Use Sukhumvit Set or a safe Thai sans-serif fallback and keep body text readable at README width.

## Diagram designs

### 1. Context diagram

Use a left-to-right C4-style layout:

1. Actors: Guest, Student, Instructor, Staff, and Admin.
2. IT Assistant browser SPA: public catalog, role dashboards, study-plan/progress, course management, and advising chatbot.
3. External systems:
   - Firebase Authentication and Realtime Database.
   - n8n AI/RAG workflow.
   - Supporting n8n services: Pinecone, GPT-5 nano, OpenAI Embeddings, Cohere Reranker, Simple Memory, and Google Drive ingestion.

The diagram must not call the active database Firestore.

### 2. Component diagram

Use four horizontal layers:

1. Application shell and role routing.
2. Feature components: curriculum/course views, study-plan views, dashboards, chatbot, and feedback.
3. Domain/data-access modules: `firebaseService`, `courseService`, `hybridCourseService`, static curriculum/rule catalogs, study-plan identity/view-model, grade and export utilities, and `chatLogService`.
4. External runtime: Firebase Auth, RTDB, and n8n.

Show the hybrid curriculum rule explicitly: curriculum-specific RTDB data overrides general RTDB course data, which overrides/falls back to the static master catalog.

### 3. Data-flow diagram

Use DFD Level 1 with five processes and five grouped stores:

- P1 Authentication, profile, and role routing.
- P2 Course and curriculum management.
- P3 Study plan, prerequisite validation, grades, and progress.
- P4 AI advising chat and curriculum-context injection.
- P5 Audit, chat analytics, and feedback administration.
- D1 `users/{uid}`.
- D2 `courses/{id}` plus `curriculum/{program}/{curriculumYear}/{year}/{semester}/courses/{id}`.
- D3 `studyPlans/{pushId}`.
- D4 `auditLogs/{pushId}`.
- D5 `chatLogs/{pushId}` plus `chatFeedback/{pushId}`.

Show that n8n writes `chatLogs`, while the frontend writes `chatFeedback`. Annotate that checked-in RTDB rules do not currently declare `chatFeedback` so the documentation reports the implementation honestly.

### 4. Sequence diagram

Use one representative student session from sign-in through advising, divided into clearly separated phases:

1. Email/Google authentication, domain validation, user-profile read/create, audit log, and role routing.
2. Study-plan load plus hybrid curriculum merge and progress projection.
3. Optional grade edit: prerequisite cascade validation, GPA/credit calculation, and RTDB update.
4. Chat: build curriculum/standing metadata, n8n retrieval and reasoning, n8n chat-log write, answer return, periodic feedback, and frontend feedback write.

Use dashed return messages and shaded phase bands; no message line may overlap another label.

## README changes

- Keep a concise architecture overview and embed all four final PNGs from `diagrams/diagrams2`.
- Correct all architecture references from Firestore to Realtime Database where they describe the active implementation.
- Replace snake_case or invented paths with the exact camelCase RTDB paths.
- Explain 13 rule-catalog variants versus 9 Pinecone retrieval namespaces.
- State the hybrid curriculum precedence and the actual owner of chat-log/feedback writes.
- Preserve unrelated README content.

## Verification

- Parse each `.drawio` XML file successfully.
- Confirm each `.drawio.png` contains embedded Draw.io XML and has an opaque white background.
- Render and visually inspect all four images for clipping, collisions, crossings, and legibility.
- Search README and diagram sources for stale `Firestore`, `study_plans`, `chat_analytics`, and `logFeedback` claims.
- Run the relevant documentation/build sanity checks without changing application behavior.

## Scope

This work changes architecture documentation only. It does not alter application code, Firebase rules, n8n workflow behavior, or production data.
