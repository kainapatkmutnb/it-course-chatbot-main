import { generateCoursesForSemester, courseDatabase } from './completeCurriculumData';
import { Course } from '@/types/course';

export interface CourseFilter {
  program?: string;
  curriculumYear?: string;
  year?: number;
  semester?: number;
  category?: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory?: string;
  subCategory?: string;
  searchTerm?: string;
}

export interface CourseWithProgram extends Course {
  program: string;
  curriculumYear: string;
}

/**
 * Get all available courses from all programs and curriculum years
 */
export const getAllCourses = (): CourseWithProgram[] => {
  const allCourses: CourseWithProgram[] = [];
  
  // Iterate through all programs in courseDatabase
  Object.entries(courseDatabase).forEach(([program, curricula]) => {
    Object.entries(curricula).forEach(([curriculumYear, yearData]) => {
      Object.entries(yearData).forEach(([yearSemester, courses]) => {
        if (Array.isArray(courses)) {
          courses.forEach(course => {
            allCourses.push({
              ...course,
              program,
              curriculumYear,
              id: course.id || `${course.code}-${program}-${curriculumYear}`,
              isActive: course.isActive !== false
            });
          });
        }
      });
    });
  });

  return allCourses;
};

/**
 * Get courses for a specific program and curriculum year (static data only)
 */
export const getCoursesByProgramSync = (program: string, curriculumYear: string): CourseWithProgram[] => {
  const allCourses: CourseWithProgram[] = [];
  
  // Get static courses from generateCoursesForSemester for all years and semesters
  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semesterCourses = generateCoursesForSemester(
        program, 
        curriculumYear, 
        year.toString(), 
        semester.toString()
      );
      
      semesterCourses.forEach(course => {
        allCourses.push({
          ...course,
          program,
          curriculumYear,
          id: course.id || `${course.code}-${program}-${curriculumYear}`,
          isActive: course.isActive !== false
        });
      });
    }
  }

  return allCourses;
};

/**
 * Get courses for a specific program and curriculum year (including Firebase courses)
 */
export const getCoursesByProgram = async (program: string, curriculumYear: string): Promise<CourseWithProgram[]> => {
  const allCourses: CourseWithProgram[] = [];
  
  // Get static courses from generateCoursesForSemester for all years and semesters
  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semesterCourses = generateCoursesForSemester(
        program, 
        curriculumYear, 
        year.toString(), 
        semester.toString()
      );
      
      semesterCourses.forEach(course => {
        allCourses.push({
          ...course,
          program,
          curriculumYear,
          id: course.id || `${course.code}-${program}-${curriculumYear}`,
          isActive: course.isActive !== false
        });
      });
    }
  }

  try {
    // Import firebaseService here to avoid circular dependency
    const { firebaseService } = await import('./firebaseService');
    
    // Get all Firebase courses for this program and curriculum
    const firebaseCourses = await firebaseService.getCourses();
    
    // Filter Firebase courses for this specific program and curriculum
    const relevantFirebaseCourses = firebaseCourses.filter(course => 
      course.program === program && course.curriculumYear === curriculumYear
    );
    
    // Add Firebase courses that don't exist in static data
    const staticCourseCodes = new Set(allCourses.map(course => course.code));
    
    relevantFirebaseCourses.forEach(firebaseCourse => {
      if (!staticCourseCodes.has(firebaseCourse.code)) {
        allCourses.push({
          ...firebaseCourse,
          program,
          curriculumYear,
          id: firebaseCourse.id || `${firebaseCourse.code}-${program}-${curriculumYear}`,
          isActive: firebaseCourse.isActive !== false
        });
      }
    });
  } catch (error) {
    console.error('Error loading Firebase courses for program:', error);
    // Continue with static courses only if Firebase fails
  }

  return allCourses;
};

/**
 * Get courses for a specific year and semester
 */
