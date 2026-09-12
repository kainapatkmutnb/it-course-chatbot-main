# Ubiquitous Language & Domain Model

## Core Entities & Concepts

### Chatbot Advising Domain

- **ChatbotToggle**: The persistent floating action button (FAB) positioned at the bottom-right corner of the application interface (`bottom: 20px, right: 20px`), responsible for opening and closing the advising dialog window.
- **ChatbotCalloutPill**: A proactive, dismissible floating badge positioned to the left of the `ChatbotToggle` that invites students to consult the assistant (e.g. "💬 สอบถามหลักสูตร IT ที่นี่") with gentle float animation. Automatically hides on mobile viewports and when the chat window is opened.
- **ChatStatusIndicator**: An online status badge (pulsing green dot) overlaid on the `ChatbotToggle` signaling AI assistant availability.
- **ChatWelcomeScreen**: The initial greeting screen presented to students prior to beginning a conversation. Contains introductory department metadata, conversation starters ("เริ่มการสนทนา"), and zero redundant third-party attributions (white-labeled).
- **FeedbackBanner**: A non-intrusive sentiment inquiry banner docked at the bottom of the active chat interface, triggered periodically every 5 user messages.
- **FeedbackScale**: A 3-point ordinal rating system ordered from negative to positive:
  1. `dislike` (👎 ไม่ชอบ)
  2. `neutral` (😐 ปานกลาง)
  3. `like` (👍 ชอบ)

### Academic & Curriculum Domain

- **Course**: An accredited academic subject containing course code (standard or custom), course name (Thai & English), credit weight, curriculum year, semester, prerequisites, and corequisites.
- **StudyPlan**: A student's registered 4-year academic roadmap detailing course progression, pass/fail status, and grade history.
- **AcademicStanding**: Student GPA and completed credits tracked for automated advising and credit cap validation.
