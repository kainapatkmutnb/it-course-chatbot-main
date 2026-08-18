import React, { useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyPlan } from '@/hooks/useFirebaseData';
import { calculateGPA, getGPAColor } from '@/utils/gradeUtils';
import { getCurriculumTotalCredits, getDepartments } from '@/services/departmentService';
import { exportElementToPdf } from '@/utils/exportPdf';
import {
  FileDown,
  Loader2,
  AlertCircle,
  BookOpen,
  Printer
} from 'lucide-react';

interface CourseForDisplay {
  code: string;
  name: string;
  credits: number;
  status: 'completed' | 'in_progress' | 'planned' | 'failed';
  grade?: string;
  category: string;
}

interface SemesterGroup {
  year: number;
  semester: number;
  label: string;
  courses: CourseForDisplay[];
  totalCredits: number;
}

const STATUS_CONFIG = {
  completed: {
    label: 'ผ่าน',
    textClass: 'text-emerald-700 font-bold dark:text-emerald-400 print:text-emerald-800',
    dotClass: 'text-emerald-600',
  },
  failed: {
    label: 'ไม่ผ่าน',
    textClass: 'text-rose-700 font-bold dark:text-rose-400 print:text-rose-800',
    dotClass: 'text-rose-600',
  },
  in_progress: {
    label: 'กำลังเรียน',
    textClass: 'text-amber-700 font-bold dark:text-amber-400 print:text-amber-800',
    dotClass: 'text-amber-500',
  },
  planned: {
    label: 'วางแผน',
    textClass: 'text-slate-600 font-semibold dark:text-slate-400 print:text-slate-700',
    dotClass: 'text-slate-500',
  },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  core: 'วิชาแกน',
  major: 'วิชาเอก',
  elective: 'วิชาเลือก',
  general: 'ศึกษาทั่วไป',
  free: 'เลือกเสรี',
};

interface StudyPlanReportProps {
  studentId?: string;
  studentUser?: {
    name?: string;
    studentId?: string;
    email?: string;
    department?: string;
  };
}

