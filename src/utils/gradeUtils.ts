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
  const gradeInfo = GRADE_SYSTEM.find(g => g.grade === grade);
  return gradeInfo ? gradeInfo.gradePoint : 0;
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
  return !['S', 'U', 'I', 'W'].includes(grade);
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