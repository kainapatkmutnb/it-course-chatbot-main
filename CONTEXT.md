# Ubiquitous Language & Domain Model

## Core Entities & Concepts

### Chatbot Advising Domain

- **ChatbotToggle**: The persistent minimalist floating action button (FAB) positioned at the bottom-right corner of the application interface (`bottom: 20px, right: 20px`), responsible for opening and closing the advising dialog window with smooth scaling and shadow hover interactions.
- **ChatWelcomeScreen**: The initial greeting screen presented to students prior to beginning a conversation. Contains introductory department metadata, conversation starters ("เริ่มการสนทนา"), and zero redundant third-party attributions (white-labeled).
- **FeedbackBanner**: A non-intrusive sentiment inquiry banner docked at the bottom of the active chat interface, triggered periodically every 5 user messages.
- **FeedbackScale**: A 3-point ordinal rating system ordered from negative to positive:
  1. `dislike` (👎 ไม่ชอบ)
  2. `neutral` (😐 ปานกลาง)
  3. `like` (👍 ชอบ)

### Academic & Curriculum Domain

**Personal Study Plan View (แผนของฉัน)**:
มุมมองรายวิชาของนักศึกษาตามภาคการศึกษา ชื่อ รหัส และผลการเรียนที่บันทึกไว้ อาจแตกต่างจากแผนแนะนำของหลักสูตร
_Avoid_: โครงสร้างหลักสูตรกลาง

**Curriculum Reference View (โครงสร้างหลักสูตร)**:
มุมมองลำดับรายวิชาและเงื่อนไขวิชาที่ต้องเรียนก่อนตามหลักสูตร ใช้เป็นข้อมูลอ้างอิงเมื่อเปรียบเทียบกับแผนของนักศึกษา
_Avoid_: ประวัติการเรียนจริงของนักศึกษา

- **Course**: An accredited academic subject containing course code (standard or custom), course name (Thai & English), credit weight, curriculum year, semester, prerequisites, and corequisites.
- **CoursePresentationFormat**: The standardized presentation pattern for mentioning academic courses across chatbot answers: `[รหัสวิชา] [ชื่อวิชาภาษาไทย]` (and optional credit weight), guaranteeing students never receive raw, ambiguous alphanumeric codes in isolation.
- **StudyPlan**: A student's registered 4-year academic roadmap detailing course progression, pass/fail status, and grade history.
- **AcademicStanding**: Student GPA and completed credits tracked for automated advising and credit cap validation.
- **RegistrationCreditLimit**: University credit bounds enforced per semester:
  - *Regular Semester (เทอม 1 & 2)*: Minimum 9 credits, Maximum 22 credits (exempt for final graduating term).
  - *Academic Probation (ติดวิทยาทัณฑ์)*: Maximum 16 credits; overload requires special exceptional approval petition.
  - *Summer Session (ภาคฤดูร้อน)*: Maximum 6 credits.
- **GraduationTermExemption**: Policy waiver allowing students in their expected final graduation semester to register for fewer than 9 credits.
- **ProbationPetition**: Special approval workflow required when a student on academic probation needs to register beyond 16 credits to satisfy compulsory graduation requirements or maintain status.
- **EnrolledCurriculum**: The specific academic degree curriculum bound to the authenticated student profile (e.g. `IT-67`, `INE-62`). For Admin or Guest users without an enrolled curriculum, this defaults to empty or general context.
- **QueryTargetCurriculum**: The intended curriculum inferred or explicitly specified in the user's inquiry (e.g. when an Admin, Guest, or IT student asks about `INE-67`). Must take precedence over `EnrolledCurriculum` when explicitly present.
- **CurriculumMasterCatalog**: The comprehensive department catalog containing all accredited curricula across 5 programs (`IT`, `INE`, `INET`, `ITI`, `ITT`) and 13 curriculum variants, ensuring deterministic access without lossy vector truncation.
- **CurriculumCoverageMatrix**: A structured matrix indexing the department's 5 programs (`IT`, `INE`, `INET`, `ITI`, `ITT`) across 13 accredited curriculum editions, documenting program durations, credit requirements, and curriculum cohorts.
- **CurriculumStructureSummary**: High-level credit and course metrics per curriculum (total credits, total course count, and credit breakdown across General Education, Core/Specialized, and Free Electives), preventing hallucinated credit calculations.
- **ActiveConversationCurriculum**: The active curriculum context preserved across multi-turn dialogs. When a user mentions a curriculum in Turn 1 and follows up with pronouns or short commands in Turn 2 (e.g. "บอกมาในแชทนี้เลย", "มีวิชาอะไรอีก"), this active curriculum persists until explicitly changed.
- **CurriculumDurationGuard**: Program-specific academic duration constraints (`ITT`: 2 years / 4 semesters, `ITI`: 2 years / 5 semesters, `INET`: 3 years / 7 semesters, `IT`/`INE`: 4 years / 8 semesters), strictly forbidding the synthesis of non-existent years (e.g. Year 3 or Year 4 for ITT transfer programs).
- **DirectAdvisingResponse**: The mandatory advising behavioral standard that prohibits conversational stalling, hedging, or confirmation pre-questions ("ต้องการให้ผมบอกไหมครับ?") when a user requests course listings or degree roadmaps.
- **AnswerScope**: The smallest set of facts that directly satisfies the user's explicit question. A full curriculum breakdown is in scope only when the user explicitly asks for all courses, a table, or detailed enumeration.
- **RetrievalEvidence**: The document identity and page location attached to a factual answer that used the curriculum knowledge base. It must originate from metadata on the retrieved content and must never be inferred or invented by the advisor.
- **PageGroundedChunk**: A retrievable portion of a curriculum document that retains both its source document identity and original PDF page number after splitting.
- **PassedCourseExclusionRule**: Strict negative constraint preventing any academic subject the student has already passed (recorded in `completedCourseCodes` or `passedCourses` with grades A, B, C, D, S) from being recommended in subsequent semester registration plans.
- **RetakePrerequisiteBlock**: Academic advising rule where a failed course (Grade F) is prioritized for retake, and any upcoming semester course dependent on that failed course as a prerequisite is strictly classified as blocked from registration until cleared.