function resolveCourseStatus(status?: string, grade?: string): CourseForDisplay['status'] {
  const g = (grade || '').trim().toUpperCase();
  if (g === 'F' || g === 'U') return 'failed';
  if (['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'S', 'P'].includes(g)) return 'completed';
  if (g === 'I' || status === 'in_progress') return 'in_progress';
  if (status === 'completed') return 'completed';
  if (status === 'failed') return 'failed';
  return 'planned';
}

const StudyPlanReport: React.FC<StudyPlanReportProps> = ({ studentId, studentUser }) => {
  const { user } = useAuth();
  const targetStudentId = studentId || user?.id;
  const displayUser = studentUser || user;
  const { studyPlan, loading, error } = useStudyPlan(targetStudentId);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Group courses by semester
  const semesterGroups = useMemo((): SemesterGroup[] => {
    if (!studyPlan?.courses) return [];

    const groups = new Map<string, SemesterGroup>();

    for (const course of studyPlan.courses) {
      const year = course.year || 0;
      const semester = course.semester || 0;
      const key = `${year}-${semester}`;

      if (!groups.has(key)) {
        const semLabel = semester === 3
          ? `ปีที่ ${year} — ภาคฤดูร้อน`
          : `ปีที่ ${year} — ภาคเรียนที่ ${semester}`;
        groups.set(key, {
          year,
          semester,
          label: year === 0 ? 'ยังไม่ได้จัดตาราง' : semLabel,
          courses: [],
          totalCredits: 0,
        });
      }

      const resolvedStatus = resolveCourseStatus(course.status, course.grade);
      const group = groups.get(key)!;
      group.courses.push({
        code: course.code,
        name: course.customName || course.originalName || (course as any).name || '',
        credits: course.credits || 0,
        status: resolvedStatus,
        grade: course.grade,
        category: course.category || 'elective',
      });
      group.totalCredits += course.credits || 0;
    }

    // Sort by year then semester
    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.semester - b.semester;
    });
  }, [studyPlan]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const rawCourses = studyPlan?.courses || [];
    const courses = rawCourses.map(c => ({
      ...c,
      resolvedStatus: resolveCourseStatus(c.status, c.grade),
    }));
    const gpaResult = calculateGPA(rawCourses as any);
    const requiredCredits = getCurriculumTotalCredits(
      studyPlan?.program,
      studyPlan?.curriculumYear
    );

    const completed = courses.filter(c => c.resolvedStatus === 'completed');
    const failed = courses.filter(c => c.resolvedStatus === 'failed');
    const inProgress = courses.filter(c => c.resolvedStatus === 'in_progress');
    const planned = courses.filter(c => c.resolvedStatus === 'planned');

    const completedCredits = gpaResult.completedCredits;
    const targetRequiredCredits = studyPlan?.totalCredits || requiredCredits || 120;
    const progressPct = targetRequiredCredits > 0
      ? Math.min(100, Math.round((completedCredits / targetRequiredCredits) * 100))
      : 0;

    return {
      gpa: gpaResult.gpa,
      completedCredits,
      requiredCredits: targetRequiredCredits,
      progressPct,
      counts: {
        completed: completed.length,
        failed: failed.length,
        in_progress: inProgress.length,
        planned: planned.length,
        total: courses.length,
      },
      creditsByStatus: {
        completed: completed.reduce((s, c) => s + (c.credits || 0), 0),
        failed: failed.reduce((s, c) => s + (c.credits || 0), 0),
        in_progress: inProgress.reduce((s, c) => s + (c.credits || 0), 0),
        planned: planned.reduce((s, c) => s + (c.credits || 0), 0),
      },
    };
  }, [studyPlan]);

  // Resolve department name
  const programLabel = useMemo(() => {
    if (!studyPlan?.program) return displayUser?.department || 'ไม่ระบุ';
    const departments = getDepartments();
    const dept = departments.find(d => d.id === studyPlan.program || d.code === studyPlan.program);
    const deptName = dept?.nameThai || studyPlan.program;
    return `${deptName} — หลักสูตร ${studyPlan.curriculumYear || ''}`;
  }, [studyPlan, displayUser?.department]);

  // PDF export handler
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const studentName = displayUser?.studentId || displayUser?.name || 'student';
      const cleanName = studentName.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
      const filename = `study-plan-${cleanName}.pdf`;
      await exportElementToPdf(reportRef.current, filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Browser print handler
  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูลแผนการเรียน...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // No plan state
  if (!studyPlan || !studyPlan.courses?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">ยังไม่มีแผนการเรียน</h3>
          <p className="text-muted-foreground">
            กรุณาสร้างแผนการเรียนในแท็บ "จัดการแผนการเรียน" ก่อน เพื่อดูรายงานแผนการเรียน
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-foreground">รายงานแผนการเรียนของนักศึกษา</h2>
          <p className="text-sm text-muted-foreground">
            แสดงภาพรวมสถานะรายวิชาทั้งหมดตามแผนการเรียน และส่งออกเป็นเอกสาร PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์
          </Button>
          <Button onClick={handleExportPdf} disabled={isExporting} size="sm">
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'กำลังสร้าง PDF...' : 'ส่งออก PDF'}
          </Button>
        </div>
      </div>

      {/* ====== REPORT CONTAINER ====== */}
      <div 
        ref={reportRef} 
        className="bg-white text-gray-900 p-6 md:p-8 space-y-4 rounded-lg border shadow-sm print:p-0 print:border-none print:shadow-none print:bg-white print:text-black print:space-y-3.5"
      >
        {/* ---- Header Section (pdf-section) ---- */}
        <div className="pdf-section border-b border-gray-300 pb-3 text-center space-y-1">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
            รายงานแผนการศึกษาและผลการเรียนรายบุคคล
          </h1>
          <p className="text-xs text-gray-600">
            ภาควิชาเทคโนโลยีสารสนเทศ คณะเทคโนโลยีและการจัดการอุตสาหกรรม มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </p>
          <p className="text-xs md:text-sm font-semibold text-blue-700 pt-0.5">
            {programLabel}
          </p>
        </div>

        {/* ---- Student Information Grid (pdf-section) ---- */}
        <div className="pdf-section grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">ชื่อ-นามสกุล</span>
            <p className="font-semibold text-gray-900 break-words leading-normal">{displayUser?.name || '-'}</p>
          </div>
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">รหัสนักศึกษา</span>
            <p className="font-semibold font-mono text-gray-900 leading-normal">{displayUser?.studentId || '-'}</p>
          </div>
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">อีเมล</span>
            <p className="font-semibold text-gray-900 break-all leading-normal">{displayUser?.email || '-'}</p>
          </div>
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">หลักสูตร / ปี</span>
            <p className="font-semibold text-gray-900 break-words leading-normal">{studyPlan?.program} ({studyPlan?.curriculumYear || '-'})</p>
          </div>
        </div>

        {/* ---- KPI Summary Cards (pdf-section) ---- */}
        <div className="pdf-section grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-center">
            <div className={`text-xl font-bold ${getGPAColor(kpis.gpa)}`}>
              {kpis.gpa.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              เกรดเฉลี่ยสะสม (GPAX)
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-center">
            <div className="text-xl font-bold text-blue-700">
              {kpis.completedCredits} / {kpis.requiredCredits}
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              หน่วยกิตสะสมที่ผ่าน
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-center">
            <div className="text-xl font-bold text-emerald-700">
              {kpis.progressPct}%
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              ความคืบหน้าหลักสูตร
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-center">
            <div className="text-xl font-bold text-purple-700">
              {kpis.counts.total}
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              รายวิชาในแผนทั้งหมด
            </div>
          </div>
        </div>

        {/* ---- 4 Status Summary Cards (pdf-section) ---- */}
        <div className="pdf-section p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-800">
              สรุปสถานะรายวิชา (4 สถานะ)
            </span>
            <span className="text-[11px] text-gray-500">
              ผ่านแล้ว {kpis.completedCredits} จาก {kpis.requiredCredits} นก.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
              const config = STATUS_CONFIG[status];
              const count = kpis.counts[status];
              const credits = kpis.creditsByStatus[status];
              return (
                <div
                  key={status}
                  className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                >
                  <span className={`text-sm leading-none ${config.dotClass}`}>●</span>
                  <span className={config.textClass}>{config.label}</span>
                  <span className="text-[11px] text-gray-600 font-mono">{count} วิชา ({credits} นก.)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Section Title (pdf-section) ---- */}
        <div className="pdf-section flex items-center justify-between border-b border-gray-300 pb-1 pt-1">
          <h3 className="text-sm font-bold text-gray-900">
            รายละเอียดรายวิชาแยกตามภาคการศึกษา
          </h3>
          <span className="text-xs text-gray-500">
            ทั้งหมด {semesterGroups.length} ภาคการศึกษา
          </span>
        </div>

        {/* ---- Semester Tables (each is a .semester-card with avoid-break) ---- */}
        <div className="space-y-3.5">
          {semesterGroups.map((group) => (
            <div 
              key={`${group.year}-${group.semester}`} 
              className="semester-card border border-gray-300 rounded-lg overflow-hidden print:border-gray-400 print:break-inside-avoid print:page-break-inside-avoid"
            >
              {/* Semester Header */}
              <div className="flex justify-between items-center px-3.5 py-1.5 bg-gray-100 border-b border-gray-300 text-xs">
                <div className="font-bold text-gray-900">
                  {group.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 font-mono">
                    {group.courses.length} วิชา
                  </span>
                  <span className="font-bold text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-gray-300">
                    {group.totalCredits} หน่วยกิต
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                      <th className="text-left px-3 py-1.5 font-semibold w-[120px]">รหัสวิชา</th>
                      <th className="text-left px-3 py-1.5 font-semibold">ชื่อวิชา</th>
                      <th className="text-center px-2 py-1.5 font-semibold w-[60px]">หน่วยกิต</th>
                      <th className="text-center px-2 py-1.5 font-semibold w-[90px]">หมวดหมู่</th>
                      <th className="text-center px-2 py-1.5 font-semibold w-[55px]">เกรด</th>
                      <th className="text-center px-2 py-1.5 font-semibold w-[85px]">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.courses.map((course, idx) => {
                      const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.planned;
                      return (
                        <tr key={`${course.code}-${idx}`} className="hover:bg-gray-50/50">
                          <td className="px-3 py-1.5 font-mono text-[11px] font-medium text-gray-900">{course.code}</td>
                          <td className="px-3 py-1.5 font-medium text-gray-800">{course.name}</td>
                          <td className="px-2 py-1.5 text-center font-mono text-gray-900">{course.credits}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className="text-[11px] text-gray-600">
                              {CATEGORY_LABELS[course.category] || course.category}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center font-mono font-bold text-gray-900">
                            {course.grade || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`text-xs ${statusCfg.textClass}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* ---- Document Signatures / Footer (signature-section) ---- */}
        <div className="signature-section pt-5 border-t border-gray-300 space-y-4 print:break-inside-avoid print:page-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-1">
            <div className="space-y-7">
              <div className="h-8 border-b border-dashed border-gray-400 mx-auto w-44" />
              <div>
                <p className="font-semibold text-gray-900">({displayUser?.name || '...................................................'})</p>
                <p className="text-[11px] text-gray-500 mt-0.5">นักศึกษา</p>
              </div>
            </div>
            <div className="space-y-7">
              <div className="h-8 border-b border-dashed border-gray-400 mx-auto w-44" />
              <div>
                <p className="font-semibold text-gray-900">(...................................................)</p>
                <p className="text-[11px] text-gray-500 mt-0.5">อาจารย์ที่ปรึกษา</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 pt-1">
            <p>เอกสารนี้ออกโดยระบบ IT Course Assistant — พิมพ์เมื่อวันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanReport;
