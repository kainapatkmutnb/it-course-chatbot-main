export interface Department {
  id: string;
  code: string;
  name: string;
  nameThai: string;
  curricula: Curriculum[];
}

export interface Curriculum {
  id: string;
  year: number;
  buddhistYear: number;
  name: string;
  duration: number; // years
  totalCredits: number;
  semesters: CurriculumSemester[];
}

export interface CurriculumSemester {
  year: number;
  semester: number;
  courses: Course[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  prerequisites: string[];
  corequisites: string[];
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  semester: number;
  year: number;
  instructor?: string;
  isActive: boolean;
  // New optional categorization placeholders
  mainCategory?: string;
  subCategory?: string;
  // Program and curriculum information
  program?: string;
  curriculumYear?: string;
}

export interface StudentCourse {
  studentId: string;
  courseId: string;
  status: 'completed' | 'in_progress' | 'planned' | 'failed';
  grade?: string;
  gradePoint?: number;
  semester?: string;
}

// Grade system interface
export interface GradeSystem {
  grade: string;
  gradePoint: number;
  description: string;
}

// GPA calculation interface
export interface GPACalculation {
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  completedCredits: number;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  courses: StudentCourse[];
  totalCredits: number;
  completedCredits: number;
  currentSemester: number;
  currentYear: number;
  lastUpdated: Date;
}

export interface CoursePrerequisite {
  courseId: string;
  prerequisiteId: string;
  type: 'prerequisite' | 'corequisite';
  isRequired: boolean;
}