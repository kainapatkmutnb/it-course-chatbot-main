import { GradeSystem, GPACalculation } from '@/types/course';

// Thai university grade system
export const GRADE_SYSTEM: GradeSystem[] = [
  { grade: 'A', gradePoint: 4.0, description: 'ดีเยี่ยม (80-100)' },
  { grade: 'B+', gradePoint: 3.5, description: 'ดีมาก (75-79)' },
  { grade: 'B', gradePoint: 3.0, description: 'ดี (70-74)' },
  { grade: 'C+', gradePoint: 2.5, description: 'ค่อนข้างดี (65-69)' },
  { grade: 'C', gradePoint: 2.0, description: 'พอใช้ (60-64)' },
  { grade: 'D+', gradePoint: 1.5, description: 'อ่อน (55-59)' },
  { grade: 'D', gradePoint: 1.0, description: 'อ่อนมาก (50-54)' },
  { grade: 'F', gradePoint: 0.0, description: 'ตก (0-49)' },
  { grade: 'I', gradePoint: 0.0, description: 'ไม่สมบูรณ์' },
  { grade: 'W', gradePoint: 0.0, description: 'ถอน' },
  { grade: 'S', gradePoint: 0.0, description: 'พอใจ (ไม่นับเกรด)' },
  { grade: 'U', gradePoint: 0.0, description: 'ไม่พอใจ (ไม่นับเกรด)' }
];

// Get grade point for a specific grade
export const getGradePoint = (grade: string): number => {
  const upper = (grade || '').trim().toUpperCase();
  const gradeInfo = GRADE_SYSTEM.find(g => g.grade.toUpperCase() === upper);
  if (gradeInfo) return gradeInfo.gradePoint;

  const extendedMap: Record<string, number> = {
    'A+': 4.0, 'A-': 3.7,
    'B-': 2.7, 'C-': 1.7, 'D-': 0.7
  };
  return extendedMap[upper] ?? 0;
};

// Get grade description
export const getGradeDescription = (grade: string): string => {
  const gradeInfo = GRADE_SYSTEM.find(g => g.grade === grade);
  return gradeInfo ? gradeInfo.description : '';
};

// Calculate GPA from courses with grades
export const calculateGPA = (courses: Array<{
  credits: number;
  grade?: string;
  status: string;
}>): GPACalculation => {
  let totalCredits = 0;
  let totalGradePoints = 0;
  let completedCredits = 0;

  courses.forEach(course => {
    const grade = (course.grade || '').trim();
    if (!grade) return;

    const gradePoint = getGradePoint(grade);
    
    // ===============================================================
    // GPA credits (ตัวหารเกรดรวม) = วิชาที่มีเกรด A-F / D+ / D เท่านั้น
    // - S, U, I, W: ไม่นำเข้าสูตร GPA
    // ===============================================================
    if (isGradeCountedInGPA(grade)) {
      totalCredits += course.credits;
      totalGradePoints += course.credits * gradePoint;
    }
    
    // ===============================================================
    // Completed credits (หน่วยกิตที่ผ่านแล้ว)
    // - S = ผ่าน ✅ นับหน่วยกิต
    // - A+, A, B+, B, C+, C, D+, D ✅ นับหน่วยกิต
    // - U, F, I, W, (-) ❌ ไม่นับหน่วยกิต
    // ===============================================================
    if (countsAsCompletedCredits(grade)) {
      completedCredits += course.credits;
    }
  });

  const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

  return {
    totalCredits,
    totalGradePoints,
    gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
    completedCredits
  };
};

// Get available grades for dropdown
export const getAvailableGrades = (): string[] => {
  return GRADE_SYSTEM.map(g => g.grade);
};

// Check if grade is passing
export const isPassingGrade = (grade: string): boolean => {
  const gradePoint = getGradePoint(grade);
  return gradePoint >= 1.0 || ['S'].includes(grade);
};

