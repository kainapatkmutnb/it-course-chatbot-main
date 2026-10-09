import { Course } from '@/types/course';
import { StudyPlanCourse } from '@/services/firebaseService';
import { isWildcardCourseCode } from './curriculumDeduplicationUtils';

export type AuditCategoryKey = 'gened' | 'core_required' | 'major_elective' | 'free_elective';

export interface CategoryAuditProgress {
  categoryKey: AuditCategoryKey;
  label: string;
  requiredCredits: number;
  completedCredits: number;
  totalEarnedCredits: number;
  remainingCredits: number;
  overflowCredits: number;
  receivedOverflowCredits?: number;
  isSatisfied: boolean;
  percentage: number;
  passedCount: number;
  passedCourses: Array<{
    code: string;
    name: string;
    credits: number;
    grade?: string;
  }>;
}

export interface ElectiveAuditSummary {
  totalRequiredCredits: number;
  totalCompletedCredits: number;
  totalRemainingCredits: number;
  isAllSatisfied: boolean;
  categories: {
    gened: CategoryAuditProgress;
    core_required: CategoryAuditProgress;
    major_elective: CategoryAuditProgress;
    free_elective: CategoryAuditProgress;
  };
  categoryList: CategoryAuditProgress[];
  overflowLog: Array<{
    source: 'gened' | 'major_elective';
    target: 'free_elective';
    credits: number;
    explanation: string;
  }>;
}

const cleanCode = (c: string) => (c || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '').trim();

/**
 * Categorize a course (from curriculum catalog or student study plan) into one of the 4 audit categories:
 * - gened: หมวดวิชาศึกษาทั่วไป
 * - core_required: หมวดวิชาเฉพาะ (บังคับ)
 * - major_elective: หมวดวิชาเฉพาะ (เลือกกลุ่มวิชาชีพ)
 * - free_elective: หมวดวิชาเลือกเสรี
 */
export function categorizeCourseForAudit(c: {
  category?: string;
  mainCategory?: string;
  subCategory?: string;
  name?: string;
  originalName?: string;
  customName?: string;
  code?: string;
  customCode?: string;
}): AuditCategoryKey {
  const cat = (c.category || '').toLowerCase();
  const main = (c.mainCategory || '').toLowerCase();
  const sub = (c.subCategory || '').toLowerCase();
  const n = (c.name || c.originalName || c.customName || '').toLowerCase();
  const code = cleanCode(c.code || c.customCode || '').toLowerCase();

  // 1. General Education & Physical Education (หมวดศึกษาทั่วไป / กีฬาและนันทนาการ)
  if (
    main.includes('ศึกษาทั่วไป') ||
    sub.includes('ศึกษาทั่วไป') ||
    sub.includes('กลุ่มวิชาภาษา') ||
    sub.includes('สังคมศาสตร์') ||
    sub.includes('วิทยาศาสตร์และคณิตศาสตร์') ||
    sub.includes('กีฬา') ||
    n.includes('ศึกษาทั่วไป') ||
    n.includes('กีฬา') ||
    n.includes('นันทนาการ') ||
    cat === 'general' ||
    code.startsWith('080')
  ) {
    return 'gened';
  }

  // 2. Major Electives (กลุ่มวิชาชีพ / วิชาเลือกกลุ่มวิชาชีพ)
  if (
    (sub.includes('วิชาชีพ') && (sub.includes('เลือก') || n.includes('วิชาเลือก'))) ||
    n.includes('วิชาเลือกกลุ่มวิชาชีพ') ||
    n.includes('วิชาเลือกในกลุ่มวิชาชีพ') ||
    n.includes('วิชาเลือก 1') ||
    n.includes('วิชาเลือก 2') ||
    n.includes('วิชาเลือก 3') ||
    n.includes('วิชาเลือก 4') ||
    n.includes('วิชาเลือก 5') ||
    code.startsWith('0602333') ||
    code.startsWith('060xxxxxx')
  ) {
    return 'major_elective';
  }

  // 3. Free Electives (เลือกเสรี)
  if (main.includes('เลือกเสรี') || cat === 'free' || n.includes('เลือกเสรี') || code.includes('xxxxxxxx')) {
    return 'free_elective';
  }

  // 4. Core Required (หมวดวิชาเฉพาะ - บังคับ)
  return 'core_required';
}

