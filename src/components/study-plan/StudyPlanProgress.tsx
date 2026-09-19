import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types/course';
import { getHybridCurriculumData, HybridCourse } from '@/services/hybridCourseService';
import { firebaseService } from '@/services/firebaseService';
import { getCurriculumSummaryCatalog } from '@/services/curriculumCatalogService';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudyPlan } from '@/hooks/useFirebaseData';
import { buildStudyPlanView, computeProgressKPI } from './studyPlanViewModel';
import { StudentPlanTimeline } from './StudentPlanTimeline';
import { Button } from '@/components/ui/button';
import { normalizeCodeForMatching } from './studyPlanIdentity';
import { getCurriculumTotalCredits } from '@/services/departmentService';
import { 
  CheckCircle2, 
  BarChart3,
  Loader2,
  AlertTriangle,
  BookOpen,
  Info,
  GraduationCap,
  Clock
} from 'lucide-react';

const StudyPlanProgress: React.FC = () => {
  const { user } = useAuth();
  const { studyPlan: firebaseStudyPlan, loading: isLoadingPlan } = useStudyPlan(user?.id || '');
  const [timelineData, setTimelineData] = useState<{ [year: number]: { [semester: number]: HybridCourse[] } }>({});
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Derived student enrolled track (direct from study plan)
  const isStudentPlanCoop = useMemo(() => {
    if (!firebaseStudyPlan) return false;
    const year = firebaseStudyPlan.curriculumYear || '';
    const prog = firebaseStudyPlan.program || '';
    const curr = (firebaseStudyPlan as any).curriculum || '';
    return (
      year.includes('สหกิจ') || year.includes('COOP') ||
      prog.includes('สหกิจ') || prog.includes('COOP') ||
      curr.includes('สหกิจ') || curr.includes('COOP')
    );
  }, [firebaseStudyPlan]);

  // Track toggle for curriculum tab: defaults to student's enrolled track
  const [selectedTrack, setSelectedTrack] = useState<'normal' | 'coop' | null>(null);

  // Sync selected track when student study plan loads or updates
  useEffect(() => {
    if (firebaseStudyPlan) {
      setSelectedTrack(isStudentPlanCoop ? 'coop' : 'normal');
    }
  }, [firebaseStudyPlan, isStudentPlanCoop]);

  // Derived current program and curriculum year
  const currentProgramCode = useMemo(() => {
    if (firebaseStudyPlan?.program) {
      return firebaseStudyPlan.program.replace(/[-_]COOP/i, '').replace(/\s*สหกิจ/i, '').trim();
    }
    return user?.department || 'INE';
  }, [firebaseStudyPlan?.program, user?.department]);

  const currentBaseYear = useMemo(() => {
    if (firebaseStudyPlan?.curriculumYear) {
      return firebaseStudyPlan.curriculumYear.replace(/\s*สหกิจ/i, '').replace(/[-_]COOP/i, '').trim();
    }
    if (currentProgramCode === 'ITI') return '66';
    if (currentProgramCode === 'ITT') return '67';
    return '62';
  }, [firebaseStudyPlan?.curriculumYear, currentProgramCode]);

  // Check if this program has a separate co-op track (both IT and INE have normal vs coop tracks)
  const hasCoopTrack = useMemo(() => {
    return currentProgramCode === 'INE' || currentProgramCode === 'IT';
  }, [currentProgramCode]);

  const isCurrentTrackCoop = useMemo(() => {
    if (!hasCoopTrack) return false;
    if (selectedTrack !== null) {
      return selectedTrack === 'coop';
    }
    return isStudentPlanCoop;
  }, [hasCoopTrack, selectedTrack, isStudentPlanCoop]);

  const currentCurriculumYear = useMemo(() => {
    if (!hasCoopTrack) return currentBaseYear;
    return isCurrentTrackCoop ? `${currentBaseYear} สหกิจ` : currentBaseYear;
  }, [hasCoopTrack, isCurrentTrackCoop, currentBaseYear]);

  const selectedCurriculum = `${currentProgramCode} ${currentCurriculumYear}`;

  // Personal plan view derived directly from student recorded data
  const requiredCredits = useMemo(() => {
    if (!firebaseStudyPlan?.program) return null;
    const c = getCurriculumTotalCredits(firebaseStudyPlan.program, firebaseStudyPlan.curriculumYear);
    return c > 0 ? c : null;
  }, [firebaseStudyPlan]);

  const personalView = useMemo(() => {
    if (!firebaseStudyPlan?.courses) return null;
    return buildStudyPlanView(firebaseStudyPlan.courses as any, requiredCredits);
  }, [firebaseStudyPlan, requiredCredits]);

  // Load curriculum data using same method as CurriculumTimelineFlowchart
  useEffect(() => {
    if (isLoadingPlan) return;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const hybridData = await getHybridCurriculumData(currentProgramCode, currentCurriculumYear);
        setTimelineData(hybridData);
      } catch (error) {
        console.error('Error loading curriculum data:', error);
        setTimelineData({});
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [isLoadingPlan, currentProgramCode, currentCurriculumYear]);

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
  const semesterLayout = useMemo(() => {
    if (isLoadingCourses || !timelineData || Object.keys(timelineData).length === 0) return [];
    const isCoopCurriculum = isCurrentTrackCoop;
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
              if (semester === '1') { label = 'เทอมที่ 1'; isInternship = false; }
              else if (semester === '2') { label = 'เทอมที่ 2 (สหกิจศึกษา)'; isInternship = true; }
            } else if (!isCoopCurriculum && semester === '3') {
              label = 'ฝึกงาน'; isInternship = true;
            }
            layout.push({ year: Number(year), semester: Number(semester), courses, label, isInternship });
          });
      });
    return layout;
  }, [isCurrentTrackCoop, timelineData, isLoadingCourses]);

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
            const prereqCode = normalizeCodeForMatching(prereq.split(' ')[0]);
            const courseCode = normalizeCodeForMatching(c.code);
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
    const prereqCode = normalizeCodeForMatching(prereqCourse.code);
    const targetCode = normalizeCodeForMatching(targetCourse.code);
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

  const officialCurriculum = useMemo(() => {
    const catalog = getCurriculumSummaryCatalog();
    return catalog.find(c => {
      if (isCurrentTrackCoop) {
        if (c.id === `${currentProgramCode}-${currentBaseYear}-COOP`) return true;
      }
      return (c.program === currentProgramCode && c.curriculumYear === currentCurriculumYear) ||
             c.id === `${currentProgramCode}-${currentCurriculumYear}`;
    });
  }, [currentProgramCode, currentCurriculumYear, currentBaseYear, isCurrentTrackCoop]);

  // Compute KPI progression comparing student passed courses/credits against official curriculum targets
  const kpi = useMemo(() => {
    if (!personalView) return null;
    return computeProgressKPI(
      personalView.passedCount,
      personalView.passedCredits,
      officialCurriculum?.totalCourses,
      officialCurriculum?.totalCredits ?? requiredCredits
    );
  }, [personalView, officialCurriculum, requiredCredits]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="academic-title text-2xl font-bold">
          ภาพรวมความคืบหน้าการเรียน
        </h2>
        <p className="academic-copy text-lg text-muted-foreground">
          หลักสูตร {currentProgramCode} {currentCurriculumYear}
        </p>
      </div>

      {/* Shared KPI — derived from personal recorded data */}
      {kpi && (
        <Card className="academic-panel shadow-soft border border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {/* Passed vs Target progression badge: e.g. INE 62: 47/50 วิชา · 126/135 หน่วยกิต */}
              <Badge className="academic-number bg-slate-900 text-white hover:bg-slate-800 text-sm px-3.5 py-1.5 font-medium shadow-xs">
                <GraduationCap className="w-4 h-4 mr-1.5 inline" />
                {currentProgramCode} {currentCurriculumYear}: {kpi.formattedProgress}
              </Badge>

              {/* Remaining / Missing status badge */}
              {kpi.formattedRemaining && (
                kpi.isCompleted ? (
                  <Badge className="academic-number bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm px-3.5 py-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 inline" />
                    {kpi.formattedRemaining}
                  </Badge>
                ) : (
                  <Badge className="academic-number bg-amber-100 text-amber-900 border border-amber-300 text-sm px-3.5 py-1.5 font-medium">
                    <Clock className="w-4 h-4 mr-1.5 text-amber-700 inline" />
                    {kpi.formattedRemaining}
                  </Badge>
                )
              )}

              {/* Progress Percentage Badge */}
              {kpi.progressPercent !== null && (
                <Badge className="academic-number bg-blue-100 text-blue-800 border border-blue-200 text-sm px-3.5 py-1.5 font-medium">
                  <BarChart3 className="w-4 h-4 mr-1.5 text-blue-600 inline" />
                  สัดส่วนที่ผ่าน {kpi.progressPercent}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2.5">
              * ยอดนี้เป็นผลรวมจากรายวิชาที่บันทึกไว้ในแผนของฉัน เทียบกับเกณฑ์โครงสร้างหลักสูตร ไม่ใช่การตรวจสอบเงื่อนไขสำเร็จการศึกษาอย่างเป็นทางการ
            </p>
          </CardContent>
        </Card>
      )}

      {/* Two-view Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1">📋 แผนของฉัน</TabsTrigger>
          <TabsTrigger value="curriculum" className="flex-1">🗺️ โครงสร้างหลักสูตร</TabsTrigger>
        </TabsList>

        {/* Personal plan tab — derived from recorded data */}
        <TabsContent value="personal">
          {personalView ? (
            <StudentPlanTimeline
              view={personalView}
              program={firebaseStudyPlan?.program || currentProgramCode}
              curriculumYear={firebaseStudyPlan?.curriculumYear || currentCurriculumYear}
            />
          ) : !firebaseStudyPlan ? (
            <Card className="academic-panel shadow-medium my-4">
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>กำลังโหลดแผนการเรียน...</p>
            </div>
          )}
        </TabsContent>

        {/* Curriculum reference SVG tab — keeps existing flowchart */}
        <TabsContent value="curriculum">
          {/* Track Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border-2 border-black mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">โครงสร้างหลักสูตร:</span>
              <Badge className="bg-black text-white text-xs px-2.5 py-1">
                {hasCoopTrack
                  ? (isCurrentTrackCoop ? '💼 โครงการสหกิจศึกษา' : '📘 โครงการปกติ') + ` (หลักสูตร ${currentProgramCode} ${currentCurriculumYear})`
                  : `หลักสูตร ${currentProgramCode} ${currentCurriculumYear}`}
              </Badge>
              {officialCurriculum && (
                <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-medium border-neutral-400 bg-neutral-50 text-neutral-800">
                  เกณฑ์รวม {officialCurriculum.totalCourses} วิชา · {officialCurriculum.totalCredits} หน่วยกิต
                </Badge>
              )}
              {firebaseStudyPlan && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  (แสดงผลเริ่มต้นตามแผนการเรียนของคุณ)
                </span>
              )}
            </div>

            {/* Track Switcher: segmented buttons */}
            {hasCoopTrack && (
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg border border-neutral-300">
                <Button
                  type="button"
                  size="sm"
                  variant={!isCurrentTrackCoop ? "default" : "ghost"}
                  onClick={() => setSelectedTrack('normal')}
                  className={!isCurrentTrackCoop 
                    ? "bg-black text-white shadow-xs text-xs font-semibold px-3 py-1.5 h-8 hover:bg-neutral-800" 
                    : "text-neutral-600 hover:text-black text-xs font-medium px-3 py-1.5 h-8 hover:bg-neutral-200/60"}
                >
                  📘 แผนปกติ ({currentBaseYear})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isCurrentTrackCoop ? "default" : "ghost"}
                  onClick={() => setSelectedTrack('coop')}
                  className={isCurrentTrackCoop 
                    ? "bg-black text-white shadow-xs text-xs font-semibold px-3 py-1.5 h-8 hover:bg-neutral-800" 
                    : "text-neutral-600 hover:text-black text-xs font-medium px-3 py-1.5 h-8 hover:bg-neutral-200/60"}
                >
                  💼 แผนสหกิจศึกษา ({currentBaseYear} สหกิจ)
                </Button>
              </div>
            )}
          </div>

          {/* Official Curriculum Info Banner */}
          <Card className="academic-panel shadow-soft mb-4 bg-blue-50/60 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start sm:items-center gap-3 text-sm text-blue-950">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                <p className="leading-relaxed">
                  <span className="font-bold">ผังแม่บทอ้างอิงตามโครงสร้างหลักสูตร:</span> แสดงลำดับรายวิชาและวิชาบังคับก่อน (Prerequisite) ตามเกณฑ์มาตรฐานหลักสูตร เพื่อใช้ตรวจสอบความต่อเนื่อง สำหรับประวัติการเรียน ผลการเรียน และความคืบหน้ารายวิชาจริงของท่าน สามารถดูได้ที่แท็บ <strong className="font-semibold text-blue-800">📋 แผนของฉัน</strong>
                </p>
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
          {/* SVG Flowchart (existing, unchanged) */}
          {!isLoadingCourses && semesterLayout.length > 0 && (
            <div className="space-y-4">
              {/* Flowchart Title */}
              <div className="text-center bg-white p-4 border-b-2 border-black">
                <h1 className="text-lg font-bold">
                  แผนภูมิแสดงความต่อเนื่องหลักสูตร {currentProgramCode}
                  {hasCoopTrack
                    ? (isCurrentTrackCoop ? ' (โครงการสหกิจศึกษา)' : ` (โครงการปกติ ปี ${currentBaseYear})`)
                    : ` (ปี ${currentCurriculumYear})`}
                </h1>
              </div>

          {/* Flowchart Content */}
          <div className="academic-scroll-region bg-white overflow-x-auto">
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
                        markerEnd={arrow.isSpecial ? "url(#progress-blueArrowhead)" : "url(#progress-arrowhead)"}
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
                      const isWildcardElective = /x{2,}/i.test(course.code) || course.name.includes('วิชาเลือก');

                      return (
                        <div
                          key={course.id}
                          id={`progress-course-${course.id}`}
                          className={`absolute p-2 text-xs flex flex-col justify-between shadow-sm transition-all duration-300 ${
                            isWildcardElective 
                              ? 'border-2 border-dashed border-neutral-400 bg-neutral-50/70' 
                              : 'border-2 border-black bg-white'
                          }`}
                          style={{ 
                            left: `${rect.x}px`,
                            top: `${rect.y}px`,
                            width: `${COURSE_WIDTH}px`,
                            height: `${COURSE_HEIGHT}px`,
                          }}
                        >
                          {/* Course Code */}
                          <div className="font-bold text-center text-[12px] leading-tight px-2 text-neutral-900">
                            {removeCodePrefix(course.code)}
                          </div>
                          
                          {/* Course Name */}
                          <div className="text-center leading-tight flex-1 flex items-center justify-center px-1 text-neutral-800" style={{ fontSize: '10px' }}>
                            <span className="line-clamp-none overflow-hidden w-full">
                              {course.name}
                            </span>
                          </div>
                          
                          {/* Credits */}
                          <div className="text-center font-bold text-[10px] text-neutral-600">
                            {formatCredits(course.credits)}
                          </div>
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
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyPlanProgress;
