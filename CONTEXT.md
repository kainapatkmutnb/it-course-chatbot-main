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

### System Notification Domain

- **ToastNotification**: Ephemeral feedback message displayed in response to user actions (e.g., login, course updates, data deletion), rendered as a modern glassmorphic card with semantic status icons.
- **ToastViewport**: The top-right docked container (`top: 16px, right: 16px`) ensuring notifications remain visible and unobstructed by floating action elements such as the `ChatbotToggle`.

### Identity & Curriculum Persistence

- **Firebase Authentication Account**: The Firebase-managed identity that can sign in with an email and password. It is distinct from, and must not be confused with, the application's user profile.
- **User Profile**: The application record at `users/<uid>` in Realtime Database that stores a user's role and profile fields. Removing it alone does not remove the corresponding Firebase Authentication Account.
- **Curriculum Course Record**: The course data stored for one program, curriculum year, academic year, and semester under the `curriculum/` branch. It is the course record shown in that selected curriculum slot.
- **Course Index Record**: The copy of a Curriculum Course Record stored under `courses/<courseId>` for cross-screen lookup. It must remain consistent with the Curriculum Course Record without overwriting records for another curriculum slot.

### Chatbot Experience

- **Modern Academic Chat Surface**: The department chatbot's calm, credible interaction surface, using the existing navy, white, and blue institutional palette with clear reading hierarchy and compact controls.

### Architectural Documentation & Modeling

- **ThemeAdaptiveDiagram**: Architectural diagrams authored in native vector-first Markdown (Mermaid) or solid-white canvas formats, ensuring automatic contrast and zero text occlusion across both GitHub Dark Mode and Light Mode.
- **StructuredTieredArchitecturePattern**: A 3-tier horizontal presentation layout dividing system architecture into Stakeholder Actors, Application Core, and External Cloud/AI Services to eliminate crossing lines and clarify functional boundaries.