/**
 * Computes category-level credit audit and waterfall overflow for a student.
 * 
 * Waterfall Overflow Rule:
 * 1. gened credits earned up to required are kept; any excess overflows to free_elective.
 * 2. major_elective credits earned up to required are kept; any excess overflows to free_elective.
 * 3. core_required credits do not overflow.
 * 4. free_elective is satisfied by direct free electives + excess gened + excess major_elective.
 */
export function computeCategoryCreditAudit(
  curriculumCourses: Course[],
  studentCourses: readonly (StudyPlanCourse | any)[]
): ElectiveAuditSummary {
  // 1. Calculate target quotas from curriculum courses
  let reqGen = 0, reqCore = 0, reqMajor = 0, reqFree = 0;
  for (const c of curriculumCourses) {
    const cr = Number(c.credits) || 0;
    const type = categorizeCourseForAudit(c);
    if (type === 'gened') reqGen += cr;
    else if (type === 'major_elective') reqMajor += cr;
    else if (type === 'free_elective') reqFree += cr;
    else reqCore += cr;
  }

  // 2. Extract student courses that were passed with Grade D/S or higher
  const passed = (studentCourses || []).filter(c => {
    const g = (c.grade || '').trim().toUpperCase();
    return c.status === 'completed' && ['A', 'A-', 'A+', 'B', 'B+', 'B-', 'C', 'C+', 'C-', 'D', 'D+', 'D-', 'S', 'P'].includes(g);
  });

  // Map exact curriculum courses (excluding wildcards)
  const exactCurrMap = new Map<string, Course>();
  for (const c of curriculumCourses) {
    const code = cleanCode(c.code);
    if (!isWildcardCourseCode(code)) {
      exactCurrMap.set(code, c);
    }
  }

  let genEarned = 0, coreEarned = 0, majorEarned = 0, freeEarned = 0;
  const genCourses: CategoryAuditProgress['passedCourses'] = [];
  const coreCourses: CategoryAuditProgress['passedCourses'] = [];
  const majorCourses: CategoryAuditProgress['passedCourses'] = [];
  const freeCourses: CategoryAuditProgress['passedCourses'] = [];

  for (const p of passed) {
    const code = cleanCode(p.code || p.customCode);
    const cr = Number(p.credits) || 0;
    const name = p.customName || p.name || p.originalName || code;
    const item = { code, name, credits: cr, grade: p.grade };

    const exact = exactCurrMap.get(code);
    if (exact) {
      const type = categorizeCourseForAudit(exact);
      if (type === 'gened') {
        genEarned += cr;
        genCourses.push(item);
      } else if (type === 'major_elective') {
        majorEarned += cr;
        majorCourses.push(item);
      } else if (type === 'free_elective') {
        freeEarned += cr;
        freeCourses.push(item);
      } else {
        coreEarned += cr;
        coreCourses.push(item);
      }
    } else {
      // Elective taken by student not matching an exact curriculum code
      const type = categorizeCourseForAudit(p);
      if (type === 'gened') {
        genEarned += cr;
        genCourses.push(item);
      } else if (type === 'major_elective') {
        majorEarned += cr;
        majorCourses.push(item);
      } else {
        freeEarned += cr;
        freeCourses.push(item);
      }
    }
  }

  // 3. Apply Waterfall Overflow Logic
  const genCompleted = Math.min(reqGen, genEarned);
  const genRemaining = Math.max(0, reqGen - genCompleted);
  const genOverflow = Math.max(0, genEarned - reqGen);

  const coreCompleted = Math.min(reqCore, coreEarned);
  const coreRemaining = Math.max(0, reqCore - coreCompleted);

  const majorCompleted = Math.min(reqMajor, majorEarned);
  const majorRemaining = Math.max(0, reqMajor - majorCompleted);
  const majorOverflow = Math.max(0, majorEarned - reqMajor);

  const incomingOverflow = genOverflow + majorOverflow;
  const freeAvailable = freeEarned + incomingOverflow;
  const freeCompleted = Math.min(reqFree, freeAvailable);
  const freeRemaining = Math.max(0, reqFree - freeCompleted);
  const receivedOverflow = Math.min(incomingOverflow, Math.max(0, reqFree - freeEarned));
  const freeOverflow = Math.max(0, freeAvailable - reqFree);

  // Build human-readable overflow log
  const overflowLog: ElectiveAuditSummary['overflowLog'] = [];
  if (majorOverflow > 0) {
    overflowLog.push({
      source: 'major_elective',
      target: 'free_elective',
      credits: majorOverflow,
      explanation: `หมวดวิชาเฉพาะ (เลือกกลุ่มวิชาชีพ) เรียนเกิน ${majorOverflow} หน่วยกิต โอนไปทดแทนหมวดวิชาเลือกเสรี`
    });
  }
  if (genOverflow > 0) {
    overflowLog.push({
      source: 'gened',
      target: 'free_elective',
      credits: genOverflow,
      explanation: `หมวดวิชาศึกษาทั่วไปเรียนเกิน ${genOverflow} หน่วยกิต โอนไปทดแทนหมวดวิชาเลือกเสรี`
    });
  }

  const genCategory: CategoryAuditProgress = {
    categoryKey: 'gened',
    label: 'หมวดวิชาศึกษาทั่วไป',
    requiredCredits: reqGen,
    completedCredits: genCompleted,
    totalEarnedCredits: genEarned,
    remainingCredits: genRemaining,
    overflowCredits: genOverflow,
    isSatisfied: genRemaining === 0,
    percentage: reqGen > 0 ? Math.min(100, Math.round((genCompleted / reqGen) * 100)) : 100,
    passedCount: genCourses.length,
    passedCourses: genCourses
  };

  const coreCategory: CategoryAuditProgress = {
    categoryKey: 'core_required',
    label: 'หมวดวิชาเฉพาะ (บังคับ)',
    requiredCredits: reqCore,
    completedCredits: coreCompleted,
    totalEarnedCredits: coreEarned,
    remainingCredits: coreRemaining,
    overflowCredits: 0,
    isSatisfied: coreRemaining === 0,
    percentage: reqCore > 0 ? Math.min(100, Math.round((coreCompleted / reqCore) * 100)) : 100,
    passedCount: coreCourses.length,
    passedCourses: coreCourses
  };

  const majorCategory: CategoryAuditProgress = {
    categoryKey: 'major_elective',
    label: 'หมวดวิชาเฉพาะ (เลือกกลุ่มวิชาชีพ)',
    requiredCredits: reqMajor,
    completedCredits: majorCompleted,
    totalEarnedCredits: majorEarned,
    remainingCredits: majorRemaining,
    overflowCredits: majorOverflow,
    isSatisfied: majorRemaining === 0,
    percentage: reqMajor > 0 ? Math.min(100, Math.round((majorCompleted / reqMajor) * 100)) : 100,
    passedCount: majorCourses.length,
    passedCourses: majorCourses
  };

  const freeCategory: CategoryAuditProgress = {
    categoryKey: 'free_elective',
    label: 'หมวดวิชาเลือกเสรี',
    requiredCredits: reqFree,
    completedCredits: freeCompleted,
    totalEarnedCredits: freeEarned,
    remainingCredits: freeRemaining,
    overflowCredits: freeOverflow,
    receivedOverflowCredits: receivedOverflow,
    isSatisfied: freeRemaining === 0,
    percentage: reqFree > 0 ? Math.min(100, Math.round((freeCompleted / reqFree) * 100)) : 100,
    passedCount: freeCourses.length,
    passedCourses: freeCourses
  };

  const totalRequired = reqGen + reqCore + reqMajor + reqFree;
  const totalCompleted = genCompleted + coreCompleted + majorCompleted + freeCompleted;
  const totalRemaining = genRemaining + coreRemaining + majorRemaining + freeRemaining;

  return {
    totalRequiredCredits: totalRequired,
    totalCompletedCredits: totalCompleted,
    totalRemainingCredits: totalRemaining,
    isAllSatisfied: totalRemaining === 0,
    categories: {
      gened: genCategory,
      core_required: coreCategory,
      major_elective: majorCategory,
      free_elective: freeCategory
    },
    categoryList: [genCategory, coreCategory, majorCategory, freeCategory],
    overflowLog
  };
}
