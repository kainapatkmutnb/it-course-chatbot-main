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
