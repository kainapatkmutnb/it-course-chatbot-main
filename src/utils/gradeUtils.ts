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
    if (course.status === 'completed' && course.grade) {
      const gradePoint = getGradePoint(course.grade);
      
      // Only count grades that affect GPA (exclude S, U, I, W)
      if (!['S', 'U', 'I', 'W'].includes(course.grade)) {
        totalCredits += course.credits;
        totalGradePoints += course.credits * gradePoint;
      }
      
      // Count completed credits (including S grade)
      if (course.grade !== 'F' && course.grade !== 'I' && course.grade !== 'W') {
        completedCredits += course.credits;
      }
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