// Check if grade counts in GPA (exclude S, U, I, W from GPA calculation)
export const isGradeCountedInGPA = (grade: string): boolean => {
  if (!grade) return false;
  const upper = grade.trim().toUpperCase();
  return !['S', 'U', 'I', 'W'].includes(upper);
};

// Check if completed credits should count (S and above D+ pass)
// - S: ผ่าน (นับหน่วยกิต)
// - A, B+, B, C+, C, D+, D: ผ่าน (นับหน่วยกิต)
// - U, F, I, W, null/empty: ไม่ผ่าน / ไม่นับหน่วยกิต
export const countsAsCompletedCredits = (grade?: string): boolean => {
  if (!grade) return false;
  if (grade === 'S') return true;
  if (['U', 'F', 'I', 'W'].includes(grade)) return false;
  const gradePoint = getGradePoint(grade);
  return gradePoint >= 1.0; // D or better counts as completed
};

// Get grade color for UI display
export const getGradeColor = (grade: string): string => {
  const gradePoint = getGradePoint(grade);
  
  if (gradePoint >= 3.5) return 'text-green-600';
  if (gradePoint >= 3.0) return 'text-blue-600';
  if (gradePoint >= 2.5) return 'text-yellow-600';
  if (gradePoint >= 2.0) return 'text-orange-600';
  if (gradePoint >= 1.0) return 'text-red-600';
  
  return 'text-gray-600';
};

// Get GPA color for UI display
export const getGPAColor = (gpa: number): string => {
  if (gpa >= 3.5) return 'text-green-600';
  if (gpa >= 3.0) return 'text-blue-600';
  if (gpa >= 2.5) return 'text-yellow-600';
  if (gpa >= 2.0) return 'text-orange-600';
  if (gpa >= 1.0) return 'text-red-600';
  
  return 'text-gray-600';
};

// ===============================================================
// Academic Standing & Probation / Retirement Engine
// ===============================================================

export type AcademicStandingTier = 'normal' | 'high_probation' | 'low_probation' | 'retired' | 'unrecorded';

export interface SemesterGPAHistoryItem {
  year: number;
  semester: number; // 1, 2, or 3 (summer)
  isSummer: boolean;
  termCredits: number;
  termGradePoints: number;
  termGPA: number;
  cumulativeCredits: number;
  cumulativeGradePoints: number;
  cumulativeGPAX: number;
  standing: AcademicStandingTier;
  consecutiveProbations: number;
}

export interface TargetGPANextTerm {
  targetCredits: number;
  requiredGPA: number;
  isAchievableInOneTerm: boolean;
  formulaExplanation: string;
}

export interface AcademicStandingResult {
  standing: AcademicStandingTier;
  standingLabel: string;
  currentGPAX: number;
  consecutiveProbationCount: number;
  consecutiveBelow2Terms: number;
  maxConsecutiveTerms: number;
  isRetired: boolean;
  isProbation: boolean;
  isHighProbation: boolean;
  isLowProbation: boolean;
  retireReason?: string;
  allowedMaxCredits: number;
  probationCreditRange: { min: number; max: number };
  targetGPANextTerm: TargetGPANextTerm | null;
  history: SemesterGPAHistoryItem[];
}

/**
 * คำนวณเกรดเฉลี่ยเป้าหมายในเทอมถัดไปเพื่อดึง GPAX รวมให้แตะ 2.00
 */
