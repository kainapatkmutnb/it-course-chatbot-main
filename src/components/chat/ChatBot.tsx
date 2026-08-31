import React, { useEffect, useState, useRef } from "react";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import './ChatBot.css';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyPlan, useStudentGPAAndCredits } from '@/hooks/useFirebaseData';
import { Course } from '@/types/course';

const ChatBot: React.FC = () => {
  const [chatError, setChatError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [curriculumCourses, setCurriculumCourses] = useState<Course[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  // BUG-05 fix: track whether chat has been initialized to prevent re-initialization
  const chatInitializedRef = useRef(false);

  const { user, isLoading: authLoading } = useAuth();
  const { studyPlan, loading: studyPlanLoading } = useStudyPlan(user?.id || '');
  const { data: gpaData, loading: gpaLoading } = useStudentGPAAndCredits(user?.id || '');

  // DEBUG: Log GPA and credits data
  useEffect(() => {
    if (!authLoading && user) {
      console.log('📊 [ChatBot Debug]', {
        userId: user.id,
        gpaData,
        studyPlan: {
          id: studyPlan?.id,
          studentId: studyPlan?.studentId,
          completedCredits: studyPlan?.completedCredits,
          totalCredits: studyPlan?.totalCredits,
          courseCount: studyPlan?.courses?.length
        }
      });
    }
  }, [gpaData, studyPlan, user, authLoading]);

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

  // Session ID for conversation grouping
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) {
    sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  useEffect(() => {
    // BUG-05 fix: only initialize once when data loading is complete
    if (dataIsLoading) return;
    const cleanupChat = () => {
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.innerHTML = '';
      }
      const shadowRoots = document.querySelectorAll('n8n-chat');
      shadowRoots.forEach(el => el.remove());
      chatInitializedRef.current = false;
    };

    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        setChatError(null);
        cleanupChat();
        
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/dd7276e3-4e2c-48c0-a7b7-ca3647acf777/chat';

        const initialMessages = user 
          ? [
              `สวัสดีครับ คุณ ${user.name} 👋`,
              'ผมคือ AI Assistant ของภาควิชาเทคโนโลยีสารสนเทศ มีอะไรให้ช่วยไหมครับ?',
              '🔒 *ระบบมีการบันทึกประวัติการสนทนาเพื่อพัฒนาการให้บริการตามนโยบาย PDPA*'
            ]
          : [
              'สวัสดีครับ 👋 ยินดีต้อนรับสู่ระบบแนะนำหลักสูตรภาควิชาเทคโนโลยีสารสนเทศ',
              'ผมคือ AI Assistant มีอะไรให้ช่วยเหลือเกี่ยวกับหลักสูตรและรายวิชาไหมครับ?',
              '🔒 *ระบบมีการบันทึกประวัติการสนทนาเพื่อพัฒนาการให้บริการตามนโยบาย PDPA*'
            ];

        // Extract completed course codes (grades D and above, including S for internship)
        const completedCourseCodes = studyPlan?.courses
          ?.filter(c => c.status === 'completed' && c.grade && {
            'A': true, 'A-': true, 'A+': true,
            'B': true, 'B+': true, 'B-': true,
            'C': true, 'C+': true, 'C-': true,
            'D': true, 'D+': true, 'D-': true,
            'S': true  // Success grade for internship (ฝึกงาน)
          }[c.grade.toUpperCase()])
          .map(c => c.code) || [];

        const metadata = user 
          ? {
              sessionId: sessionIdRef.current,
              channel: 'web',
              userId: user.id || '',
              userName: user.name || '',
              userEmail: user.email || '',
              studentId: user.studentId || '',
              role: user.role || '',
              department: studyPlan?.program || user.department || '',
              program: studyPlan?.program || '',
              curriculumYear: studyPlan?.curriculumYear || '',
              curriculum: studyPlan?.program && studyPlan?.curriculumYear ? `${studyPlan.program}-${studyPlan.curriculumYear}` : (studyPlan?.curriculum || ''),
              gpa: gpaData?.gpa ?? (studyPlan as any)?.gpa ?? 0,
              completedCredits: gpaData?.completedCredits ?? studyPlan?.completedCredits ?? 0,
              totalCredits: studyPlan?.totalCredits || gpaData?.totalCredits || 0,
              gradePassingThreshold: 'D',  // D and above counts as passing
              completedCourseCodes: completedCourseCodes,  // List of passed course codes
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
              sessionId: sessionIdRef.current,
              channel: 'web',
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

        chatInitializedRef.current = true;
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
      cleanupChat();
    };
  }, [
    dataIsLoading,
    user?.id,
    gpaData?.gpa,
    gpaData?.completedCredits,
    studyPlan?.courses?.length,
    (studyPlan?.updatedAt as any)?.toString?.()
  ]); // eslint-disable-line react-hooks/exhaustive-deps

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