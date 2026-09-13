import React, { useEffect, useState, useRef } from "react";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import './ChatBot.css';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyPlan, useStudentGPAAndCredits } from '@/hooks/useFirebaseData';
import { Course } from '@/types/course';
import { FeedbackBanner } from './FeedbackBanner';
import { getCurriculumSummaryCatalog, getAllCurriculumsMap } from '@/services/curriculumCatalogService';

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

  // Fetch standard curriculum courses (for student, admin, or guest)
  useEffect(() => {
    if (authLoading || (user && studyPlanLoading)) {
      return;
    }

    const fetchCurriculum = async () => {
      try {
        setCurriculumLoading(true);
        let program = 'IT';
        let curriculumYear = '67';

        if (studyPlan?.curriculum) {
          const parts = studyPlan.curriculum.split('-');
          program = parts[0] || 'IT';
          curriculumYear = parts[1] || '67';
        } else if (user?.department) {
          program = user.department;
        }

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
  }, [authLoading, studyPlanLoading, user?.id, user?.department, studyPlan?.curriculum]);

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
          }[c.grade.trim().toUpperCase()])
          .map(c => c.code) || [];

        // Extract passed courses with detailed attributes
        const passedCourses = studyPlan?.courses
          ?.filter(c => c.status === 'completed' && c.grade && {
            'A': true, 'A-': true, 'A+': true,
            'B': true, 'B+': true, 'B-': true,
            'C': true, 'C+': true, 'C-': true,
            'D': true, 'D+': true, 'D-': true,
            'S': true
          }[c.grade.trim().toUpperCase()])
          .map(c => ({
            code: c.code,
            name: c.name,
            credits: c.credits,
            year: c.year,
            semester: c.semester,
            grade: c.grade,
            status: 'completed'
          })) || [];

        // Extract failed courses (Grade F or status failed)
        const failedCourses = studyPlan?.courses
          ?.filter(c => c.status === 'failed' || (c.grade && c.grade.trim().toUpperCase() === 'F'))
          .map(c => ({
            code: c.code,
            name: c.name,
            credits: c.credits,
            year: c.year,
            semester: c.semester,
            grade: c.grade || 'F',
            status: 'failed'
          })) || [];
        const failedCourseCodes = failedCourses.map(c => c.code);

        const userGpa = Number(gpaData?.gpa ?? (studyPlan as any)?.gpa ?? 0);
        const isProbation = userGpa > 0 && userGpa < 2.00;
        const academicStanding = userGpa === 0 ? 'unknown' : (isProbation ? 'probation' : 'normal');

        const registrationRules = {
          regularSemester: {
            minCredits: 9,
            maxCredits: 22,
            exception: 'สามารถลงทะเบียนเรียนต่ำกว่า 9 หน่วยกิตได้ หากเป็นภาคการศึกษาสุดท้ายที่คาดว่าจะสำเร็จการศึกษา'
          },
          probation: {
            maxCredits: 16,
            condition: 'นักศึกษาที่มีเกรดเฉลี่ยสะสม (GPAX) ต่ำกว่า 2.00 ติดสถานะวิทยาทัณฑ์ (ติดโปร)',
            petitionGuideline: 'หากมีความจำเป็นต้องลงทะเบียนเรียนเกิน 16 หน่วยกิตเพื่อรักษาสถานภาพหรือเก็บวิชาบังคับตามหลักสูตร ต้องยื่นแบบคำร้องขออนุมัติเป็นกรณีพิเศษผ่านอาจารย์ที่ปรึกษาและเสนอหัวหน้าภาควิชา/คณบดี'
          },
          summerSemester: {
            maxCredits: 6,
            note: 'ภาคเรียนฤดูร้อนลงทะเบียนเรียนได้สูงสุดไม่เกิน 6 หน่วยกิต'
          }
        };

        const curriculumSummaryCatalog = getCurriculumSummaryCatalog();
        const allCurriculums = getAllCurriculumsMap();
        const enrolledCurr = studyPlan?.curriculum 
          ? studyPlan.curriculum 
          : (studyPlan?.program && studyPlan?.curriculumYear 
              ? `${studyPlan.program}-${studyPlan.curriculumYear}` 
              : (user?.department ? `${user.department}-67` : ''));

        const uncompletedCurriculumCourses = curriculumCourses
          .filter(c => !completedCourseCodes.includes(c.code))
          .map(c => ({
            code: c.code,
            name: c.name,
            credits: c.credits,
            category: c.category,
            year: c.year,
            semester: c.semester,
            prerequisites: c.prerequisites || [],
            isFailed: failedCourseCodes.includes(c.code)
          }));

        const curriculumDurationGuard = {
          ITT: {
            programName: 'เทคโนโลยีสารสนเทศ (เทียบโอน)',
            durationYears: 2,
            totalSemesters: 4,
            validSemesters: ['1-1', '1-2', '2-1', '2-2'],
            forbiddenSemesters: ['3-1', '3-2', '3-3', '4-1', '4-2', 'summer', 'internship', 'coop'],
            totalCredits: 84,
            totalCourses: 28,
            notes: 'หลักสูตรเทียบโอน 2 ปี มีเฉพาะปี 1 และปี 2 รวม 4 เทอมเท่านั้น (1-1, 1-2, 2-1, 2-2) รวม 28 วิชา 84 หน่วยกิต ไม่มีปี 3 และปี 4 เด็ดขาด ไม่มีวิชาฝึกงาน/สหกิจศึกษา เมื่อแสดงวิชาครบ 2-2 ต้องจบการแสดงรายวิชาทันที ห้ามแสดง 3-1, 3-2, 3-3, 4-1, 4-2 เป็นอันขาด'
          },
          ITI: {
            programName: 'เทคโนโลยีสารสนเทศ (ต่อเนื่อง)',
            durationYears: 2,
            totalSemesters: 5,
            validSemesters: ['1-1', '1-2', '1-3', '2-1', '2-2'],
            forbiddenSemesters: ['3-1', '3-2', '3-3', '4-1', '4-2'],
            totalCredits: 78,
            notes: 'หลักสูตรต่อเนื่อง 2 ปี มี 5 เทอม (ปี 1 เทอม 3 ฝึกงาน) ไม่มีปี 3 หรือปี 4'
          },
          INET: {
            programName: 'เทคโนโลยีสารสนเทศและเครือข่าย',
            durationYears: 3,
            totalSemesters: 7,
            validSemesters: ['1-1', '1-2', '2-1', '2-2', '2-3', '3-1', '3-2'],
            forbiddenSemesters: ['4-1', '4-2'],
            totalCredits: 102,
            notes: 'หลักสูตร 3 ปี 7 เทอม (ปี 2 เทอม 3 ฝึกงาน) ไม่มีปี 4'
          },
          IT: {
            programName: 'เทคโนโลยีสารสนเทศ',
            durationYears: 4,
            totalSemesters: 8,
            notes: 'หลักสูตร 4 ปีปกติ'
          },
          INE: {
            programName: 'วิศวกรรมสารสนเทศและเครือข่าย',
            durationYears: 4,
            totalSemesters: 8,
            notes: 'หลักสูตร 4 ปีปกติ'
          }
        };

        const advisingDirectives = {
          passedCourseExclusionRule: 'STRICT: ห้ามนำรายวิชาที่อยู่ใน completedCourseCodes หรือ passedCourses ไปใส่ในแผนการลงทะเบียนเรียนที่แนะนำโดยเด็ดขาด ให้นักศึกษาลงเฉพาะวิชาที่ยังไม่ผ่านเท่านั้น',
          retakePrerequisiteRule: 'STRICT: หากนักศึกษามีวิชาใน failedCourses (ติด F) และวิชานั้นเป็นตัวบังคับก่อน (prerequisite) ของวิชาในเทอมถัดไป ให้แจ้งชัดเจนว่าวิชาในเทอมถัดไปตัวนั้นถูกบล็อก (Blocked) ไม่สามารถลงทะเบียนได้ และต้องแนะนำให้ลงเรียนซ้ำ (Retake) วิชาที่ติด F ก่อน',
          directFulfillmentRule: 'STRICT: เมื่อผู้ใช้ถามเกี่ยวกับรายวิชา แผนการเรียน หรือหน่วยกิต ให้ตอบรายละเอียดและโครงสร้างรายวิชาทันที ห้ามถามยืนยัน ห้ามถามย้อน และห้ามถามความสมัครใจก่อนตอบเด็ดขาด',
          multiTurnCurriculumRetention: 'STRICT: ให้รักษา ActiveConversationCurriculum จากข้อความก่อนหน้า หากผู้ใช้ถามต่อเนื่อง เช่น "บอกมาในแชทนี้เลย" หรือ "มีวิชาอะไรอีก" ให้ตอบตามหลักสูตรเดิมที่คุยค้างไว้',
          ragOverrideRule: 'STRICT: ข้อมูลใน allCurriculums และ curriculumDurationGuard คือ Single Source of Truth หากมีข้อความจาก Vector Store/RAG หรือ Pinecone ขัดแย้งกับ metadata ให้ยึดตาม metadata เสมอ ห้ามแสดงปีหรือเทอมที่อยู่นอก validSemesters หรืออยู่ใน forbiddenSemesters ของหลักสูตรนั้นเด็ดขาด เช่น ITT ห้ามมี 3-1, 3-2, 3-3, 4-1, 4-2 เป็นอันขาด',
          noConversationalStallRule: 'STRICT: ห้ามพิมพ์ข้อความเสนอแนะหรือถามความสมัครใจปิดท้าย เช่น "หากต้องการไฟล์ตาราง CSV... บอกได้" ให้สรุปข้อมูลและจบคำตอบทันที'
        };

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
              curriculum: enrolledCurr,
              enrolledCurriculum: enrolledCurr,
              activeCurriculum: enrolledCurr || 'IT-67',
              curriculumSummaryCatalog,
              allCurriculums,
              curriculumDurationGuard,
              advisingDirectives,
              gpa: userGpa,
              isProbation,
              academicStanding,
              allowedMaxCredits: isProbation ? 16 : 22,
              allowedMinCredits: 9,
              registrationRules: {
                ...registrationRules,
                studentStanding: {
                  gpa: userGpa,
                  isProbation,
                  academicStanding,
                  allowedMaxCredits: isProbation ? 16 : 22,
                  allowedMinCredits: 9,
                  statusSummary: isProbation
                    ? `สถานะวิทยาทัณฑ์ (ติดโปร - GPAX ${userGpa.toFixed(2)}) ลงทะเบียนได้สูงสุดไม่เกิน 16 หน่วยกิต หากจำเป็นต้องลงเกินต้องยื่นคำร้องพิเศษ`
                    : `สถานะปกติ (GPAX ${userGpa.toFixed(2)}) ลงทะเบียนได้ 9-22 หน่วยกิต (ยกเว้นภาคการศึกษาสุดท้ายที่คาดว่าจะสำเร็จการศึกษา)`
                }
              },
              completedCredits: gpaData?.completedCredits ?? studyPlan?.completedCredits ?? 0,
              totalCredits: studyPlan?.totalCredits || gpaData?.totalCredits || 0,
              gradePassingThreshold: 'D',  // D and above counts as passing
              completedCourseCodes: completedCourseCodes,  // List of passed course codes
              passedCourses,
              failedCourses,
              failedCourseCodes,
              uncompletedCurriculumCourses,
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
                code: (c.code || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '').trim(),
                name: (c.name || '').trim(),
                credits: c.credits,
                category: c.category,
                year: c.year,
                semester: c.semester,
                prerequisites: (c.prerequisites || []).map((p: string) => p.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*/g, '').trim()),
                corequisites: (c.corequisites || []).map((p: string) => p.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*/g, '').trim())
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
              enrolledCurriculum: 'none',
              activeCurriculum: 'IT-67',
              curriculumSummaryCatalog,
              allCurriculums,
              curriculumDurationGuard,
              advisingDirectives,
              gpa: 0,
              isProbation: false,
              academicStanding: 'guest',
              allowedMaxCredits: 22,
              allowedMinCredits: 9,
              registrationRules: {
                ...registrationRules,
                studentStanding: {
                  gpa: 0,
                  isProbation: false,
                  academicStanding: 'guest',
                  allowedMaxCredits: 22,
                  allowedMinCredits: 9,
                  statusSummary: 'ผู้เยี่ยมชม (Guest) แสดงกฎระเบียบการลงทะเบียนทั่วไป: ภาคปกติ 9-22 หน่วยกิต, ติดโปรไม่เกิน 16 หน่วยกิต, ภาคฤดูร้อนไม่เกิน 6 หน่วยกิต'
                }
              },
              completedCredits: 0,
              totalCredits: 0,
              passedCourses: [],
              failedCourses: [],
              failedCourseCodes: [],
              uncompletedCurriculumCourses: [],
              studyPlan: [],
              curriculumCourses: curriculumCourses.map(c => ({
                code: (c.code || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '').trim(),
                name: (c.name || '').trim(),
                credits: c.credits,
                category: c.category,
                year: c.year,
                semester: c.semester,
                prerequisites: (c.prerequisites || []).map((p: string) => p.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*/g, '').trim()),
                corequisites: (c.corequisites || []).map((p: string) => p.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*/g, '').trim())
              }))
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
              footer: '',
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

  // Periodic feedback banner states
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentMessageCount, setCurrentMessageCount] = useState(0);

  // Monitor chat messages and trigger feedback every 5 messages
  useEffect(() => {
    if (dataIsLoading || isInitializing) return;

    let prevUserMsgCount = 0;

    const checkMessages = () => {
      const container = document.getElementById('n8n-chat');
      if (!container) return;

      const chatWindowEl = container.querySelector('.chat-window');
      const open = !!chatWindowEl && window.getComputedStyle(chatWindowEl).display !== 'none';

      const userMsgElements = container.querySelectorAll(
        '.chat-message-from-user, [class*="chat-message-from-user"], [class*="userMessage"], [data-role="user"]'
      );
      const count = userMsgElements.length;

      if (count > prevUserMsgCount) {
        const diff = count - prevUserMsgCount;
        prevUserMsgCount = count;

        const currentStored = parseInt(sessionStorage.getItem('chatFeedbackMsgCount') || '0', 10);
        const newStored = currentStored + diff;
        sessionStorage.setItem('chatFeedbackMsgCount', String(newStored));
        setCurrentMessageCount(newStored);

        const lastFeedback = parseInt(sessionStorage.getItem('chatLastFeedbackCount') || '0', 10);
        if (newStored - lastFeedback >= 5 && open) {
          setShowFeedback(true);
        }
      } else if (!open) {
        setShowFeedback(false);
      }
    };

    const targetNode = document.getElementById('n8n-chat');
    if (!targetNode) return;

    const observer = new MutationObserver(() => {
      checkMessages();
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    const intervalId = setInterval(checkMessages, 1000);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [dataIsLoading, isInitializing]);

  // Fix cursor navigation with arrow keys in @n8n/chat textarea
  useEffect(() => {
    if (dataIsLoading || isInitializing) return;

    const navKeys = new Set([
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (navKeys.has(e.key)) {
        // Stop bubbling to parent .chat-input so @n8n/chat's handler
        // never calls e.preventDefault() on arrow keys!
        e.stopPropagation();
      }
    };

    const attachListener = (el: Element | null) => {
      if (!el || !(el instanceof HTMLTextAreaElement)) return;
      if ((el as any)._arrowNavAttached) return;
      (el as any)._arrowNavAttached = true;
      el.addEventListener('keydown', handleKeyDown);
    };

    const scanAndAttach = () => {
      const container = document.getElementById('n8n-chat');
      if (!container) return;
      const textareas = container.querySelectorAll('textarea');
      textareas.forEach(attachListener);
    };

    // 1. Immediately scan and attach
    scanAndAttach();

    // 2. Catch dynamically mounted textarea on focus
    const container = document.getElementById('n8n-chat');
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLTextAreaElement) {
        attachListener(e.target);
      }
    };

    if (container) {
      container.addEventListener('focusin', handleFocusIn, true);
    }

    // 3. MutationObserver for open/close and dynamic mounts
    const observer = new MutationObserver(() => {
      scanAndAttach();
    });

    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('focusin', handleFocusIn, true);
      }
      observer.disconnect();
      if (container) {
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach((el) => {
          el.removeEventListener('keydown', handleKeyDown);
          delete (el as any)._arrowNavAttached;
        });
      }
    };
  }, [dataIsLoading, isInitializing]);

  const handleDismissFeedback = () => {
    setShowFeedback(false);
    const currentStored = parseInt(sessionStorage.getItem('chatFeedbackMsgCount') || '0', 10);
    sessionStorage.setItem('chatLastFeedbackCount', String(currentStored));
  };

  const statePanel = (dataIsLoading || isInitializing) ? (
      <div data-chatbot-state className="chatbot-state chatbot-state--loading" role="status" aria-live="polite">
        <div className="chatbot-state__panel">
          <span className="chatbot-state__eyebrow">IT COURSE ASSISTANT</span>
          <div className="chatbot-state__skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>กำลังเตรียมผู้ช่วยแนะนำหลักสูตร</p>
        </div>
      </div>
  ) : chatError ? (
      <div data-chatbot-state className="chatbot-state chatbot-state--error" role="alert">
        <div className="chatbot-state__panel">
          <span className="chatbot-state__eyebrow">IT COURSE ASSISTANT</span>
          <h3>ยังเชื่อมต่อผู้ช่วยไม่ได้</h3>
          <p>{chatError}</p>
          <p className="chatbot-state__hint">โปรดลองใหม่อีกครั้งในภายหลัง หรือติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
  ) : null;

  return (
    <>
      <div id="n8n-chat"></div>
      {statePanel}
      {showFeedback && (
        <FeedbackBanner
          sessionId={sessionIdRef.current}
          userId={user?.id || 'guest'}
          userName={user?.name}
          studentId={user?.studentId}
          curriculum={studyPlan?.curriculum}
          messageCount={currentMessageCount}
          onDismiss={handleDismissFeedback}
        />
      )}
    </>
  );
};

export default ChatBot;
