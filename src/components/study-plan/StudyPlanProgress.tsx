import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types/course';
import { getHybridCurriculumData, HybridCourse } from '@/services/hybridCourseService';
import { firebaseService } from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3,
  Loader2,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

interface StudentCourseData {
  code: string;
  grade?: string;
  status: string;
  year?: number;
  semester?: number;
  originalName?: string;
  customName?: string;
}

interface StudyPlanData {
  program: string;
  curriculumYear: string;
  courses: StudentCourseData[];
}

type GradeStatus = 'passed' | 'failed' | 'incomplete' | 'none';

const StudyPlanProgress: React.FC = () => {
  const { user } = useAuth();
  const [studyPlanData, setStudyPlanData] = useState<StudyPlanData | null>(null);
  const [timelineData, setTimelineData] = useState<{ [year: number]: { [semester: number]: HybridCourse[] } }>({});
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Load student's study plan from Firebase
  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!user?.id) {
        setIsLoadingPlan(false);
        return;
      }

      try {
        setIsLoadingPlan(true);
        const existingPlan = await firebaseService.getStudyPlanByStudentId(user.id);

        if (existingPlan && existingPlan.program && existingPlan.curriculumYear) {
          setStudyPlanData({
            program: existingPlan.program,
            curriculumYear: existingPlan.curriculumYear,
            courses: (existingPlan.courses || []).map((c: any) => ({
              code: c.code || '',
              grade: c.grade,
              status: c.status || 'planned',
              year: c.year,
              semester: c.semester,
              originalName: c.originalName || c.name || '',
              customName: c.customName || ''
            }))
          });
        } else {
          setStudyPlanData(null);
        }
      } catch (err) {
        console.error('Error loading study plan:', err);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadStudyPlan();
  }, [user?.id]);

  // Load curriculum data using same method as CurriculumTimelineFlowchart
  useEffect(() => {
    const loadCourses = async () => {
      if (!studyPlanData) return;

      setIsLoadingCourses(true);
      const selectedCurriculum = `${studyPlanData.program} ${studyPlanData.curriculumYear}`;

      let programCode: string, curriculumYear: string;

      if (selectedCurriculum === 'IT 62 สหกิจ') {
        programCode = 'IT'; curriculumYear = '62 สหกิจ';
      } else if (selectedCurriculum === 'IT 67 สหกิจ') {
        programCode = 'IT'; curriculumYear = '67 สหกิจ';
      } else if (selectedCurriculum === 'INE 62 สหกิจ') {
        programCode = 'INE'; curriculumYear = '62 สหกิจ';
      } else if (selectedCurriculum === 'INE 67 สหกิจ') {
        programCode = 'INE'; curriculumYear = '67 สหกิจ';
      } else {
        programCode = studyPlanData.program;
        curriculumYear = studyPlanData.curriculumYear;
      }

      try {
        const hybridData = await getHybridCurriculumData(programCode, curriculumYear);
        setTimelineData(hybridData);
      } catch (error) {
        console.error('Error loading curriculum data:', error);
        setTimelineData({});
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [studyPlanData]);

  // Safety filter (same as CurriculumTimelineFlowchart)
  const sanitizeCourses = (courses: HybridCourse[]): HybridCourse[] => {
    const htmlTagBlacklist = new Set([
      'div', 'span', 'p', 'a', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th',
      'input', 'button', 'form', 'label', 'img', 'svg', 'script', 'style',
      'header', 'footer', 'section', 'article', 'aside', 'nav', 'main',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'iframe', 'meta',
      'link', 'title', 'head', 'body', 'html'
    ]);
    return (courses || []).filter(course => {
      if (!course) return false;
      if (!course.code || typeof course.code !== 'string') return false;
      if (!course.name || typeof course.name !== 'string') return false;
      const tn = course.name.trim(); const tc = course.code.trim();
      if (tn.length === 0 || tc.length === 0) return false;
      if (htmlTagBlacklist.has(tn.toLowerCase())) return false;
      if (htmlTagBlacklist.has(tc.toLowerCase())) return false;
      if (/^Course\s+\d+\s*-\s*Year/i.test(tn)) return false;
      if (course.credits === undefined || course.credits === null) return false;
      if (typeof course.credits === 'number' && course.credits <= 0) return false;
      return true;
    });
  };

  // Build semester layout FIRST (needed for matching)
  const selectedCurriculum = studyPlanData ? `${studyPlanData.program} ${studyPlanData.curriculumYear}` : '';

  const semesterLayout = useMemo(() => {
    if (isLoadingCourses || !timelineData || Object.keys(timelineData).length === 0) return [];
    const isCoopCurriculum = selectedCurriculum.includes('COOP') || selectedCurriculum.includes('สหกิจ');
    const layout: Array<{
      year: number; semester: number; courses: HybridCourse[]; label: string; isInternship: boolean;
    }> = [];
    Object.entries(timelineData)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, semesters]) => {
        Object.entries(semesters)
          .sort(([a], [b]) => Number(a) - Number(b))
          .forEach(([semester, rawCourses]) => {
            const courses = sanitizeCourses(rawCourses);
            let label = `เทอมที่ ${semester}`;
            let isInternship = false;
            if (isCoopCurriculum && Number(year) === 4) {
              if (semester === '1') { label = 'เทอมที่ 1'; isInternship = true; }
              else if (semester === '2') { label = 'เทอมที่ 2'; isInternship = true; }
            } else if (!isCoopCurriculum && semester === '3') {
              label = 'ฝึกงาน'; isInternship = true;
            }
            layout.push({ year: Number(year), semester: Number(semester), courses, label, isInternship });
          });
      });
    return layout;
  }, [selectedCurriculum, timelineData, isLoadingCourses]);

  // ============================================================
  // PRE-COMPUTED MATCHING ENGINE
  //
  // Runs ONCE after semesterLayout is built. Produces a stable Map
  // from flowchart course ID → StudentCourseData. This avoids the
  // bug where getGradeStatus and getDisplayGrade each call
  // findStudentCourse and mutate shared state.
  //
  // Matching strategy per flowchart course:
  //  1. Find student courses in the same (year, semester) with
  //     matching trimmed code → consume in order
  //  2. Fallback: match by trimmed code globally (unique only)
  //  3. Fallback: match by code without program prefix
  // ============================================================
  const courseGradeMap = useMemo(() => {
    const result = new Map<string, StudentCourseData>();
    if (!studyPlanData || semesterLayout.length === 0) return result;

    // Group student courses by (year-semester) → array
    const studentByPosition = new Map<string, StudentCourseData[]>();
    // Global index by trimmed code → array (preserving order)
    const studentByCode = new Map<string, StudentCourseData[]>();

    for (const sc of studyPlanData.courses) {
      const trimmed = (sc.code || '').trim();
      const stripped = trimmed.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');

      // By position
      if (sc.year && sc.semester) {
        const key = `${sc.year}-${sc.semester}`;
        if (!studentByPosition.has(key)) studentByPosition.set(key, []);
        studentByPosition.get(key)!.push(sc);
      }

      // By trimmed code
      if (trimmed) {
        if (!studentByCode.has(trimmed)) studentByCode.set(trimmed, []);
        studentByCode.get(trimmed)!.push(sc);
      }
      if (stripped && stripped !== trimmed) {
        if (!studentByCode.has(stripped)) studentByCode.set(stripped, []);
        studentByCode.get(stripped)!.push(sc);
      }
    }

    // Track consumed student courses (by their index in studyPlanData.courses)
    const consumed = new Set<number>();

    // Helper: find index of a student course in the original array
    const indexOf = (sc: StudentCourseData): number => {
      return studyPlanData.courses.indexOf(sc);
    };

    // PASS 1: Match by position (year+semester) + trimmed code
    for (const sem of semesterLayout) {
      const posKey = `${sem.year}-${sem.semester}`;
      const posStudents = studentByPosition.get(posKey) || [];

      for (const flowchartCourse of sem.courses) {
        const fcTrimmed = (flowchartCourse.code || '').trim();
        const fcStripped = fcTrimmed.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');

        // Find the first unconsumed student course in this position
        // that matches by trimmed code
        for (const sc of posStudents) {
          const idx = indexOf(sc);
          if (consumed.has(idx)) continue;

          const scTrimmed = (sc.code || '').trim();
          const scStripped = scTrimmed.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');

          if (scTrimmed === fcTrimmed || scStripped === fcStripped) {
            result.set(flowchartCourse.id, sc);
            consumed.add(idx);
            break;
          }
        }
      }
    }

    // PASS 2: Fallback for unmatched flowchart courses — match by code globally
    for (const sem of semesterLayout) {
      for (const flowchartCourse of sem.courses) {
        if (result.has(flowchartCourse.id)) continue; // already matched

        const fcTrimmed = (flowchartCourse.code || '').trim();
        const fcStripped = fcTrimmed.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');

        const candidates = studentByCode.get(fcTrimmed) || studentByCode.get(fcStripped) || [];
        for (const sc of candidates) {
          const idx = indexOf(sc);
          if (consumed.has(idx)) continue;
          result.set(flowchartCourse.id, sc);
          consumed.add(idx);
          break;
        }
      }
    }

    return result;
  }, [studyPlanData, semesterLayout]);

  // Simple lookups using pre-computed map
  const getGradeStatus = useCallback((course: Course): GradeStatus => {
    const sc = courseGradeMap.get(course.id);
    if (!sc || !sc.grade) return 'none';
    const grade = sc.grade.trim().toUpperCase();
    if (grade === 'F' || grade === 'U') return 'failed';
    if (grade === 'I') return 'incomplete';
    if (grade === 'W') return 'none';
    if (grade === 'S' || ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D'].includes(grade)) return 'passed';
    return 'none';
  }, [courseGradeMap]);

  const getDisplayGrade = useCallback((course: Course): string | null => {
    const sc = courseGradeMap.get(course.id);
    return sc?.grade || null;
  }, [courseGradeMap]);

  // === DIAGRAM ENGINE (copied from CurriculumTimelineFlowchart) ===
  const hasSemester3 = semesterLayout.some(sem => sem.semester === 3);
  const COURSE_WIDTH = 140;
  const COURSE_HEIGHT = hasSemester3 ? 90 : 100;
  const GUTTER_WIDTH = 20;
  const GUTTER_HEIGHT = hasSemester3 ? 15 : 18;
  const CLEARANCE = 6;

  const removeCodePrefix = (code: string) => code.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');
  const formatCredits = (credits: number) => {
    const lecture = credits; const lab = 0; const individual = credits * 2;
    return `${credits}(${lecture}-${lab}-${individual})`;
  };
  const calculateSemesterCredits = (courses: HybridCourse[]) => courses.reduce((sum, c) => sum + c.credits, 0);

  const getCourseRect = (semIndex: number, courseIndex: number) => {
    const x = semIndex * (COURSE_WIDTH + GUTTER_WIDTH);
    const y = courseIndex * (COURSE_HEIGHT + GUTTER_HEIGHT) + 60;
    return {
      x, y, width: COURSE_WIDTH, height: COURSE_HEIGHT,
      centerX: x + COURSE_WIDTH / 2, centerY: y + COURSE_HEIGHT / 2,
      left: x, right: x + COURSE_WIDTH, top: y, bottom: y + COURSE_HEIGHT
    };
  };

  const getConnectionPorts = (rect: any) => ({
    topCenter: { x: rect.centerX, y: rect.top },
    bottomCenter: { x: rect.centerX, y: rect.bottom },
    rightCenter: { x: rect.right, y: rect.centerY },
    leftCenter: { x: rect.left, y: rect.centerY },
    leftUpper: { x: rect.left, y: rect.centerY - 12 },
    leftLower: { x: rect.left, y: rect.centerY + 12 }
  });

  const findPrerequisites = useCallback((course: Course) => {
    const prereqIds: string[] = [];
    if (course.prerequisites && course.prerequisites.length > 0) {
      const validPrerequisites = course.prerequisites.filter(prereq =>
        prereq !== 'โดยความเห็นชอบของภาควิชา' && !prereq.includes('โดยความเห็นชอบของภาควิชา')
      );
      if (validPrerequisites.length === 0) return prereqIds;
      semesterLayout.forEach((semData) => {
        semData.courses.forEach((c) => {
          if (validPrerequisites.some(prereq => {
            const prereqCode = prereq.split(' ')[0];
            const courseCode = c.code.split('-')[1] || c.code;
            return prereqCode === courseCode;
          })) {
            prereqIds.push(c.id);
          }
        });
      });
    }
    return prereqIds;
  }, [semesterLayout]);

  const hasBlockingCourses = (startX: number, endX: number, y: number, startSemIndex: number, endSemIndex: number) => {
    for (let semIdx = startSemIndex + 1; semIdx < endSemIndex; semIdx++) {
      const semData = semesterLayout[semIdx];
      if (!semData) continue;
      for (let courseIdx = 0; courseIdx < semData.courses.length; courseIdx++) {
        const courseRect = getCourseRect(semIdx, courseIdx);
        const linePassesThroughCourse = y >= courseRect.top - CLEARANCE && y <= courseRect.bottom + CLEARANCE;
        const lineIsInHorizontalRange = startX < courseRect.right && endX > courseRect.left;
        if (linePassesThroughCourse && lineIsInHorizontalRange) return true;
      }
    }
    return false;
  };

  const generateOrthogonalPath = (
    startSemIndex: number, startCourseIndex: number,
    endSemIndex: number, endCourseIndex: number,
    usedLanes: Set<string>, endPortType: string = 'leftCenter'
  ) => {
    const startRect = getCourseRect(startSemIndex, startCourseIndex);
    const endRect = getCourseRect(endSemIndex, endCourseIndex);
    const startPorts = getConnectionPorts(startRect);
    const endPorts = getConnectionPorts(endRect);
    let startPort = startPorts.rightCenter;
    let endPort = endPorts[endPortType as keyof typeof endPorts];
    const pathPoints = [startPort];

    if (startSemIndex === endSemIndex) {
      pathPoints.push(endPort);
    } else {
      const isDirectPathBlocked = hasBlockingCourses(startPort.x, endPort.x, startPort.y, startSemIndex, endSemIndex);
      const verticalDistance = endPort.y - startPort.y;
      const isApproximatelySameLevel = Math.abs(verticalDistance) < CLEARANCE;

      if (isApproximatelySameLevel && !isDirectPathBlocked) {
        pathPoints.push(endPort);
      } else if (!isDirectPathBlocked) {
        const gutterX = startPort.x + GUTTER_WIDTH / 2;
        pathPoints.push({ x: gutterX, y: startPort.y });
        const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
        pathPoints.push({ x: targetGutterX, y: startPort.y });
        pathPoints.push({ x: targetGutterX, y: endPort.y });
        pathPoints.push(endPort);
      } else {
        const gutterX = startPort.x + GUTTER_WIDTH / 2;
        pathPoints.push({ x: gutterX, y: startPort.y });
        let routingY = endPort.y;
        const aboveY = Math.min(startRect.top, endRect.top) - GUTTER_HEIGHT / 2 - 3;
        const belowY = Math.max(startRect.bottom, endRect.bottom) + GUTTER_HEIGHT / 2 + 3;
        if (endPortType === 'leftUpper') routingY = aboveY;
        else if (endPortType === 'leftLower') routingY = belowY;
        else { routingY = Math.abs(aboveY - startPort.y) <= Math.abs(belowY - startPort.y) ? aboveY : belowY; }
        routingY = Math.max(routingY, 45);
        pathPoints.push({ x: gutterX, y: routingY });
        const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
        pathPoints.push({ x: targetGutterX, y: routingY });
        if (Math.abs(routingY - endPort.y) > CLEARANCE) {
          pathPoints.push({ x: targetGutterX, y: endPort.y });
        }
        pathPoints.push(endPort);
      }
    }
    return pathPoints;
  };

  const isSpecialBlueConnection = (prereqCourse: Course, targetCourse: Course) => {
    const prereqCode = prereqCourse.code.split('-')[1] || prereqCourse.code;
    const targetCode = targetCourse.code.split('-')[1] || targetCourse.code;
    return prereqCode === '060233112' && targetCode === '060233501';
  };

  // Generate arrow data
  const arrowData = useMemo(() => {
    const arrows: Array<{ id: string; pathPoints: Array<{ x: number; y: number }>; isSpecial?: boolean }> = [];
    const usedLanes = new Set<string>();
    const isINET67 = selectedCurriculum.includes('INET 67');

    semesterLayout.forEach((semData, semIndex) => {
      semData.courses.forEach((course, courseIndex) => {
        const prereqIds = findPrerequisites(course);
        if (isINET67 && course.code === 'INET-060233214') return;

        prereqIds.forEach((prereqId, prereqIndex) => {
          let prereqSemIndex = -1, prereqCourseIndex = -1;
          let prereqCourse: Course | null = null;
          semesterLayout.forEach((prevSem, prevSemIndex) => {
            const courseIdx = prevSem.courses.findIndex(c => c.id === prereqId);
            if (courseIdx !== -1 && prevSemIndex < semIndex) {
              prereqSemIndex = prevSemIndex; prereqCourseIndex = courseIdx; prereqCourse = prevSem.courses[courseIdx];
            }
          });

          if (prereqSemIndex >= 0 && prereqCourse) {
            let endPortType = 'leftCenter';
            if (prereqIds.length > 1) {
              if (prereqIndex === 0) endPortType = 'leftUpper';
              else if (prereqIndex === 1) endPortType = 'leftLower';
            }
            const pathPoints = generateOrthogonalPath(prereqSemIndex, prereqCourseIndex, semIndex, courseIndex, usedLanes, endPortType);
            const isSpecial = isSpecialBlueConnection(prereqCourse, course);
            arrows.push({ id: `${prereqId}-${course.id}`, pathPoints, isSpecial });
          }
        });
      });
    });
    return arrows;
  }, [semesterLayout, selectedCurriculum, findPrerequisites]);

  // Calculate stats
  const stats = useMemo(() => {
    let total = 0, passed = 0, failed = 0, incomplete = 0, noGrade = 0, passedCredits = 0, totalCredits = 0;
    semesterLayout.forEach(sem => {
      sem.courses.forEach(course => {
        total++; totalCredits += course.credits;
        const status = getGradeStatus(course);
        if (status === 'passed') { passed++; passedCredits += course.credits; }
        else if (status === 'failed') { failed++; }
        else if (status === 'incomplete') { incomplete++; }
        else { noGrade++; }
      });
    });
    return { total, passed, failed, incomplete, noGrade, passedCredits, totalCredits };
  }, [semesterLayout, getGradeStatus]);

  // Get box colors based on grade
  const getCourseBoxColors = (course: Course) => {
    const status = getGradeStatus(course);
    switch (status) {
      case 'passed': return { bg: '#dcfce7', border: '#22c55e', text: '#14532d' }; // green
      case 'failed': return { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' }; // red
      case 'incomplete': return { bg: '#fef9c3', border: '#eab308', text: '#713f12' }; // yellow
      default: return { bg: 'white', border: 'black', text: 'black' }; // default
    }
  };

  // Loading state
  if (isLoadingPlan) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูลแผนการเรียน...</p>
        </div>
      </div>
    );
  }

  // No study plan
  if (!studyPlanData) {
    return (
      <Card className="shadow-medium">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
            <h3 className="text-xl font-semibold">ยังไม่มีแผนการเรียน</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              กรุณาไปที่แท็บ "จัดการแผนการเรียน" เพื่อสร้างแผนการเรียนและกรอกเกรดก่อน 
              จากนั้นจึงกลับมาดูภาพรวมความคืบหน้าได้ที่หน้านี้
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
          ภาพรวมความคืบหน้าการเรียน
        </h2>
        <p className="text-lg text-muted-foreground">
          หลักสูตร {studyPlanData.program} {studyPlanData.curriculumYear}
        </p>
      </div>

      {/* Legend & Summary */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-green-500 bg-green-100"></div>
                <span className="text-sm font-medium">ผ่านแล้ว</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-yellow-500 bg-yellow-100"></div>
                <span className="text-sm font-medium">การประเมินผลยังไม่สมบูรณ์ (I)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-red-500 bg-red-100"></div>
                <span className="text-sm font-medium">ไม่ผ่าน (F)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-black bg-white"></div>
                <span className="text-sm font-medium">ยังไม่ได้ลงเกรด</span>
              </div>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1" /> ผ่าน {stats.passed} วิชา ({stats.passedCredits} หน่วยกิต)
              </Badge>
              {stats.incomplete > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
                  <AlertTriangle className="w-4 h-4 mr-1" /> การประเมินผลยังไม่สมบูรณ์ (I) {stats.incomplete} วิชา
                </Badge>
              )}
              {stats.failed > 0 && (
                <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                  <XCircle className="w-4 h-4 mr-1" /> ไม่ผ่าน {stats.failed} วิชา
                </Badge>
              )}
              <Badge className="bg-gray-100 text-gray-700 text-sm px-3 py-1">
                <Clock className="w-4 h-4 mr-1" /> เหลือ {stats.noGrade} วิชา
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ความคืบหน้าภาพรวม</span>
            <span className="text-sm text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.passed / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Loading courses */}
      {isLoadingCourses && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูลหลักสูตร...</p>
          </div>
        </div>
      )}

      {/* ========== SVG FLOWCHART (same as CurriculumTimelineFlowchart) ========== */}
      {!isLoadingCourses && semesterLayout.length > 0 && (
        <div className="space-y-4">
          {/* Flowchart Title */}
          <div className="text-center bg-white p-4 border-b-2 border-black">
            <h1 className="text-lg font-bold">
              แผนภูมิแสดงความต่อเนื่องหลักสูตร {studyPlanData.program}
              {selectedCurriculum.includes('สหกิจ') ? ' (สหกิจศึกษา)' : ` (ปี ${studyPlanData.curriculumYear})`}
            </h1>
          </div>

          {/* Flowchart Content */}
          <div className="bg-white overflow-x-auto">
            <div className="inline-block min-w-full p-4">
              {/* Semester Headers */}
              <div className="relative mb-2" style={{ 
                height: '40px',
                width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`
              }}>
                {semesterLayout.map((semData, index) => (
                  <div 
                    key={`year-${semData.year}-sem-${semData.semester}`} 
                    className="absolute text-center"
                    style={{
                      left: `${index * (COURSE_WIDTH + GUTTER_WIDTH)}px`,
                      width: `${COURSE_WIDTH}px`,
                      top: '0px'
                    }}
                  >
                    <div className="font-bold text-sm mb-1">
                      ปีที่ {semData.year} {semData.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Course Grid with SVG Arrows */}
              <div className="relative">
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  style={{ 
                    minHeight: hasSemester3 ? '500px' : '600px',
                    width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`,
                    height: `${Math.max(...semesterLayout.map(s => s.courses.length)) * (COURSE_HEIGHT + GUTTER_HEIGHT) + (hasSemester3 ? 150 : 200)}px`
                  }}
                >
                  <defs>
                    <marker
                      id="progress-arrowhead"
                      markerWidth="5.7"
                      markerHeight="4.75"
                      refX="5.5"
                      refY="2.375"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <polygon points="0 0, 5.7 2.375, 0 4.75" fill="#555" />
                    </marker>
                    <marker
                      id="progress-blueArrowhead"
                      markerWidth="5.7"
                      markerHeight="4.75"
                      refX="5.5"
                      refY="2.375"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <polygon points="0 0, 5.7 2.375, 0 4.75" fill="#1e40af" />
                    </marker>
                  </defs>
                  
                  {/* Render orthogonal prerequisite arrows */}
                  {arrowData.map((arrow, index) => {
                    const pathString = arrow.pathPoints.map((point, pointIndex) => 
                      `${pointIndex === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                    ).join(' ');
                    const strokeColor = arrow.isSpecial ? "#1e40af" : "#555";
                    return (
                      <path
                        key={`arrow-${index}`}
                        d={pathString}
                        stroke={strokeColor}
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#progress-arrowhead)"
                      />
                    );
                  })}
                </svg>

                {/* Course Boxes Grid */}
                <div className="relative" style={{ 
                  height: `${Math.max(...semesterLayout.map(s => s.courses.length)) * (COURSE_HEIGHT + GUTTER_HEIGHT) + (hasSemester3 ? 150 : 200)}px`,
                  width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`
                }}>
                  {semesterLayout.map((semData, semIndex) => 
                    semData.courses.map((course, courseIndex) => {
                      const rect = getCourseRect(semIndex, courseIndex);
                      const colors = getCourseBoxColors(course);
                      const gradeStatus = getGradeStatus(course);
                      const displayGrade = getDisplayGrade(course);

                      return (
                        <div
                          key={course.id}
                          id={`progress-course-${course.id}`}
                          className="absolute p-2 text-xs flex flex-col justify-between shadow-sm transition-all duration-300"
                          style={{ 
                            left: `${rect.x}px`,
                            top: `${rect.y}px`,
                            width: `${COURSE_WIDTH}px`,
                            height: `${COURSE_HEIGHT}px`,
                            backgroundColor: colors.bg,
                            border: `2px solid ${colors.border}`,
                            borderWidth: gradeStatus !== 'none' ? '3px' : '2px',
                          }}
                        >
                          {/* Course Code */}
                          <div className="font-bold text-center text-[12px] leading-tight px-2" style={{ color: colors.text }}>
                            {removeCodePrefix(course.code)}
                          </div>
                          
                          {/* Course Name */}
                          <div className="text-center leading-tight flex-1 flex items-center justify-center px-1" style={{ fontSize: '10px', color: colors.text }}>
                            <span className="line-clamp-none overflow-hidden w-full">
                              {course.name}
                            </span>
                          </div>
                          
                          {/* Grade Badge or Credits */}
                          {gradeStatus !== 'none' ? (
                            <div className="text-center font-bold text-[11px]" style={{ color: colors.text }}>
                              {gradeStatus === 'passed' ? `✓ เกรด ${displayGrade}` : gradeStatus === 'incomplete' ? `! เกรด I` : '✗ F'}
                            </div>
                          ) : (
                            <div className="text-center font-bold text-[10px]">
                              {formatCredits(course.credits)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  
                  {/* Credits Summary for each semester */}
                  {semesterLayout.map((semData, semIndex) => {
                    const maxCoursesInAnySemester = Math.max(...semesterLayout.map(s => s.courses.length));
                    const rect = getCourseRect(semIndex, maxCoursesInAnySemester);
                    
                    return (
                      <div
                        key={`summary-${semIndex}`}
                        className="absolute text-center text-sm font-bold border-t-2 border-black pt-2 bg-white"
                        style={{
                          left: `${rect.x}px`,
                          top: `${rect.y + 10}px`,
                          width: `${COURSE_WIDTH}px`
                        }}
                      >
                        {calculateSemesterCredits(semData.courses)} หน่วยกิต
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-4 border-2 border-black">
            <div className="text-center">
              <h3 className="font-bold mb-2">สรุปภาพรวม</h3>
              <div className="flex justify-center space-x-8 text-sm">
                <div>
                  <span className="font-bold">หน่วยกิตที่ผ่าน:</span> {stats.passedCredits} / {stats.totalCredits} หน่วยกิต
                </div>
                <div>
                  <span className="font-bold">วิชาที่ผ่าน:</span> {stats.passed} / {stats.total} วิชา
                </div>
                {stats.failed > 0 && (
                  <div>
                    <span className="font-bold text-red-600">ไม่ผ่าน:</span> {stats.failed} วิชา
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanProgress;