export const getCoursesByYearSemester = (
  program: string, 
  curriculumYear: string, 
  year: number, 
  semester: number
): CourseWithProgram[] => {
  const courses = generateCoursesForSemester(
    program, 
    curriculumYear, 
    year.toString(), 
    semester.toString()
  );
  
  return courses.map(course => ({
    ...course,
    program,
    curriculumYear,
    id: course.id || `${course.code}-${program}-${curriculumYear}`,
    isActive: course.isActive !== false
  }));
};

/**
 * Filter courses based on criteria
 */
export const filterCourses = (courses: CourseWithProgram[], filter: CourseFilter): CourseWithProgram[] => {
  return courses.filter(course => {
    // Program filter
    if (filter.program && course.program !== filter.program) {
      return false;
    }
    
    // Curriculum year filter
    if (filter.curriculumYear && course.curriculumYear !== filter.curriculumYear) {
      return false;
    }
    
    // Year filter
    if (filter.year && course.year !== filter.year) {
      return false;
    }
    
    // Semester filter
    if (filter.semester && course.semester !== filter.semester) {
      return false;
    }
    
    // Category filter
    if (filter.category && course.category !== filter.category) {
      return false;
    }
    
    // Main category filter
    if (filter.mainCategory && course.mainCategory !== filter.mainCategory) {
      return false;
    }
    
    // Sub category filter
    if (filter.subCategory && course.subCategory !== filter.subCategory) {
      return false;
    }
    
    // Search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const matchesCode = course.code.toLowerCase().includes(searchLower);
      const matchesName = course.name.toLowerCase().includes(searchLower);
      const matchesDescription = course.description?.toLowerCase().includes(searchLower);
      
      if (!matchesCode && !matchesName && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Get unique programs available
 */
export const getAvailablePrograms = (): string[] => {
  return Object.keys(courseDatabase);
};

/**
 * Get available curriculum years for a program
 */
export const getAvailableCurriculumYears = (program: string): string[] => {
  if (!courseDatabase[program]) return [];
  return Object.keys(courseDatabase[program]);
};

/**
 * Get course categories with counts
 */
export const getCourseCategories = (courses: CourseWithProgram[]): { category: string; count: number }[] => {
  const categoryCount = courses.reduce((acc, course) => {
    const category = course.category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count
  }));
};

/**
 * Get main categories with counts
 */
export const getMainCategories = (courses: CourseWithProgram[]): { category: string; count: number }[] => {
  const categoryCount = courses.reduce((acc, course) => {
    const category = course.mainCategory || 'ไม่ระบุ';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count
  }));
};

/**
 * Search courses by code or name
 */
export const searchCourses = (searchTerm: string, limit?: number): CourseWithProgram[] => {
  const allCourses = getAllCourses();
  const filtered = filterCourses(allCourses, { searchTerm });
  
  return limit ? filtered.slice(0, limit) : filtered;
};

/**
 * Get course by code
 */
export const getCourseByCode = (courseCode: string): CourseWithProgram | undefined => {
  const allCourses = getAllCourses();
  return allCourses.find(course => course.code === courseCode);
};

/**
 * Get prerequisites for a course
 */
export const getCoursePrerequisites = (courseCode: string): CourseWithProgram[] => {
  const course = getCourseByCode(courseCode);
  if (!course || !course.prerequisites) return [];
  
  const allCourses = getAllCourses();
  return course.prerequisites
    .map(prereqCode => allCourses.find(c => c.code === prereqCode))
    .filter(Boolean) as CourseWithProgram[];
};

/**
 * Get courses that have this course as prerequisite
 */
export const getCourseDependents = (courseCode: string): CourseWithProgram[] => {
  const allCourses = getAllCourses();
  return allCourses.filter(course => 
    course.prerequisites && course.prerequisites.includes(courseCode)
  );
};

/**
 * Get course name by course code
 */
export const getCourseNameByCode = (courseCode: string): string => {
  const course = getCourseByCode(courseCode);
  return course ? course.name : courseCode; // Return course name if found, otherwise return the code
};