export const calculateTargetGPANextTerm = (
  currentCredits: number,
  currentGradePoints: number,
  targetCredits: number = 16
): TargetGPANextTerm | null => {
  if (currentCredits <= 0 || targetCredits <= 0) return null;

  const totalCredits = currentCredits + targetCredits;
  const targetGPAX = 2.00;
  const requiredTotalPoints = totalCredits * targetGPAX;
  const pointsNeeded = Math.max(0, requiredTotalPoints - currentGradePoints);
  const rawGPA = pointsNeeded / targetCredits;
  const requiredGPA = Math.ceil(rawGPA * 100) / 100; // ปัดขึ้น 2 ตำแหน่งเพื่อให้มั่นใจว่าเกรดรวมถึง 2.00 จริง
  const isAchievableInOneTerm = requiredGPA <= 4.00;

  const formulaExplanation = isAchievableInOneTerm
    ? `หากลงทะเบียน ${targetCredits} หน่วยกิต ต้องได้เกรดเฉลี่ยอย่างน้อย ${requiredGPA.toFixed(2)} ในเทอมถัดไปเพื่อดึง GPAX ให้ถึง 2.00`
    : `เนื่องจากสะสมหน่วยกิตมามาก การลงทะเบียน ${targetCredits} หน่วยกิตใน 1 เทอม (แม้ได้ 4.00 ทุกวิชา) ยังดึงไม่ถึง 2.00 จำเป็นต้องวางแผนทยอยแก้เกรด 2 เทอมขึ้นไป`;

  return {
    targetCredits,
    requiredGPA,
    isAchievableInOneTerm,
    formulaExplanation
  };
};

/**
 * คำนวณประวัติผลการเรียนสะสมย้อนหลังแยกตามภาคการศึกษา (Time-Series)
 */
export const calculateSemesterGPAHistory = (
  courses: Array<{
    year?: number;
    semester?: number;
    credits: number;
    grade?: string;
    status?: string;
  }>
): SemesterGPAHistoryItem[] => {
  if (!courses || courses.length === 0) return [];

  // กรองเฉพาะวิชาที่มีเกรดจริงและนับเข้าสูตร GPA
  const validCourses = courses.filter(c => {
    const grade = (c.grade || '').trim().toUpperCase();
    return grade && isGradeCountedInGPA(grade);
  });

  if (validCourses.length === 0) return [];

  // จัดกลุ่มตามปีและภาคการศึกษา
  const semesterMap = new Map<string, Array<{ credits: number; grade: string }>>();
  validCourses.forEach(c => {
    const yr = Number(c.year) || 1;
    const sem = Number(c.semester) || 1;
    const key = `${yr}-${sem}`;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, []);
    }
    semesterMap.get(key)!.push({
      credits: Number(c.credits) || 0,
      grade: c.grade!.trim().toUpperCase()
    });
  });

  // เรียงลำดับตามกาลเวลา (Chronological order)
  const sortedKeys = Array.from(semesterMap.keys()).sort((a, b) => {
    const [yA, sA] = a.split('-').map(Number);
    const [yB, sB] = b.split('-').map(Number);
    return yA !== yB ? yA - yB : sA - sB;
  });

  const history: SemesterGPAHistoryItem[] = [];
  let cumulativeCredits = 0;
  let cumulativeGradePoints = 0;
  let consecutiveProbations = 0;
  let regularSemestersCount = 0;

  sortedKeys.forEach(key => {
    const [yr, sem] = key.split('-').map(Number);
    const semCourses = semesterMap.get(key)!;
    const isSummer = sem === 3;

    if (!isSummer) {
      regularSemestersCount++;
    }

    let termCredits = 0;
    let termGradePoints = 0;

    semCourses.forEach(c => {
      const gp = getGradePoint(c.grade);
      termCredits += c.credits;
      termGradePoints += c.credits * gp;
    });

    cumulativeCredits += termCredits;
    cumulativeGradePoints += termGradePoints;

    const termGPA = termCredits > 0 ? Math.round((termGradePoints / termCredits) * 100) / 100 : 0;
    const cumulativeGPAX = cumulativeCredits > 0 ? Math.round((cumulativeGradePoints / cumulativeCredits) * 100) / 100 : 0;

    let standing: AcademicStandingTier = 'normal';

    if (cumulativeGPAX >= 2.00) {
      standing = 'normal';
      consecutiveProbations = 0; // Reset counter เมื่อดึง GPAX พ้น 2.00
    } else {
      // ติดโปร (GPAX < 2.00)
      if (!isSummer) {
        consecutiveProbations++;
      }

      // เกณฑ์พ้นสภาพนักศึกษา (Retire):
      // 1. GPAX < 1.50 หลังสิ้นสุดภาค 2 ของปี 1 เป็นต้นไป (regularSemestersCount >= 2)
      // 2. ติดโปรติดต่อกัน 4 ภาคปกติขึ้นไป (consecutiveProbations >= 4)
      if (cumulativeGPAX < 1.50 && regularSemestersCount >= 2) {
        standing = 'retired';
      } else if (consecutiveProbations >= 4) {
        standing = 'retired';
      } else if (cumulativeGPAX < 1.75) {
        standing = 'low_probation';
      } else {
        standing = 'high_probation';
      }
    }

    history.push({
      year: yr,
      semester: sem,
      isSummer,
      termCredits,
      termGradePoints,
      termGPA,
      cumulativeCredits,
      cumulativeGradePoints,
      cumulativeGPAX,
      standing,
      consecutiveProbations
    });
  });

  return history;
};

