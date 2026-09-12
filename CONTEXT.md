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

### System Notification Domain

- **ToastNotification**: Ephemeral feedback message displayed in response to user actions (e.g., login, course updates, data deletion), rendered as a modern glassmorphic card with semantic status icons.
- **ToastViewport**: The top-right docked container (`top: 16px, right: 16px`) ensuring notifications remain visible and unobstructed by floating action elements such as the `ChatbotToggle`.