### System Notification Domain

- **ToastNotification**: Ephemeral feedback message displayed in response to user actions (e.g., login, course updates, data deletion), rendered as a modern glassmorphic card with semantic status icons.
- **ToastViewport**: The top-right docked container (`top: 16px, right: 16px`) ensuring notifications remain visible and unobstructed by floating action elements such as the `ChatbotToggle`.

### Identity & Curriculum Persistence

- **Firebase Authentication Account**: The Firebase-managed identity that can sign in with an email and password. It is distinct from, and must not be confused with, the application's user profile.
- **User Profile**: The application record at `users/<uid>` in Realtime Database that stores a user's role and profile fields. Removing it alone does not remove the corresponding Firebase Authentication Account.
- **NonStudentRoleIsolation**: The architectural separation ensuring users with roles other than `student` (`admin`, `instructor`, `staff`, `guest`) are strictly excluded from student academic attributes (enrolled degree curriculum, current study year/semester, course enrollment status, GPA).
- **DeterministicUserIdentityRouting**: The sub-system route in the advising router that intercepts questions regarding user identity, system role, or enrolled curriculum, returning authoritative, deterministic profile responses directly from authenticated metadata without invoking downstream LLM generation or vector retrieval.
- **ExtendedStudentYear (นักศึกษาขยายเวลาเรียน / ตกค้าง)**: Student cohort status representing students enrolled beyond the curriculum's standard duration (e.g., Year 5+ for 4-year programs), tracking real academic standing and enrolled in-progress courses without truncating to the official 4-year curriculum layout.
- **Curriculum Course Record**: The course data stored for one program, curriculum year, academic year, and semester under the `curriculum/` branch. It is the course record shown in that selected curriculum slot.
- **Course Index Record**: The copy of a Curriculum Course Record stored under `courses/<courseId>` for cross-screen lookup. It must remain consistent with the Curriculum Course Record without overwriting records for another curriculum slot.

### Chatbot Experience

- **Modern Academic Chat Surface**: The department chatbot's calm, credible interaction surface, using the existing navy, white, and blue institutional palette with clear reading hierarchy and compact controls.

### Website Experience

**Modern Academic Web Surface**:
The department's contemporary academic website experience, with a consistent institutional identity and readable, task-focused presentation for students and staff. It preserves the academic capabilities available to each role.
_Avoid_: A marketing-only redesign, a replacement academic system

### Architectural Documentation & Modeling

- **ThemeAdaptiveDiagram**: Architectural diagrams authored in native vector-first Markdown (Mermaid) or solid-white canvas formats, ensuring automatic contrast and zero text occlusion across both GitHub Dark Mode and Light Mode.
- **StructuredTieredArchitecturePattern**: A 3-tier horizontal presentation layout dividing system architecture into Stakeholder Actors, Application Core, and External Cloud/AI Services to eliminate crossing lines and clarify functional boundaries.
- **BentoMetricShowcase**: A high-visibility architectural summary bar presenting key department scope metrics (programs, curriculum variants, accuracy rating) prominently at the top of the system documentation.
- **BentoFeatureCard**: A modular documentation layout component grouping related capabilities with architectural tags, bullet highlights, and domain rules for rapid scanning.
- **SystemContextBoundary**: The highest-level architectural boundary distinguishing the client-side SPA (`ระบบแนะนำหลักสูตรภาควิชาเทคโนโลยีสารสนเทศด้วย Chatbot`) from the 5 user stakeholder roles and external cloud infrastructure (Firebase Authentication, Realtime Database, and n8n AI Orchestration).
- **SystemActorRoles**: The five distinct stakeholder personas interacting with the system boundary: `Student` (individualized study planning and advising), `Instructor` (advising review), `Staff` (curriculum data management), `Admin` (system configuration and role assignment), and `Guest` (public curriculum inquiries).
- **ExternalSystemDependencies**: The three decoupled external backends operating outside the primary SPA runtime: Firebase Auth (identity management), Firebase Realtime Database (distributed persistence), and n8n (AI RAG pipeline, knowledge retrieval, and LLM text generation).
