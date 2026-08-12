import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { courseDatabase } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
import {
  BookOpen,
  Calendar,
  Target,
  Trophy,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  Check,
  ArrowRightLeft,
  Lightbulb,
  Search,
} from 'lucide-react';
import {
  calculateGPA,
  getAvailableGrades,
  getGPAColor,
  countsAsCompletedCredits,
  isGradeCountedInGPA,
  isPassingGrade,
} from '@/utils/gradeUtils';
import { getCurriculumTotalCredits } from '@/services/departmentService';

interface CurriculumCourse {
  code: string;
  name: string;
  credits: number;
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory?: string;
  subCategory?: string;
  prerequisites?: string[];
  year: number;
  semester: number;
}

interface StudentCourse {
  id: string;
  code: string;
  originalName: string;
  customName?: string;
  credits: number;
  year: number;
  semester: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  grade?: string;
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory?: string;
  subCategory?: string;
  prerequisites?: string[];
  isElective?: boolean;
}

interface StudyPlan {
  id: string;
  studentId: string;
  studentEmail: string;
  program: string;
  curriculumYear: string;
  isLocked: boolean;
  courses: StudentCourse[];
  totalCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanManager: React.FC = () => {
  const { user } = useAuth();

  // State สำหรับ inline schedule editor
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editYear, setEditYear] = useState<number>(1);
  const [editSemester, setEditSemester] = useState<number>(1);
  // State สำหรับฟีเจอร์แนะนำวิชาที่ควรเรียนต่อ
  const [showRecommendPanel, setShowRecommendPanel] = useState<boolean>(false);
  // ปี+เทอมที่เลือกสำหรับแต่ละวิชาในฟีเจอร์แนะนำ
  const [recommendSelections, setRecommendSelections] = useState<Record<string, { year: number; semester: number }>>({});
  // Filter เลือกดูแค่เทอมเดียว ('1-1' | '1-2' | ...)
  const [viewFilter, setViewFilter] = useState<string>('1-1');
  // State สำหรับฟีเจอร์เพิ่มวิชาเรียน (manual)
  const [showAddCourseDialog, setShowAddCourseDialog] = useState<boolean>(false);
  const [addCourseFilterYear, setAddCourseFilterYear] = useState<string>('1');
  const [addCourseFilterSem, setAddCourseFilterSem] = useState<string>('all');
  const [addCourseSearch, setAddCourseSearch] = useState<string>('');
  const [addCourseSelections, setAddCourseSelections] = useState<Record<string, { year: number; semester: number }>>({}); 

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [availableCurriculumYears, setAvailableCurriculumYears] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>('');
  const [curriculumCourses, setCurriculumCourses] = useState<CurriculumCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const programs = Object.keys(courseDatabase);
      setAvailablePrograms(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('เกิดข้อผิดพลาดในการโหลดหลักสูตร');
    }
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      try {
        const years = Object.keys(courseDatabase[selectedProgram] || {});
        setAvailableCurriculumYears(years);
        if (years.length > 0 && !selectedCurriculumYear) {
          setSelectedCurriculumYear(years[0]);
        }
      } catch (err) {
        console.error('Error loading curriculum years:', err);
        setError('เกิดข้อผิดพลาดในการโหลดปีหลักสูตร');
      }
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedProgram && selectedCurriculumYear) {
      try {
        const courses: CurriculumCourse[] = [];
        const programData = courseDatabase[selectedProgram]?.[selectedCurriculumYear];

        if (programData) {
          Object.entries(programData).forEach(([semesterKey, semesterCourses]: [string, any]) => {
            if (Array.isArray(semesterCourses)) {
              const [year, semester] = semesterKey.split('-').map(Number);
              semesterCourses.forEach((course: any) => {
                courses.push({
                  ...course,
                  year,
                  semester
                });
              });
            }
          });
        }

        setCurriculumCourses(courses);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('เกิดข้อผิดพลาดในการโหลดรายวิชา');
      }
    }
  }, [selectedProgram, selectedCurriculumYear]);

  const isInternshipCourse = useCallback((course: Pick<StudentCourse, 'code' | 'originalName' | 'subCategory'>): boolean => {
    const code = (course.code || '').trim();
    const name = (course.originalName || '').trim();
    const subCategory = course.subCategory || '';
    const isInternshipCategory = subCategory === 'กลุ่มวิชาฝึกงาน/สหกิจศึกษา';
    const looksLikeInternship = name.includes('ฝึกงาน') || name.includes('ฝึกปฏิบัติงาน');
    const isInternshipCode = code.includes('060233403');
    const isCoop = name.includes('สหกิจ');
    const isProject = name.includes('โครงงาน');
    return (isInternshipCode || (isInternshipCategory && looksLikeInternship)) && !isCoop && !isProject;
  }, []);

  const extractCodeToken = useCallback((text: string): { full?: string; digits?: string } | null => {
    const t = (text || '').trim();
    if (!t) return null;
    if (t.includes('โดยความเห็นชอบ')) return null;
    if (t.includes('ความเห็นชอบของภาควิชา')) return null;
    if (t.includes('ตามความเห็นชอบ')) return null;

    const full = t.match(/[A-Z]{2,6}-\d{6,9}/)?.[0];
    const digits = t.match(/\d{6,9}/)?.[0];
    if (!full && !digits) return null;
    return { ...(full ? { full } : {}), ...(digits ? { digits } : {}) };
  }, []);

  const buildCourseIndex = useCallback((courses: StudentCourse[]) => {
    const byDigits = new Map<string, StudentCourse>();
    const byFull = new Map<string, StudentCourse>();
    for (const c of courses) {
      const code = (c.code || '').trim();
      if (code) byFull.set(code, c);
      const digits = code.match(/\d{6,9}/)?.[0];
      if (digits) byDigits.set(digits, c);
    }
    return { byDigits, byFull };
  }, []);

  const getPrerequisiteIssues = useCallback((course: StudentCourse, allCourses: StudentCourse[]) => {
    const prerequisites = course.prerequisites || [];
    if (prerequisites.length === 0) {
      return { missing: [] as string[], failed: [] as string[] };
    }

    const { byDigits, byFull } = buildCourseIndex(allCourses);
    const missing: string[] = [];
    const failed: string[] = [];

    for (const prereq of prerequisites) {
      const token = extractCodeToken(prereq);
      if (!token) continue;

      const target =
        (token.full ? byFull.get(token.full) : undefined) ||
        (token.digits ? byDigits.get(token.digits) : undefined);

      if (!target) continue;

      const grade = (target.grade || '').trim().toUpperCase();
      if (!grade) {
        missing.push(target.code);
        continue;
      }
      if (grade === 'F' || grade === 'U') {
        failed.push(target.code);
      } else if (grade === 'I' || grade === 'W') {
        missing.push(target.code);
      }
    }

    return { missing, failed };
  }, [buildCourseIndex, extractCodeToken]);

  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!user?.id) return;

      try {
        const existingPlan = await firebaseService.getStudyPlanByStudentId(user.id);

        if (existingPlan && existingPlan.program && existingPlan.curriculumYear) {
          const convertedCourses: StudentCourse[] = (existingPlan.courses || []).map((course: any) => {
            let code = course.code || 'N/A';
            const originalName = course.originalName || course.name || 'N/A';

            // Auto-correct wrong course code for language elective 3 in INE 62
            if (existingPlan.program === 'INE' &&
              (existingPlan.curriculumYear === '62' || existingPlan.curriculumYear === '62 สหกิจ') &&
              course.year === 2 &&
              course.semester === 1 &&
              (code.trim() === 'INE-080303xxx' || code.trim() === '080303xxx')) {
              code = 'INE-080103xxx  ';
            }

            const subCategory = course.subCategory;
            const internship = isInternshipCourse({ code, originalName, subCategory });
            let status = course.status || 'planned';
            let grade = course.grade || '';

            if (internship) {
              if (status === 'completed' && !grade) {
                grade = 'S';
              } else if (grade !== 'S') {
                grade = '';
              }
            }

            // Sync status with grade if grade is set
            if (grade) {
              if (grade === 'F' || grade === 'U') {
                status = 'failed';
              } else if (grade === 'I' || grade === 'W') {
                status = 'in_progress';
              } else {
                status = 'completed'; // A, B+, B, C+, C, D+, D, S
              }
            } else {
              // No grade: cannot be completed or failed
              if (status === 'completed' || status === 'failed') {
                status = 'planned';
              }
            }

            return {
              id: course.id || `course-${Date.now()}-${Math.random()}`,
              code,
              originalName,
              customName: course.customName,
              credits: course.credits || 0,
              year: course.year || 1,
              semester: course.semester || 1,
              status,
              grade,
              category: course.category || 'core',
              mainCategory: course.mainCategory,
              subCategory,
              prerequisites: course.prerequisites || [],
              isElective: course.isElective || course.category === 'elective' || course.category === 'general' || course.category === 'free' || course.subCategory === 'กลุ่มวิชาชีพ' || ((originalName || '').includes('วิชาเลือก'))
            };
          });
          setStudyPlan({
            id: existingPlan.id,
            studentId: user.id,
            studentEmail: existingPlan.studentEmail || user.email || '',
            program: existingPlan.program,
            curriculumYear: existingPlan.curriculumYear,
            isLocked: existingPlan.isLocked !== false,
            courses: convertedCourses,
            totalCredits: existingPlan.totalCredits || 0,
            createdAt: new Date(existingPlan.createdAt),
            updatedAt: new Date(existingPlan.updatedAt)
          });
          // โหลด curriculumCourses สำหรับฟีเจอร์แนะนำวิชา
          setSelectedProgram(existingPlan.program);
          setSelectedCurriculumYear(existingPlan.curriculumYear);
        }
      } catch (err) {
        console.error('Error loading study plan:', err);
        setError('เกิดข้อผิดพลาดในการโหลดแผนการเรียน');
      }
    };

    loadStudyPlan();
  }, [user?.id, user?.email, isInternshipCourse]);

  // หา course code digits สำหรับเปรียบเทียบ prerequisite
  const getCourseDigits = useCallback((code: string): string => {
    return (code || '').match(/\d{6,9}/)?.[0] || '';
  }, []);

  // Cascade clear เกรดวิชาที่ depend กับ courseCode ที่กำหนด (และลูกหลานทั้งหมด)
  const cascadeClearGrades = useCallback((courses: StudentCourse[], failedCourseCode: string): StudentCourse[] => {
    const failedDigits = getCourseDigits(failedCourseCode);
    const failedFull = (failedCourseCode || '').trim();

    // หาวิชาที่ต้องล้างเกรด (depend กับ failedCourseCode)
    const dependentIds = new Set<string>();

    const collectDependents = (code: string, digits: string) => {
      courses.forEach(c => {
        if (dependentIds.has(c.id)) return;
        const prereqs = c.prerequisites || [];
        const depends = prereqs.some(p => {
          const pFull = (p || '').trim();
          const pDigits = getCourseDigits(p);
          return (
            (pFull && pFull === code) ||
            (pDigits && pDigits === digits)
          );
        });
        if (depends && c.grade) {
          dependentIds.add(c.id);
          // recursive: ล้างวิชาที่ depend กับวิชานี้ด้วย
          collectDependents((c.code || '').trim(), getCourseDigits(c.code));
        }
      });
    };

    collectDependents(failedFull, failedDigits);

    if (dependentIds.size === 0) return courses;

    return courses.map(c => {
      if (!dependentIds.has(c.id)) return c;
      return { ...c, grade: '', status: 'planned' as const };
    });
  }, [getCourseDigits]);

  const updateCourseGrade = useCallback((courseId: string, grade: string) => {
    if (!studyPlan) return;

    const course = studyPlan.courses.find(c => c.id === courseId);
    if (!course) return;

    // ========================================================
    // เช็ค prerequisite เฉพาะเมื่อยังไม่มีเกรด (ใส่ครั้งแรก)
    // ถ้ามีเกรดแล้ว (กำลังแก้ไข) ให้ข้ามการเช็ค
    // เพื่อให้แก้เกรดวิชา A เป็น F ได้แม้วิชา B จะมีเกรดอยู่
    // ========================================================
    if (!course.grade) {
      const prereqIssues = getPrerequisiteIssues(course, studyPlan.courses);
      if (prereqIssues.missing.length > 0) {
        alert(`วิชานี้มีวิชาที่ต้องเรียนก่อน\nกรุณาใส่เกรดวิชา prerequisite ก่อน: ${prereqIssues.missing.join(', ')}`);
        return;
      }
      if (prereqIssues.failed.length > 0) {
        alert(`ไม่สามารถใส่เกรดได้ เพราะวิชาที่ต้องก่อนเรียน (${prereqIssues.failed.join(', ')}) ติด F`);
        return;
      }
    }

    // ==========================================================
    // 🎓 เงื่อนไขการใส่เกรดวิชาฝึกงาน (Internship (S/U เท่านั้น)
    // - S = ผ่าน ✅ นับหน่วยกิต (completed) แต่ไม่นับ GPA
    // - U = ไม่ผ่าน ❌ ไม่นับหน่วยกิต (ไม่ completed) และไม่นับ GPA
    // ==========================================================
    if (isInternshipCourse(course) && grade !== '' && grade !== 'S' && grade !== 'U') {
      alert(
        'วิชาฝึกงาน / สหกิจศึกษา ใส่ได้เฉพาะ 2 เกรดเท่านั้น:\n' +
        '✅ S = ผ่าน (นับหน่วยกิต แต่ไม่นับ GPA\n' +
        '❌ U = ไม่ผ่าน (ไม่นับหน่วยกิต และไม่นับ GPA'
      );
      return;
    }

    // อัพเดทเกรดวิชาตัวเอง
    let updatedCourses = studyPlan.courses.map(c => {
      if (c.id !== courseId) return c;

      let status: 'planned' | 'in_progress' | 'completed' | 'failed' = 'planned';
      let finalGrade = grade;

      if (grade === 'in_progress') {
        status = 'in_progress';
        finalGrade = '';
      } else if (grade) {
        if (grade === 'F' || grade === 'U') {
          status = 'failed';
        } else if (grade === 'I' || grade === 'W') {
          status = 'in_progress';
        } else {
          status = 'completed'; // A, B+, B, C+, C, D+, D, S — completed
        }
      }

      return {
        ...c,
        grade: finalGrade,
        status
      };
    });

    // ==========================================================
    // Cascade clear: ถ้าเกรดใหม่เป็น F, U, W, I หรือว่าง
    // ให้ล้างเกรดวิชาทุกวิชาที่ depend กับวิชานี้ (และลูกหลาน)
    // ==========================================================
    const isFailingGrade = !grade || grade === 'F' || grade === 'U' || grade === 'W' || grade === 'I';
    if (isFailingGrade) {
      updatedCourses = cascadeClearGrades(updatedCourses, course.code);
    }

    const newTotalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      totalCredits: newTotalCredits,
      updatedAt: new Date()
    } : null);

    saveToFirebase({ courses: updatedCourses, totalCredits: newTotalCredits });
  }, [studyPlan, isInternshipCourse, getPrerequisiteIssues, cascadeClearGrades]);

  // เปรียบเทียบลำดับเทอม: คืนค่า true ถ้า (y1,s1) อยู่ก่อนหรือเทอมเดียวกับ (y2,s2)
  const isBeforeOrSame = useCallback((y1: number, s1: number, y2: number, s2: number) =>
    y1 < y2 || (y1 === y2 && s1 <= s2)
    , []);

  // ย้ายวิชาไปปี/เทอมใหม่ พร้อม validation prerequisite order
  const moveCourse = useCallback((courseId: string, newYear: number, newSemester: number) => {
    if (!studyPlan) return;

    const course = studyPlan.courses.find(c => c.id === courseId);
    if (!course) return;

    // ถ้าย้ายไป unscheduled (0,0) ข้ามการตรวจ
    if (newYear === 0 || newSemester === 0) {
      const updatedCourses = studyPlan.courses.map(c =>
        c.id === courseId ? { ...c, year: newYear, semester: newSemester } : c
      );
      setStudyPlan(prev => prev ? { ...prev, courses: updatedCourses, updatedAt: new Date() } : null);
      saveToFirebase({ courses: updatedCourses });
      setEditingSchedule(null);
      return;
    }

    const allCourses = studyPlan.courses;

    // ── ตรวจ 1: prerequisite ของวิชานี้ต้องอยู่ก่อนเทอมใหม่ ──
    const prereqsInConflict: string[] = [];
    for (const prereq of (course.prerequisites || [])) {
      const token = extractCodeToken(prereq);
      if (!token) continue;
      const prereqCourse = allCourses.find(c => {
        const code = (c.code || '').trim();
        const digits = code.match(/\d{6,9}/)?.[0];
        return (token.full && code === token.full) || (token.digits && digits === token.digits);
      });
      if (!prereqCourse || prereqCourse.year === 0 || prereqCourse.semester === 0) continue;
      // prerequisite ต้องอยู่ก่อน (ไม่ใช่เทอมเดียวกันหรือหลัง)
      if (!isBeforeOrSame(prereqCourse.year, prereqCourse.semester, newYear - 1, newSemester) &&
        !(prereqCourse.year < newYear || (prereqCourse.year === newYear && prereqCourse.semester < newSemester))) {
        prereqsInConflict.push(prereqCourse.code);
      }
    }

    if (prereqsInConflict.length > 0) {
      alert(
        `❌ ไม่สามารถย้ายได้\n\nวิชา ${prereqsInConflict.join(', ')} เป็น prerequisite ที่ต้องเรียนก่อน\nต้องให้ ${prereqsInConflict.join(', ')} อยู่ในเทอมก่อนปีที่ ${newYear} เทอม ${newSemester}`
      );
      return;
    }

    // ── ตรวจ 2: วิชาลูก (dependent) ต้องไม่อยู่ก่อนหรือเทอมเดียวกับเทอมใหม่ ──
    const dependentsInConflict: string[] = [];
    for (const other of allCourses) {
      if (other.id === courseId) continue;
      if (other.year === 0 || other.semester === 0) continue;
      const deps = (other.prerequisites || []);
      const depends = deps.some(p => {
        const token = extractCodeToken(p);
        if (!token) return false;
        const code = (course.code || '').trim();
        const digits = code.match(/\d{6,9}/)?.[0];
        return (token.full && code === token.full) || (token.digits && digits === token.digits);
      });
      if (depends) {
        // วิชาลูกต้องอยู่ หลัง เทอมใหม่
        if (other.year < newYear || (other.year === newYear && other.semester <= newSemester)) {
          dependentsInConflict.push(other.code);
        }
      }
    }

    if (dependentsInConflict.length > 0) {
      alert(
        `❌ ไม่สามารถย้ายได้\n\nวิชา ${dependentsInConflict.join(', ')} ต้องเรียนหลังจากวิชานี้ แต่ขณะนี้อยู่ในเทอมที่เท่ากันหรือก่อนหน้า\nย้าย ${dependentsInConflict.join(', ')} ออกก่อน หรือเลือกเทอมที่เร็วกว่านั้น`
      );
      return;
    }

    const updatedCourses = studyPlan.courses.map(c =>
      c.id === courseId ? { ...c, year: newYear, semester: newSemester } : c
    );

    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      updatedAt: new Date()
    } : null);

    saveToFirebase({ courses: updatedCourses });
    setEditingSchedule(null);
  }, [studyPlan, extractCodeToken, isBeforeOrSame]);


  // นำวิชาออกจากตาราง → ลบออกจาก array จริงๆ เพื่อให้กลับมาในฟีเจอร์แนะนำ/เพิ่มวิชาได้
  const removeCourse = useCallback((courseId: string) => {
    if (!studyPlan) return;
    const course = studyPlan.courses.find(c => c.id === courseId);
    if (!course) return;
    if (course.grade) {
      alert('ไม่สามารถนำวิชาที่มีเกรดแล้วออกจากตารางได้\nกรุณาล้างเกรดก่อน');
      return;
    }
    const updatedCourses = studyPlan.courses.filter(c => c.id !== courseId);
    const newTotalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      totalCredits: newTotalCredits,
      updatedAt: new Date()
    } : null);
    // saveToFirebase ถูก define หลัง removeCourse ใน component body
    // จึง call ผ่าน setTimeout เพื่อหลีกเลี่ยง TDZ crash
    setTimeout(() => {
      firebaseService.getStudyPlanByStudentId(studyPlan.studentId).then(existingPlan => {
        if (!existingPlan) return;
        const coursesForFirebase = updatedCourses.map(c => ({
          ...c,
          name: c.customName || c.originalName,
          prerequisites: c.prerequisites || []
        }));
        firebaseService.updateStudyPlan(existingPlan.id, {
          courses: coursesForFirebase,
          totalCredits: newTotalCredits
        });
      }).catch(err => console.error('Error saving after remove:', err));
    }, 0);
  }, [studyPlan]);

  const updateCustomCourseName = useCallback((courseId: string, customName: string) => {

    if (!studyPlan) return;

    const updatedCourses = studyPlan.courses.map(c =>
      c.id === courseId ? { ...c, customName } : c
    );

    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      updatedAt: new Date()
    } : null);

    saveToFirebase({ courses: updatedCourses });
  }, [studyPlan]);

  const saveToFirebase = useCallback(async (updates: Partial<StudyPlan>) => {
    if (!studyPlan) return;
    try {
      const coursesForFirebase = (updates.courses || studyPlan.courses).map(course => {
        const internship = isInternshipCourse(course);
        const grade = internship ? (course.grade ? 'S' : '') : course.grade;
        return {
          ...course,
          grade,
          name: course.customName || course.originalName,
          prerequisites: course.prerequisites || []
        };
      });

      // Calculate GPA and credits using standard calculateGPA function
      const gpaResult = calculateGPA(coursesForFirebase as any);
      const curriculumRequiredTotal = getCurriculumTotalCredits(studyPlan.program, studyPlan.curriculumYear);
      const sumCoursesCredits = coursesForFirebase.reduce((sum, c) => sum + (c.credits || 0), 0);
      const totalCredits = Math.max(curriculumRequiredTotal, sumCoursesCredits);
      const completedCredits = gpaResult.completedCredits;
      const calculatedGPA = gpaResult.gpa;

      // DEBUG: Log the data being saved
      console.log('🔍 [StudyPlan Save Debug]', {
        completedCredits,
        totalCredits,
        calculatedGPA,
        program: studyPlan.program,
        curriculumYear: studyPlan.curriculumYear,
        courseCount: coursesForFirebase.length,
        completedCount: coursesForFirebase.filter(c => c.status === 'completed').length,
        studentId: studyPlan.studentId
      });

      // Update study plan in Firebase
      const planId = studyPlan.id && !studyPlan.id.startsWith('plan-') ? studyPlan.id : null;
      if (planId) {
        await firebaseService.updateStudyPlan(planId, {
          ...updates,
          program: studyPlan.program,
          curriculumYear: studyPlan.curriculumYear,
          curriculum: `${studyPlan.program}-${studyPlan.curriculumYear}`,
          courses: coursesForFirebase,
          completedCredits,
          totalCredits,
          gpa: calculatedGPA
        });
        // Sync GPA and credits to Firebase
        const syncResult = await firebaseService.updateStudentGPAAndCredits(
          studyPlan.studentId,
          calculatedGPA,
          completedCredits
        );
        console.log('✅ [GPA/Credits Synced]', { calculatedGPA, completedCredits, syncResult });
        return;
      }

      const existingPlan = await firebaseService.getStudyPlanByStudentId(studyPlan.studentId);
      if (!existingPlan) {
        console.warn('⚠️ Study plan not found for student:', studyPlan.studentId);
        return;
      }
      await firebaseService.updateStudyPlan(existingPlan.id, {
        ...updates,
        program: studyPlan.program,
        curriculumYear: studyPlan.curriculumYear,
        curriculum: `${studyPlan.program}-${studyPlan.curriculumYear}`,
        courses: coursesForFirebase,
        completedCredits,
        totalCredits,
        gpa: calculatedGPA
      });
      // Update GPA and credits
      const syncResult2 = await firebaseService.updateStudentGPAAndCredits(
        existingPlan.studentId,
        calculatedGPA,
        completedCredits
      );
      console.log('✅ [GPA/Credits Synced (alternative)]', { calculatedGPA, completedCredits, syncResult2 });
    } catch (err) {
      console.error('Error saving to Firebase:', err);
    }
  }, [studyPlan, isInternshipCourse]);

  // ตรวจสถานะ prerequisite สำหรับวิชาแนะนำ
  const getRecommendPrereqStatus = useCallback((course: CurriculumCourse): 'met' | 'not_met' => {
    if (!studyPlan) return 'not_met';
    const meaningfulPrereqs = (course.prerequisites || []).filter(p =>
      !p.includes('โดยความเห็นชอบ') &&
      !p.includes('ความเห็นชอบของภาควิชา') &&
      !p.includes('ตามความเห็นชอบ')
    );
    if (meaningfulPrereqs.length === 0) return 'met';

    for (const prereq of meaningfulPrereqs) {
      const token = extractCodeToken(prereq);
      if (!token) continue;
      const prereqCourse = studyPlan.courses.find(c => {
        const code = (c.code || '').trim();
        const digits = code.match(/\d{6,9}/)?.[0];
        return (token.full && code === token.full) || (token.digits && digits === token.digits);
      });
      if (!prereqCourse) return 'not_met';
      const grade = (prereqCourse.grade || '').trim().toUpperCase();
      if (!grade || grade === 'F' || grade === 'U' || grade === 'I' || grade === 'W') return 'not_met';
    }
    return 'met';
  }, [studyPlan, extractCodeToken]);

  // เพิ่มวิชาจาก curriculum เข้าแผนการเรียน
  const addRecommendedCourse = useCallback((course: CurriculumCourse, year: number, semester: number) => {
    if (!studyPlan) return;
    const newCourse: StudentCourse = {
      id: `course-${Date.now()}-${Math.random()}`,
      code: course.code,
      originalName: course.name,
      credits: course.credits,
      year,
      semester,
      status: 'planned',
      category: course.category,
      mainCategory: course.mainCategory,
      subCategory: course.subCategory,
      prerequisites: course.prerequisites || [],
      isElective: course.category === 'elective' || course.category === 'general' || course.category === 'free' || course.subCategory === 'กลุ่มวิชาชีพ' || (course.name || '').includes('วิชาเลือก')
    };
    const updatedCourses = [...studyPlan.courses, newCourse];
    const newTotalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      totalCredits: newTotalCredits,
      updatedAt: new Date()
    } : null);
    saveToFirebase({ courses: updatedCourses, totalCredits: newTotalCredits });
  }, [studyPlan, saveToFirebase]);

  const createStudyPlan = useCallback(async () => {
    if (!user?.id || !selectedProgram || !selectedCurriculumYear || curriculumCourses.length === 0) {
      alert('กรุณาเลือกหลักสูตรและปีหลักสูตรให้ครบถ้วน');
      return;
    }

    try {
      const initialCourses: StudentCourse[] = curriculumCourses
        .filter(course => {
          // ปี 1 เทอม 1 → เพิ่มทุกวิชาเสมอ ไม่ว่าจะมี prerequisite หรือไม่
          if (course.year === 1 && course.semester === 1) return true;
          // เทอมอื่น → เพิ่มเฉพาะวิชาที่ไม่มี prerequisite ที่มีความหมาย
          const meaningfulPrereqs = (course.prerequisites || []).filter(p =>
            !p.includes('โดยความเห็นชอบ') &&
            !p.includes('ความเห็นชอบของภาควิชา') &&
            !p.includes('ตามความเห็นชอบ')
          );
          return meaningfulPrereqs.length === 0;
        })
        .map((course, index) => ({
          id: `course-${Date.now()}-${index}`,
          code: course.code,
          originalName: course.name,
          credits: course.credits,
          year: course.year,
          semester: course.semester,
          status: 'planned' as const,
          category: course.category,
          mainCategory: course.mainCategory,
          subCategory: course.subCategory,
          prerequisites: course.prerequisites || [],
          isElective: course.category === 'elective' || course.category === 'general' || course.category === 'free' || course.subCategory === 'กลุ่มวิชาชีพ' || ((course.name || '').includes('วิชาเลือก'))
        }));

      const curriculumTotal = getCurriculumTotalCredits(selectedProgram, selectedCurriculumYear);

      const newPlan: StudyPlan = {
        id: '',
        studentId: user.id,
        studentEmail: user.email || '',
        program: selectedProgram,
        curriculumYear: selectedCurriculumYear,
        isLocked: true,
        courses: initialCourses,
        totalCredits: curriculumTotal,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const coursesForFirebase = initialCourses.map(course => ({
        ...course,
        name: course.originalName,
        prerequisites: course.prerequisites || []
      }));
      const planId = await firebaseService.createStudyPlan({
        studentId: newPlan.studentId,
        studentEmail: newPlan.studentEmail,
        program: newPlan.program,
        curriculumYear: newPlan.curriculumYear,
        isLocked: newPlan.isLocked,
        courses: coursesForFirebase,
        totalCredits: newPlan.totalCredits
      });
      if (!planId) {
        throw new Error('ไม่สามารถบันทึกแผนการเรียนได้');
      }

      setStudyPlan({ ...newPlan, id: planId });
    } catch (err) {
      console.error('Error creating study plan:', err);
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    }
  }, [user?.id, user?.email, selectedProgram, selectedCurriculumYear, curriculumCourses]);

  const resetStudyPlan = useCallback(async () => {
    if (!user?.id) return;
    const confirmed = window.confirm('ต้องการรีเซ็ตแผนการเรียนใช่ไหม?\nข้อมูลแผนการเรียนและเกรดที่บันทึกไว้จะถูกลบออกจากระบบ และต้องเลือกหลักสูตรใหม่อีกครั้ง');
    if (!confirmed) return;

    try {
      const ok = await firebaseService.deleteStudyPlansByStudentId(user.id);
      if (!ok) {
        alert('รีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setStudyPlan(null);
      setSelectedProgram('');
      setSelectedCurriculumYear('');
      setAvailableCurriculumYears([]);
      setCurriculumCourses([]);
      setError(null);
    } catch (err) {
      console.error('Error resetting study plan:', err);
      alert('รีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }, [user?.id]);

  const completedCourses = studyPlan?.courses?.filter(c => c.status === 'completed') || [];
  const inProgressCourses = studyPlan?.courses?.filter(c => c.status === 'in_progress') || [];
  const plannedCourses = studyPlan?.courses?.filter(c => c.status === 'planned') || [];

  // ==========================================================
  // Completed credits = เกรดผ่านเท่านั้น (ใช้ function สูตรกลาง)
  // - ฝึกงาน S → นับหน่วยกิต ✅
  // - ฝึกงาน U → ไม่นับหน่วยกิต ❌
  // - A, B+, B, C+, C, D+, D → นับหน่วยกิต ✅
  // - F, I, W → ไม่นับหน่วยกิต ❌
  // ==========================================================
  const completedCredits = (studyPlan?.courses || [])
    .filter(c => countsAsCompletedCredits(c.grade))
    .reduce((sum, c) => sum + (c.credits || 0), 0);

  // ==========================================================
  // GPA = คำนวณจากวิชาที่มีเกรดนับ GPA เท่านั้น
  // - S, U, I, W → ไม่นำเข้าสูตร GPA (ทั้งวิชาฝึกงานและวิชาอื่น)
  // - A, B+, B, C+, C, D+, D, F → นำเข้าสูตร GPA
  // ==========================================================
  const gradeableCourses = (studyPlan?.courses || []).filter(c => c.grade && isGradeCountedInGPA(c.grade));
  const gpaResult = calculateGPA(gradeableCourses as any);

  // วิชาที่ยังไม่ได้จัดตาราง (ถูกนำออก หรือ year/semester = 0)
  const unscheduledCourses = (studyPlan?.courses || []).filter(
    c => c.year === 0 || c.semester === 0
  );

  const groupedCourses = (studyPlan?.courses || [])
    .filter(c => c.year > 0 && c.semester > 0)
    .reduce((acc, course) => {
      const key = `${course.year}-${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(course);
      return acc;
    }, {} as Record<string, StudentCourse[]>);

  // วิชาในหลักสูตรที่มี prerequisite และยังไม่ได้อยู่ในแผนการเรียน
  const recommendedCourses = useMemo(() => {
    if (!studyPlan || curriculumCourses.length === 0) return [];
    const planCodesFull = new Set(
      studyPlan.courses.map(c => (c.code || '').trim()).filter(Boolean)
    );
    const planCodesDigits = new Set(
      studyPlan.courses.map(c => getCourseDigits(c.code)).filter(Boolean)
    );
    return curriculumCourses.filter(cc => {
      const meaningfulPrereqs = (cc.prerequisites || []).filter(p =>
        !p.includes('โดยความเห็นชอบ') &&
        !p.includes('ความเห็นชอบของภาควิชา') &&
        !p.includes('ตามความเห็นชอบ')
      );
      if (meaningfulPrereqs.length === 0) return false;
      const ccFull = (cc.code || '').trim();
      const ccDigits = getCourseDigits(cc.code);
      const alreadyInPlan =
        (ccFull && planCodesFull.has(ccFull)) ||
        (ccDigits && planCodesDigits.has(ccDigits));
      return !alreadyInPlan;
    });
  }, [studyPlan, curriculumCourses, getCourseDigits]);

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">เลือกหลักสูตรของคุณ</h2>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>หลักสูตร</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map(program => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ปีหลักสูตร</Label>
              <Select
                value={selectedCurriculumYear}
                onValueChange={setSelectedCurriculumYear}
                disabled={!selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกปีหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurriculumYears.map(year => (
                    <SelectItem key={year} value={year}>
                      หลักสูตร {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={createStudyPlan}
              disabled={!selectedProgram || !selectedCurriculumYear || curriculumCourses.length === 0}
              className="w-full"
            >
              ยืนยันและสร้างแผนการเรียน
            </Button>
          </CardContent>
        </Card>

        {curriculumCourses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่างรายวิชา ({curriculumCourses.length} วิชา)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {curriculumCourses.slice(0, 10).map(course => (
                  <div key={course.code} className="p-2 bg-muted rounded text-sm">
                    {course.code} - {course.name} ({course.credits} หน่วยกิต)
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการแผนการเรียน</h2>
          <p className="text-muted-foreground">
            หลักสูตร: {studyPlan.program} | ปีหลักสูตร: {studyPlan.curriculumYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={resetStudyPlan}>
            รีเซ็ตหลักสูตร
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">รายวิชาทั้งหมด</p>
                <p className="text-2xl font-bold">{studyPlan.courses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">เรียนจบแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{completedCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">กำลังเรียน</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">วางแผนเรียน</p>
                <p className="text-2xl font-bold text-orange-600">{plannedCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">เกรดเฉลี่ย (GPA)</p>
                <p className={`text-2xl font-bold ${getGPAColor(gpaResult.gpa)}`}>
                  {gpaResult.gpa > 0 ? gpaResult.gpa.toFixed(2) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== ปุ่ม แนะนำวิชาที่ควรเรียนต่อ + เพิ่มวิชาเรียน ===== */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => {
              if (!showRecommendPanel) {
                const defaults: Record<string, { year: number; semester: number }> = {};
                recommendedCourses.forEach(c => { defaults[c.code] = { year: c.year, semester: c.semester }; });
                setRecommendSelections(defaults);
              }
              setShowRecommendPanel(prev => !prev);
            }}
          >
            <Lightbulb className="w-4 h-4" />
            แนะนำวิชาที่ควรเรียนต่อ{(() => { const n = recommendedCourses.filter(c => getRecommendPrereqStatus(c) === 'met').length; return n > 0 ? ` (${n} วิชา)` : ''; })()}
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => {
              setAddCourseSearch('');
              setAddCourseFilterYear('1');
              setAddCourseFilterSem('all');
              setAddCourseSelections({});
              setShowAddCourseDialog(true);
            }}
          >
            <PlusCircle className="w-4 h-4" />
            เพิ่มวิชาเรียน
          </Button>
        </div>

        {showRecommendPanel && (
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  วิชาต่อเนื่องที่พร้อมลงทะเบียน
                </span>
                <button onClick={() => setShowRecommendPanel(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </CardTitle>
              <CardDescription>
                ค่าเริ่มต้นปี/เทอมอิงตามหลักสูตร สามารถปรับเปลี่ยนได้ก่อนกดเพิ่ม
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const metCourses = recommendedCourses.filter(c => getRecommendPrereqStatus(c) === 'met');

                const renderRow = (cc: CurriculumCourse) => {
                  const key = cc.code;
                  const sel = recommendSelections[key] || { year: cc.year, semester: cc.semester };

                  // หาวิชา prerequisite ที่ผ่านแล้วพร้อมชื่อ+เกรด
                  const meaningfulPrereqs = (cc.prerequisites || []).filter(p =>
                    !p.includes('โดยความเห็นชอบ') &&
                    !p.includes('ความเห็นชอบของภาควิชา') &&
                    !p.includes('ตามความเห็นชอบ')
                  );
                  const passedPrereqs = meaningfulPrereqs
                    .map(prereq => {
                      const token = extractCodeToken(prereq);
                      if (!token) return null;
                      const found = studyPlan?.courses.find(c => {
                        const code = (c.code || '').trim();
                        const digits = code.match(/\d{6,9}/)?.[0];
                        return (token.full && code === token.full) || (token.digits && digits === token.digits);
                      });
                      if (!found) return null;
                      return { name: found.customName || found.originalName, grade: found.grade };
                    })
                    .filter((x): x is { name: string; grade: string | undefined } => x !== null);

                  return (
                    <div key={key} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{cc.code} - {cc.name}</div>
                        <div className="text-xs text-muted-foreground">{cc.credits} หน่วยกิต{cc.mainCategory && ` | ${cc.mainCategory}`}</div>
                        {passedPrereqs.length > 0 && (
                          <div className="text-xs text-green-600 mt-0.5">
                            คุณผ่านวิชา {passedPrereqs.map(p => `${p.name}${p.grade ? ` (เกรด ${p.grade})` : ''}`).join(', ')} แล้ว จึงสามารถลงเรียนวิชานี้ได้
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={String(sel.year)}
                          onValueChange={v => setRecommendSelections(prev => ({ ...prev, [key]: { ...sel, year: Number(v) } }))}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(y => <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(sel.semester)}
                          onValueChange={v => setRecommendSelections(prev => ({ ...prev, [key]: { ...sel, semester: Number(v) } }))}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3].map(s => <SelectItem key={s} value={String(s)}>เทอม {s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => addRecommendedCourse(cc, sel.year, sel.semester)}
                        >
                          <Check className="w-3 h-3 mr-1" />เพิ่ม
                        </Button>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {metCourses.length > 0 ? (
                      <div className="space-y-2">
                        {metCourses.map(renderRow)}
                      </div>
                    ) : recommendedCourses.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <span className="text-3xl">🎉</span>
                        <p className="text-sm font-semibold text-green-700">
                          ครบถ้วนแล้ว! คุณได้เพิ่มวิชาต่อเนื่องครบตามหลักสูตรแล้ว
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ไม่มีวิชาที่ต้องเพิ่มเข้าแผนการเรียนอีก
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {curriculumCourses.length === 0
                          ? 'กำลังโหลดข้อมูลหลักสูตร...'
                          : 'ยังไม่มีวิชาต่อเนื่องที่พร้อมลงทะเบียน — โปรดระบุผลการเรียนวิชาก่อนหน้าให้ผ่านก่อน'}
                      </p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== Semester Selector Dropdown ===== */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
        <Label className="text-sm font-medium shrink-0">เลือกดูภาคเรียน:</Label>
        <Select value={viewFilter} onValueChange={setViewFilter}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="เลือกภาคเรียน" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].flatMap(y =>
              [1, 2, 3].map(s => (
                <SelectItem key={`${y}-${s}`} value={`${y}-${s}`}>
                  ปีที่ {y} ภาคเรียนที่ {s}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* ===== Single Semester Card ===== */}
      {(() => {
        const [selYear, selSem] = viewFilter.split('-').map(Number);
        const key = `${selYear}-${selSem}`;
        const courses = groupedCourses[key] || [];
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">ปีที่ {selYear} — ภาคเรียนที่ {selSem}</h3>
            <div>
              {(() => {
                const year = selYear;
                const semester = selSem;
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>ภาคเรียนที่ {semester}</span>
                      </CardTitle>
                      <CardDescription>
                        {courses.length} วิชา | {courses.reduce((sum, c) => sum + (c.credits || 0), 0)} หน่วยกิต
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {courses.map(course => (
                        <div key={course.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {course.code} - {course.customName || course.originalName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {course.credits} หน่วยกิต
                                {course.mainCategory && ` | ${course.mainCategory}`}
                              </div>
                              {course.prerequisites && course.prerequisites.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  เงื่อนไขก่อนเรียน: {course.prerequisites.join(', ')}
                                </div>
                              )}
                              {(() => {
                                // ตรวจสอบ prerequisite ลงเทอมเดียวกัน
                                const sameSemesterPrereqs: string[] = [];
                                if (course.prerequisites && course.prerequisites.length > 0) {
                                  for (const prereq of course.prerequisites) {
                                    const token = extractCodeToken(prereq);
                                    if (!token) continue;
                                    const prereqCourse = studyPlan.courses.find(c => {
                                      const code = (c.code || '').trim();
                                      const digits = code.match(/\d{6,9}/)?.[0];
                                      return (token.full && code === token.full) ||
                                        (token.digits && digits === token.digits);
                                    });
                                    if (
                                      prereqCourse &&
                                      prereqCourse.year === course.year &&
                                      prereqCourse.semester === course.semester &&
                                      prereqCourse.year > 0 && prereqCourse.semester > 0
                                    ) {
                                      sameSemesterPrereqs.push(prereqCourse.code);
                                    }
                                  }
                                }

                                const issues = getPrerequisiteIssues(course, studyPlan.courses);

                                if (sameSemesterPrereqs.length > 0) {
                                  return (
                                    <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1">
                                      ⚠️ วิชา {sameSemesterPrereqs.join(', ')} เป็น prerequisite และอยู่ในเทอมเดียวกัน — ต้องเรียนให้จบก่อนจึงจะลงวิชานี้ได้
                                    </div>
                                  );
                                }
                                if (issues.missing.length > 0) {
                                  return (
                                    <div className="text-xs text-red-600 mt-1">
                                      ต้องใส่เกรดวิชาก่อนเรียนก่อน: {issues.missing.join(', ')}
                                    </div>
                                  );
                                }
                                if (issues.failed.length > 0) {
                                  return (
                                    <div className="text-xs text-red-600 mt-1">
                                      วิชาก่อนเรียนติด F: {issues.failed.join(', ')}
                                    </div>
                                  );
                                }
                                if (!course.grade && course.prerequisites && course.prerequisites.length > 0) {
                                  const validPrereqs = course.prerequisites.filter(p =>
                                    !p.includes('โดยความเห็นชอบ') &&
                                    !p.includes('ความเห็นชอบของภาควิชา') &&
                                    !p.includes('ตามความเห็นชอบ')
                                  );
                                  if (validPrereqs.length > 0) {
                                    return (
                                      <div className="text-xs text-green-600 mt-1 font-medium">
                                        สามารถลงเกรดได้ เนื่องจากผ่านวิชา {validPrereqs.join(', ')} แล้ว
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <Badge
                                className={
                                  course.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    course.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      course.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }
                              >
                                {course.status === 'completed' ? 'เรียนจบ' :
                                  course.status === 'in_progress' ? 'กำลังเรียน' :
                                    course.status === 'failed' ? 'ไม่ผ่าน' :
                                      'วางแผน'}
                              </Badge>
                              {/* ปุ่มย้ายเทอม */}
                              <button
                                title="ย้ายปี/เทอม"
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => {
                                  if (editingSchedule === course.id) {
                                    setEditingSchedule(null);
                                  } else {
                                    setEditingSchedule(course.id);
                                    setEditYear(course.year);
                                    setEditSemester(course.semester);
                                  }
                                }}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              {/* ปุ่มนำออกจากตาราง */}
                              <button
                                title={course.grade ? 'ล้างเกรดก่อนนำออก' : 'นำออกจากตาราง'}
                                className={`p-1 rounded transition-colors ${course.grade ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-100 text-muted-foreground hover:text-red-600'}`}
                                onClick={() => !course.grade && removeCourse(course.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Schedule Editor */}
                          {editingSchedule === course.id && (
                            <div className="border rounded-lg p-2 bg-muted/50 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Pencil className="w-3 h-3" /> ย้ายวิชานี้ไปยัง
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">ปีที่</Label>
                                  <Select value={String(editYear)} onValueChange={v => setEditYear(Number(v))}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4, 5, 6, 7, 8].map(y => (
                                        <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">เทอมที่</Label>
                                  <Select value={String(editSemester)} onValueChange={v => setEditSemester(Number(v))}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3].map(s => (
                                        <SelectItem key={s} value={String(s)}>เทอมที่ {s}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-end gap-1 pb-0">
                                  <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => moveCourse(course.id, editYear, editSemester)}
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" />ย้าย
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => setEditingSchedule(null)}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {(course.isElective || course.subCategory === 'กลุ่มวิชาชีพ' || (course.originalName || '').includes('วิชาเลือก')) && (
                              <div className="space-y-1">
                                <Label className="text-xs">ชื่อวิชา (ถ้าต้องการแก้ไข)</Label>
                                <Input
                                  value={course.customName || ''}
                                  onChange={(e) => updateCustomCourseName(course.id, e.target.value)}
                                  placeholder="ใส่ชื่อวิชา"
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}

                            <div className="space-y-1">
                              <Label className="text-xs">สถานะ / เกรด</Label>
                              <Select
                                value={
                                  course.status === 'in_progress' && !course.grade
                                    ? 'in_progress'
                                    : isInternshipCourse(course)
                                      ? (course.grade === 'S' ? 'S' : (course.status === 'in_progress' ? 'in_progress' : 'none'))
                                      : (course.grade || (course.status === 'in_progress' ? 'in_progress' : 'none'))
                                }
                                onValueChange={(value) => {
                                  if (isInternshipCourse(course)) {
                                    if (value === 'in_progress') {
                                      updateCourseGrade(course.id, 'in_progress');
                                    } else {
                                      updateCourseGrade(course.id, value === 'none' ? '' : 'S');
                                    }
                                    return;
                                  }
                                  updateCourseGrade(course.id, value === 'none' ? '' : value);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="เลือกสถานะ/เกรด" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">- (วางแผน)</SelectItem>
                                  <SelectItem value="in_progress">กำลังเรียน</SelectItem>
                                  {isInternshipCourse(course) ? (
                                    <SelectItem value="S">S (ผ่าน)</SelectItem>
                                  ) : (
                                    getAvailableGrades().map(grade => (
                                      <SelectItem key={grade} value={grade}>
                                        {grade}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}

                      {courses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          ไม่มีรายวิชาในภาคเรียนนี้
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ===== Section: วิชาที่ยังไม่ได้จัดตาราง ===== */}
      {unscheduledCourses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-orange-700">
            <ArrowRightLeft className="w-5 h-5" />
            คลังวิชา — ยังไม่ได้จัดตาราง ({unscheduledCourses.length} วิชา)
          </h3>
          <p className="text-sm text-muted-foreground">
            วิชาด้านล่างถูกนำออกจากตาราง กดปุ่ม "จัดตาราง" เพื่อนำวิชากลับไปใส่ในภาคเรียนที่ต้องการ
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unscheduledCourses.map(course => (
              <div key={course.id} className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{course.code} - {course.customName || course.originalName}</div>
                    <div className="text-xs text-muted-foreground">
                      {course.credits} หน่วยกิต
                      {course.mainCategory && ` | ${course.mainCategory}`}
                    </div>
                  </div>
                </div>

                {/* Inline Schedule Editor for unscheduled */}
                {editingSchedule === course.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">ปีที่</Label>
                        <Select value={String(editYear)} onValueChange={v => setEditYear(Number(v))}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(y => (
                              <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">เทอมที่</Label>
                        <Select value={String(editSemester)} onValueChange={v => setEditSemester(Number(v))}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3].map(s => (
                              <SelectItem key={s} value={String(s)}>เทอมที่ {s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8" onClick={() => moveCourse(course.id, editYear, editSemester)}>
                        <Check className="w-3.5 h-3.5 mr-1" />จัดตาราง
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingSchedule(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-orange-300 hover:bg-orange-100"
                    onClick={() => {
                      setEditingSchedule(course.id);
                      setEditYear(1);
                      setEditSemester(1);
                    }}
                  >
                    <Pencil className="w-3 h-3 mr-1" />จัดตาราง
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ===== Dialog เพิ่มวิชาเรียน (manual) ===== */}
      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              เพิ่มวิชาเรียน
            </DialogTitle>
            <DialogDescription>
              เลือกวิชาจากหลักสูตรเพื่อเพิ่มเข้าแผนการเรียน
            </DialogDescription>
          </DialogHeader>

          {/* ตัวกรองและค้นหา */}
          <div className="space-y-3 border-b pb-3">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[140px] space-y-1">
                <Label className="text-xs">กรองตามปี (หลักสูตร)</Label>
                <Select value={addCourseFilterYear} onValueChange={setAddCourseFilterYear}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[140px] space-y-1">
                <Label className="text-xs">กรองตามเทอม (หลักสูตร)</Label>
                <Select value={addCourseFilterSem} onValueChange={setAddCourseFilterSem}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกเทอม</SelectItem>
                    {[1,2,3].map(s => <SelectItem key={s} value={String(s)}>เทอม {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="ค้นหาชื่อวิชาหรือรหัสวิชา..."
                value={addCourseSearch}
                onChange={e => setAddCourseSearch(e.target.value)}
              />
            </div>
          </div>

          {/* รายการวิชา */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {(() => {
                try {
                  const q = addCourseSearch.trim().toLowerCase();
                  const filtered = curriculumCourses.filter(c => {
                    const yearOk = String(c.year) === addCourseFilterYear;
                    const semOk = addCourseFilterSem === 'all' || String(c.semester) === addCourseFilterSem;
                    const textOk = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
                    return yearOk && semOk && textOk;
                  });

                  if (filtered.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-6">ไม่พบวิชาที่ตรงกัน</p>;
                  }

                  return filtered.map(cc => {
                    const existing = studyPlan?.courses.find(sc => {
                      const scCode = (sc.code || '').trim();
                      const ccCode = (cc.code || '').trim();
                      const scDigits = scCode.match(/\d{6,9}/)?.[0];
                      const ccDigits = ccCode.match(/\d{6,9}/)?.[0];
                      return scCode === ccCode || (scDigits && ccDigits && scDigits === ccDigits);
                    });

                    return (
                      <div key={cc.code} className={`flex items-start gap-3 p-2 rounded-lg border ${existing ? 'bg-muted/60' : 'bg-background'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cc.code} - {cc.name}</div>
                          <div className="text-xs text-muted-foreground">{cc.credits} หน่วยกิต | ปีที่ {cc.year} เทอม {cc.semester}{cc.mainCategory ? ` | ${cc.mainCategory}` : ''}</div>
                          {existing && (
                            <div className="text-xs text-amber-600 mt-0.5">
                              ⚠️ มีอยู่ในแผนแล้ว — ปีที่ {existing.year} เทอม {existing.semester}{existing.grade ? ` (เกรด ${existing.grade})` : ' (ยังไม่มีเกรด)'}
                            </div>
                          )}
                        </div>
                        {!existing && (() => {
                          const sel = addCourseSelections[cc.code] ?? { year: cc.year, semester: cc.semester };

                          const meaningfulPrereqs = (cc.prerequisites || []).filter(p =>
                            !p.includes('โดยความเห็นชอบ') &&
                            !p.includes('ความเห็นชอบของภาควิชา') &&
                            !p.includes('ตามความเห็นชอบ')
                          );

                          // Check 1: prerequisite ยังไม่ผ่าน (ไม่มีในแผน / ไม่มีเกรด / เกรด F)
                          const unmetMessages: string[] = [];
                          for (const prereq of meaningfulPrereqs) {
                            const token = extractCodeToken(prereq);
                            if (!token) continue;
                            const prereqCourse = studyPlan?.courses.find(c => {
                              const code = (c.code || '').trim();
                              const digits = code.match(/\d{6,9}/)?.[0];
                              return (token.full && code === token.full) || (token.digits && digits === token.digits);
                            });
                            if (!prereqCourse) {
                              const fromCurr = curriculumCourses.find(c => {
                                const code = (c.code || '').trim();
                                const digits = code.match(/\d{6,9}/)?.[0];
                                return (token.full && code === token.full) || (token.digits && digits === token.digits);
                              });
                              unmetMessages.push(`ยังไม่ได้เพิ่มวิชา "${fromCurr?.name || prereq}" เข้าแผน`);
                            } else {
                              const grade = (prereqCourse.grade || '').trim().toUpperCase();
                              if (!grade) {
                                unmetMessages.push(`ยังไม่ได้ใส่เกรดวิชา "${prereqCourse.customName || prereqCourse.originalName}"`);
                              } else if (['F', 'U', 'I', 'W'].includes(grade)) {
                                unmetMessages.push(`ไม่ผ่านวิชา "${prereqCourse.customName || prereqCourse.originalName}" (เกรด ${grade})`);
                              }
                            }
                          }
                          const hasUnmet = unmetMessages.length > 0;

                          // Check 2: prerequisite อยู่เทอมเดียวกันหรือหลังกว่า sel
                          const conflictingPrereqs: string[] = [];
                          if (!hasUnmet) {
                            for (const prereq of meaningfulPrereqs) {
                              const token = extractCodeToken(prereq);
                              if (!token) continue;
                              const prereqCourse = studyPlan?.courses.find(c => {
                                const code = (c.code || '').trim();
                                const digits = code.match(/\d{6,9}/)?.[0];
                                return (token.full && code === token.full) || (token.digits && digits === token.digits);
                              });
                              if (prereqCourse && prereqCourse.year > 0 && prereqCourse.semester > 0) {
                                const tooLate =
                                  prereqCourse.year > sel.year ||
                                  (prereqCourse.year === sel.year && prereqCourse.semester >= sel.semester);
                                if (tooLate) {
                                  conflictingPrereqs.push(`${prereqCourse.customName || prereqCourse.originalName} (ปีที่ ${prereqCourse.year} เทอม ${prereqCourse.semester})`);
                                }
                              }
                            }
                          }
                          const hasConflict = conflictingPrereqs.length > 0;

                          return (
                            <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                              <div className="flex items-center gap-1">
                                <Select value={String(sel.year)} onValueChange={v => setAddCourseSelections(prev => ({ ...prev, [cc.code]: { ...sel, year: Number(v) } }))}>
                                  <SelectTrigger className="h-7 w-20 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1,2,3,4,5,6,7,8].map(y => <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={String(sel.semester)} onValueChange={v => setAddCourseSelections(prev => ({ ...prev, [cc.code]: { ...sel, semester: Number(v) } }))}>
                                  <SelectTrigger className="h-7 w-16 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1,2,3].map(s => <SelectItem key={s} value={String(s)}>เทอม {s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  disabled={hasUnmet || hasConflict}
                                  onClick={() => {
                                    try {
                                      addRecommendedCourse(cc, sel.year, sel.semester);
                                    } catch (e) {
                                      console.error('Error adding course:', e);
                                    }
                                  }}
                                >
                                  <Check className="w-3 h-3 mr-1" />เพิ่ม
                                </Button>
                              </div>
                              {hasUnmet && (
                                <div className="text-xs text-orange-600 text-right max-w-[280px] space-y-0.5">
                                  {unmetMessages.map((msg, i) => (
                                    <div key={i}>⚠️ {msg}</div>
                                  ))}
                                </div>
                              )}
                              {!hasUnmet && hasConflict && (
                                <div className="text-xs text-red-600 text-right max-w-[280px]">
                                  ⛔ วิชาก่อนเรียน {conflictingPrereqs.join(', ')} ต้องอยู่ก่อนเทอมที่เลือก
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                } catch (e) {
                  return <p className="text-sm text-red-500 text-center py-6">เกิดข้อผิดพลาดในการโหลดรายวิชา</p>;
                }
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyPlanManager;

