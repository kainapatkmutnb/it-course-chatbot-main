import type { StudyPlanCourse } from '../../services/firebaseService';

export type ResultStatus = 'completed'|'failed'|'incomplete'|'withdrawn'|'in_progress'|'planned'|'unknown';

export function resolveResult(status: string, grade?: string): ResultStatus {
  const g = (grade ?? '').trim().toUpperCase();
  if (['A','B+','B','C+','C','D+','D','S'].includes(g)) return 'completed';
  if (g === 'F' || g === 'U') return 'failed';
  if (g === 'I') return 'incomplete';
  if (g === 'W') return 'withdrawn';
  if (g) return 'unknown';
  return status === 'in_progress' ? 'in_progress' : 'planned';
}

export type DisplayCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade?: string;
  category: string;
  result: ResultStatus;
  source: StudyPlanCourse;
};

export type SemesterGroup = {
  year: number;
  semester: number;
  courses: DisplayCourse[];
  totalCredits: number;
};

export type StudyPlanView = {
  groups: SemesterGroup[];
  passedCount: number;
  passedCredits: number;
  progressPercent: number | null;
};

export function buildStudyPlanView(
  courses: readonly StudyPlanCourse[],
  requiredCredits: number | null
): StudyPlanView {
  const groups = new Map<string, SemesterGroup>();
  let passedCount = 0;
  let passedCredits = 0;

  for (const source of courses) {
    const validYear = Number.isInteger(source.year) && source.year > 0;
    const validSem = [1, 2, 3].includes(source.semester);
    const scheduled = validYear && validSem;
    const year = scheduled ? source.year : 0;
    const semester = scheduled ? source.semester : 0;
    const key = `${year}-${semester}`;

    const group = groups.get(key) ?? { year, semester, courses: [], totalCredits: 0 };
    const credits = Number.isFinite(source.credits) && source.credits >= 0 ? source.credits : 0;
    const result = resolveResult(source.status, source.grade);

    group.courses.push({
      id: source.id,
      code: (source as any).customCode?.trim() || source.code,
      name: (source as any).customName?.trim() || source.originalName || (source as any).name || '',
      credits,
      grade: source.grade,
      category: source.category,
      result,
      source,
    });
    group.totalCredits += credits;
    groups.set(key, group);

    if (result === 'completed') {
      passedCount++;
      passedCredits += credits;
    }
  }

  const sortedGroups = [...groups.values()].sort((a, b) => {
    const ay = a.year === 0 ? Infinity : a.year;
    const by = b.year === 0 ? Infinity : b.year;
    return ay - by || a.semester - b.semester;
  });

  return {
    groups: sortedGroups,
    passedCount,
    passedCredits,
    progressPercent:
      requiredCredits !== null && requiredCredits > 0
        ? Math.min(100, Math.round((passedCredits / requiredCredits) * 100))
        : null,
  };
}

export interface StudyPlanProgressKPI {
  passedCourses: number;
  targetCourses: number | null;
  passedCredits: number;
  targetCredits: number | null;
  remainingCourses: number | null;
  remainingCredits: number | null;
  progressPercent: number | null;
  isCompleted: boolean;
  formattedProgress: string;
  formattedRemaining: string;
}

export function computeProgressKPI(
  passedCourses: number,
  passedCredits: number,
  targetCourses?: number | null,
  targetCredits?: number | null
): StudyPlanProgressKPI {
  const tc = typeof targetCourses === 'number' && targetCourses > 0 ? targetCourses : null;
  const tcr = typeof targetCredits === 'number' && targetCredits > 0 ? targetCredits : null;

  const remainingCourses = tc !== null ? Math.max(0, tc - passedCourses) : null;
  const remainingCredits = tcr !== null ? Math.max(0, tcr - passedCredits) : null;
  const isCompleted = (remainingCourses === null || remainingCourses === 0) &&
                      (remainingCredits === null || remainingCredits === 0);

  const progressPercent = tcr !== null && tcr > 0
    ? Math.min(100, Math.round((passedCredits / tcr) * 100))
    : null;

  const formattedCourses = tc !== null ? `${passedCourses}/${tc} วิชา` : `${passedCourses} วิชา`;
  const formattedCredits = tcr !== null ? `${passedCredits}/${tcr} หน่วยกิต` : `${passedCredits} หน่วยกิต`;
  const formattedProgress = `${formattedCourses} · ${formattedCredits}`;

  let formattedRemaining = '';
  if (remainingCourses !== null && remainingCredits !== null) {
    if (remainingCourses === 0 && remainingCredits === 0) {
      formattedRemaining = 'ครบตามเกณฑ์หลักสูตรแล้ว';
    } else {
      formattedRemaining = `ขาดอีก ${remainingCourses} วิชา · ${remainingCredits} หน่วยกิต`;
    }
  } else if (remainingCredits !== null) {
    formattedRemaining = remainingCredits === 0
      ? 'ครบตามเกณฑ์หน่วยกิตแล้ว'
      : `ขาดอีก ${remainingCredits} หน่วยกิต`;
  }

  return {
    passedCourses,
    targetCourses: tc,
    passedCredits,
    targetCredits: tcr,
    remainingCourses,
    remainingCredits,
    progressPercent,
    isCompleted,
    formattedProgress,
    formattedRemaining,
  };
}

