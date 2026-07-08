# Firebase Chatbot Integration Implementation Plan (with Curriculum Data & Guest Mode)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the frontend `ChatBot.tsx` component to fetch the standard curriculum courses list for logged-in students and pass it in the `metadata` payload, in addition to personal study plans and Guest Mode.

**Architecture:** Parse `studyPlan.curriculum` to get the program code and cohort year (e.g. `IT-67`). Call `getCoursesByProgram(program, curriculumYear)` to fetch all required standard courses, and map them to `metadata.curriculumCourses`.

## Global Constraints

- Do not perform git push or commits yet, as requested by the user.
- Use exact React hooks from `@/hooks/useFirebaseData`.
- Use `getCoursesByProgram` from `@/services/courseService` to fetch standard curriculum data.

---

### Task 3: Implement Standard Curriculum Metadata in ChatBot

**Files:**
- Modify: [ChatBot.tsx](file:///c:/Users/guy26/Desktop/it-course-chatbot-main/src/components/chat/ChatBot.tsx)

**Interfaces:**
- Consumes: `getCoursesByProgram` from `@/services/courseService`.
- Produces: Chat widget initialized with student profile, personal study plan, and standard curriculum course details.

- [ ] **Step 1: Modify ChatBot.tsx to load and map curriculum courses**

Update `ChatBot.tsx` to handle curriculum loading states and dynamic import of the course service.

```typescript
import React, { useEffect, useState } from "react";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import './ChatBot.css';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyPlan, useStudentGPAAndCredits } from '@/hooks/useFirebaseData';

const ChatBot: React.FC = () => {
  const [chatError, setChatError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [curriculumCourses, setCurriculumCourses] = useState<any[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  const { user, isLoading: authLoading } = useAuth();
  const { studyPlan, loading: studyPlanLoading } = useStudyPlan(user?.id || '');
  const { data: gpaData, loading: gpaLoading } = useStudentGPAAndCredits(user?.id || '');

  // Fetch standard curriculum courses if student is logged in
  useEffect(() => {
    if (authLoading || studyPlanLoading || !user || !studyPlan?.curriculum) {
      setCurriculumCourses([]);
      return;
    }

    const fetchCurriculum = async () => {
      try {
        setCurriculumLoading(true);
        const parts = studyPlan.curriculum.split('-');
        const program = parts[0] || 'IT';
        const curriculumYear = parts[1] || '67';
        
        const { getCoursesByProgram } = await import('@/services/courseService');
        const courses = await getCoursesByProgram(program, curriculumYear);
        setCurriculumCourses(courses);
      } catch (error) {
        console.error('Error fetching curriculum courses:', error);
      } finally {
        setCurriculumLoading(false);
      }
    };

    fetchCurriculum();
  }, [authLoading, studyPlanLoading, user, studyPlan?.curriculum]);

  // Only consider study plan & gpa & curriculum loading when there is a logged-in user
  const dataIsLoading = authLoading || (!!user && (studyPlanLoading || gpaLoading || curriculumLoading));

  useEffect(() => {
    // Only initialize when basic auth loading and necessary data loading finishes
    if (dataIsLoading) return;

    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        setChatError(null);
        
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/dd7276e3-4e2c-48c0-a7b7-ca3647acf777/chat';

        const initialMessages = user 
          ? [
              `สวัสดีครับ คุณ ${user.name} 👋`,
              'ผมคือ AI Assistant ของภาควิชาเทคโนโลยีสารสนเทศ มีอะไรให้ช่วยไหมครับ?'
            ]
          : [
              'สวัสดีครับ 👋 ยินดีต้อนรับสู่ระบบแนะนำหลักสูตรภาควิชาเทคโนโลยีสารสนเทศ',
              'ผมคือ AI Assistant มีอะไรให้ช่วยเหลือเกี่ยวกับหลักสูตรและรายวิชาไหมครับ?'
            ];

        const metadata = user 
          ? {
              userId: user.id || '',
              userName: user.name || '',
              studentId: user.studentId || '',
              role: user.role || '',
              department: user.department || '',
              gpa: gpaData?.gpa || 0,
              completedCredits: gpaData?.completedCredits || 0,
              totalCredits: gpaData?.totalCredits || 0,
              studyPlan: studyPlan?.courses ? studyPlan.courses.map(c => ({
                code: c.code,
                name: c.name,
                credits: c.credits,
                year: c.year,
                semester: c.semester,
                status: c.status,
                grade: c.grade || 'N/A'
              })) : [],
              curriculumCourses: curriculumCourses.map(c => ({
                code: c.code,
                name: c.name,
                credits: c.credits,
                category: c.category,
                year: c.year,
                semester: c.semester,
                prerequisites: c.prerequisites || [],
                corequisites: c.corequisites || []
              }))
            }
          : {
              userId: 'guest',
              userName: 'Guest',
              studentId: 'guest',
              role: 'guest',
              department: 'guest',
              gpa: 0,
              completedCredits: 0,
              totalCredits: 0,
              studyPlan: [],
              curriculumCourses: []
            };

        createChat({
          webhookUrl,
          mode: 'window',
          showWelcomeScreen: true,
          defaultLanguage: 'en',
          initialMessages,
          metadata,
          i18n: {
            en: {
              title: 'IT Course Assistant 👋',
              subtitle: 'ยินดีต้อนรับสู่ระบบแชทบอทของภาควิชาเทคโนโลยีสารสนเทศ',
              footer: 'Powered by n8n',
              getStarted: 'เริ่มการสนทนา',
              inputPlaceholder: 'พิมพ์คำถามของคุณ...',
              closeButtonTooltip: 'ปิดแชทบอท',
            },
          },
          loadPreviousSession: false, // Set to false to prevent caching old session memories
          enableStreaming: false,
        });
      } catch (error) {
        console.error('Chat initialization error:', error);
        setChatError('ขออภัย ระบบแชทบอทไม่สามารถเชื่อมต่อได้ในขณะนี้');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();

    // Clean up chat elements upon unmount
    return () => {
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.innerHTML = '';
      }
      const shadowRoot = document.querySelector('n8n-chat');
      if (shadowRoot) {
        shadowRoot.remove();
      }
    };
  }, [dataIsLoading, user, studyPlan, gpaData, curriculumCourses]);

  if (dataIsLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดแชทบอท...</p>
        </div>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <div className="text-yellow-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">แชทบอทไม่พร้อมใช้งาน</h3>
          <p className="text-yellow-700 text-sm mb-4">{chatError}</p>
          <p className="text-yellow-600 text-xs">
            กรุณาติดต่อผู้ดูแลระบบหรือลองใหม่อีกครั้งในภายหลัง
          </p>
        </div>
      </div>
    );
  }

  return <div id="n8n-chat"></div>;
};

export default ChatBot;
```

- [ ] **Step 2: Run local lint check to make sure code compiles and has no type errors**

Run: `npm run lint` or check build with `npm run build`
Expected: Successfully completes with no typescript errors in ChatBot.tsx.