/**
 * ประเมินสถานภาพทางวิชาการ (Academic Standing) ของนักศึกษา
 */
export const evaluateAcademicStanding = (
  courses: Array<{
    year?: number;
    semester?: number;
    credits: number;
    grade?: string;
    status?: string;
  }>
): AcademicStandingResult => {
  const history = calculateSemesterGPAHistory(courses);

  if (history.length === 0) {
    return {
      standing: 'normal',
      standingLabel: 'สถานะปกติ (ยังไม่มีเกรดสะสม)',
      currentGPAX: 0,
      consecutiveProbationCount: 0,
      consecutiveBelow2Terms: 0,
      maxConsecutiveTerms: 4,
      isRetired: false,
      isProbation: false,
      isHighProbation: false,
      isLowProbation: false,
      allowedMaxCredits: 22,
      probationCreditRange: { min: 15, max: 16 },
      targetGPANextTerm: null,
      history: []
    };
  }

  const latest = history[history.length - 1];
  const isRetired = latest.standing === 'retired';
  const isLowProbation = latest.standing === 'low_probation';
  const isHighProbation = latest.standing === 'high_probation';
  const isProbation = isLowProbation || isHighProbation;

  let standingLabel = 'สถานะปกติ';
  let retireReason: string | undefined;

  if (isRetired) {
    standingLabel = 'พ้นสภาพนักศึกษา (รีไทร์)';
    if (latest.cumulativeGPAX < 1.50) {
      retireReason = `เกรดเฉลี่ยสะสม (GPAX ${latest.cumulativeGPAX.toFixed(2)}) ต่ำกว่า 1.50 ตามเกณฑ์การพ้นสภาพนักศึกษา`;
    } else {
      retireReason = `ติดสถานะวิทยาทัณฑ์ติดต่อกันครบ 4 ภาคการศึกษาปกติ (GPAX < 2.00) ตามข้อบังคับมหาวิทยาลัย`;
    }
  } else if (isLowProbation) {
    standingLabel = `วิทยาทัณฑ์ (โปรต่ำ ครั้งที่ ${latest.consecutiveProbations}/4)`;
  } else if (isHighProbation) {
    standingLabel = `วิทยาทัณฑ์ (โปรสูง ครั้งที่ ${latest.consecutiveProbations}/4)`;
  }

  const allowedMaxCredits = isRetired ? 0 : (isProbation ? 16 : 22);

  const targetGPANextTerm = isProbation
    ? calculateTargetGPANextTerm(latest.cumulativeCredits, latest.cumulativeGradePoints, 16)
    : null;

  return {
    standing: latest.standing,
    standingLabel,
    currentGPAX: latest.cumulativeGPAX,
    consecutiveProbationCount: latest.consecutiveProbations,
    consecutiveBelow2Terms: latest.consecutiveProbations,
    maxConsecutiveTerms: 4,
    isRetired,
    isProbation,
    isHighProbation,
    isLowProbation,
    retireReason,
    allowedMaxCredits,
    probationCreditRange: { min: 15, max: 16 },
    targetGPANextTerm,
    history
  };
};