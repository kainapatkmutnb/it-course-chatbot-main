# Design Doc: Firebase Realtime Database and n8n Chatbot Integration (with Curriculum Data & Guest Mode)

Integrate the n8n-based AI Assistant chatbot with the student's Firebase Realtime Database profile, personal study plan, and their cohort's standard curriculum structure. This will allow the chatbot to answer complex curriculum questions, compare personal study progress with the standard curriculum, and support Guest Mode for general curriculum queries via Pinecone RAG.

## User Review Required

> [!NOTE]
> For logged-in students, the chatbot will fetch both the student's personal study plan and their standard curriculum courses from `getCoursesByProgram(program, curriculumYear)`. This enables comparison queries (e.g. "What required courses am I missing?").

## Open Questions

None. The user has approved the client-side metadata passing approach, Guest Mode design, and Pinecone RAG delegation for guest queries.

## Proposed Changes

We will modify the frontend React application to fetch the student's standard curriculum courses list and pass it in the `metadata` payload under `curriculumCourses`.

---

### Component: Chatbot

We will update the `ChatBot` React component to retrieve user context and fetch their standard curriculum courses when logged in.

#### [MODIFY] [ChatBot.tsx](file:///c:/Users/guy26/Desktop/it-course-chatbot-main/src/components/chat/ChatBot.tsx)

- Update imports to include `getCoursesByProgram` from `@/services/courseService`.
- Add a React state `curriculumCourses` and `curriculumLoading`.
- Add a `useEffect` to fetch standard curriculum courses when `user` is logged in and `studyPlan.curriculum` is available.
- Suspend initialization if any data (auth, study plan, GPA, or curriculum) is loading.
- Pass the standard curriculum courses list under `metadata.curriculumCourses` mapped to a clean JSON structure:
  ```json
  "curriculumCourses": [
    {
      "code": "IT-060243102",
      "name": "การโปรแกรมคอมพิวเตอร์",
      "credits": 3,
      "category": "core",
      "year": 1,
      "semester": 1,
      "prerequisites": [],
      "corequisites": []
    }
  ]
  ```
- For Guests, pass an empty list (`curriculumCourses: []`).

## Verification Plan

### Manual Verification
1. Log in to the application as a student. Verify that the ChatBot loads and receives both `studyPlan` and `curriculumCourses` in the metadata, and that the AI can answer curriculum questions comparing the two (e.g., "มีวิชาบังคับอะไรในหลักสูตรที่ฉันยังไม่ได้เรียนบ้าง").
2. Log out of the application. Verify that the ChatBot loads in Guest Mode and replies to general curriculum questions via Pinecone RAG.
