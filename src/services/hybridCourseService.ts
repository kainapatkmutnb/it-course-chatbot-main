import { generateCoursesForSemester } from './completeCurriculumData';
import { firebaseService } from './firebaseService';
import { Course } from '@/types/course';

/**
 * Hybrid Course Service
 * Merges static curriculum data with Firebase course updates
 * This ensures that curriculum pages show updated course information from Admin edits
 */

export interface HybridCourse extends Course {
  isUpdatedFromFirebase?: boolean;
}

/**
 * Filter to remove invalid, dummy, or corrupted courses
 * Admin-only rule: ONLY courses that exist in static curriculum data
 * OR are explicitly added by admin in Firebase curriculum/<prog>/<year>/ path should be shown
 */
const isValidCourse = (course: any): boolean => {
  if (!course) return false;
  if (!course.code || typeof course.code !== 'string') return false;
  if (!course.name || typeof course.name !== 'string') return false;

  const trimmedName = course.name.trim();
  const trimmedCode = course.code.trim();

  if (trimmedName.length === 0) return false;
  if (trimmedCode.length === 0) return false;

  // Block HTML element names (rendering corruption guard) on BOTH name AND code
  const htmlTagBlacklist = new Set([
    'div', 'span', 'p', 'a', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th',
    'input', 'button', 'form', 'label', 'img', 'svg', 'script', 'style',
    'header', 'footer', 'section', 'article', 'aside', 'nav', 'main',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'iframe', 'meta',
    'link', 'title', 'head', 'body', 'html'
  ]);
  if (htmlTagBlacklist.has(trimmedName.toLowerCase())) return false;
  if (htmlTagBlacklist.has(trimmedCode.toLowerCase())) return false;

  // Block fallback dummy courses: "Course X - Year Y Semester Z"
  if (/^Course\s+\d+\s*-\s*Year/i.test(trimmedName)) return false;

  // Block courses with placeholder/empty credits
  if (course.credits === undefined || course.credits === null) return false;
  if (typeof course.credits === 'number' && course.credits <= 0) return false;

  return true;
};

/**
 * Get courses for a semester with Firebase updates applied
 * @param programCode - Program code (IT, INE, etc.)
 * @param curriculumYear - Curriculum year (62, 67, etc.)
 * @param year - Academic year (1, 2, 3, 4)
 * @param semester - Semester (1, 2, 3)
 * @param courseCount - Number of courses to generate (default: 0 - NO FALLBACK DUMMIES)
 * @returns Array of courses with Firebase updates applied
 */
export const getHybridCoursesForSemester = async (
  programCode: string,
  curriculumYear: string,
  year: string,
  semester: string,
  courseCount: number = 0
): Promise<HybridCourse[]> => {
  try {
    // Get base curriculum data - ALWAYS with courseCount=0 (no phantom fallback)
    const baseCourses = generateCoursesForSemester(
      programCode,
      curriculumYear,
      year,
      semester,
      0
    );

    // Get all Firebase courses from general collection
    const allFirebaseCourses = await firebaseService.getCourses();
    
    // Get specific curriculum courses from Firebase
    const specificFirebaseCourses = await firebaseService.getCourses(
      programCode, 
      curriculumYear, 
      parseInt(year), 
      parseInt(semester)
    );
    
    // Create a map of Firebase courses by code for quick lookup
    const firebaseCoursesMap = new Map<string, any>();
    
    // Add all general courses first
    allFirebaseCourses.forEach(course => {
      firebaseCoursesMap.set(course.code, course);
    });
    
    // Override with specific curriculum courses if they exist
    specificFirebaseCourses.forEach(course => {
      firebaseCoursesMap.set(course.code, course);
    });

    // Merge base courses with Firebase updates
    const hybridCourses: HybridCourse[] = baseCourses
      .filter(isValidCourse)
      .map(baseCourse => {
        const firebaseCourse = firebaseCoursesMap.get(baseCourse.code);
        
        if (firebaseCourse) {
          return {
            ...baseCourse,
            name: firebaseCourse.name || baseCourse.name,
            description: firebaseCourse.description || baseCourse.description,
            credits: firebaseCourse.credits || baseCourse.credits,
            prerequisites: firebaseCourse.prerequisites || [],
            corequisites: firebaseCourse.corequisites || [],
            instructor: firebaseCourse.instructor || baseCourse.instructor,
            maxStudents: firebaseCourse.maxStudents || baseCourse.maxStudents,
            currentStudents: firebaseCourse.currentStudents || baseCourse.currentStudents,
            isActive: firebaseCourse.isActive !== undefined ? firebaseCourse.isActive : baseCourse.isActive,
            isUpdatedFromFirebase: true
          };
        }
        
        return {
          ...baseCourse,
          isUpdatedFromFirebase: false
        };
      })
      .filter(isValidCourse);

    // Add new courses from Firebase that don't exist in base curriculum
    // Admin-only rule: ONLY accept new courses from specificFirebaseCourses (curriculum/<prog>/<year>/ path)
    // NOT from the general courses collection - that prevents accidental phantom courses
    const baseCoursesCodes = new Set(baseCourses.map(course => course.code));
    
    const newFirebaseCourses = specificFirebaseCourses
      .filter(specCourse => !baseCoursesCodes.has(specCourse.code))
      .filter(isValidCourse);

    const newHybridCourses: HybridCourse[] = newFirebaseCourses.map(course => ({
      ...course,
      semester: course.semester ?? parseInt(semester),
      year: course.year ?? parseInt(year),
      isUpdatedFromFirebase: true
    }));

    // Combine courses - final validation filter pass
    const allHybridCourses = [...hybridCourses, ...newHybridCourses].filter(isValidCourse);

    return allHybridCourses;
  } catch (error) {
    console.error('Error getting hybrid courses:', error);
    // Fallback to base curriculum data if Firebase fails - courseCount=0 (NO FALLBACK DUMMIES)
    return generateCoursesForSemester(programCode, curriculumYear, year, semester, 0)
      .filter(isValidCourse)
      .map(course => ({ ...course, isUpdatedFromFirebase: false }));
  }
};

/**
 * Get all courses for a curriculum with Firebase updates applied
 * @param programCode - Program code (IT, INE, etc.)
 * @param curriculumYear - Curriculum year (62, 67, etc.)
 * @returns Object with courses organized by year and semester
 */
export const getHybridCurriculumData = async (
  programCode: string,
  curriculumYear: string
): Promise<{ [year: number]: { [semester: number]: HybridCourse[] } }> => {
  try {
    const isCoopCurriculum = curriculumYear.includes('สหกิจ') || curriculumYear.includes('COOP');
    
    // Determine max year based on program
    let maxYear = 4; // Default for IT programs
    if (programCode === 'INET') maxYear = 3;
    else if (programCode === 'ITI' || programCode === 'ITT') maxYear = 2;
    
    const curriculumData: { [year: number]: { [semester: number]: HybridCourse[] } } = {};
    
    for (let year = 1; year <= maxYear; year++) {
      curriculumData[year] = {};
      
      // Regular semesters - courseCount=0 (NO FALLBACK DUMMY COURSES EVER)
      for (let semester = 1; semester <= 2; semester++) {
        const courses = await getHybridCoursesForSemester(
          programCode,
          curriculumYear,
          year.toString(),
          semester.toString(),
          0
        );
        
        if (courses.length > 0) {
          curriculumData[year][semester] = courses;
        }
      }
      
      // Special semester 3 handling - courseCount=0 always
      if (!isCoopCurriculum) {
        if ((programCode === 'IT' || programCode === 'INE') && year === 3) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            0
          );
          if (courses.length > 0) curriculumData[year][3] = courses;
        }
        if (programCode === 'INET' && year === 2) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            0
          );
          if (courses.length > 0) curriculumData[year][3] = courses;
        }
        if (programCode === 'ITI' && year === 1) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            0
          );
          if (courses.length > 0) curriculumData[year][3] = courses;
        }
      }
    }
    
    return curriculumData;
  } catch (error) {
    console.error('Error getting hybrid curriculum data:', error);
    return {};
  }
};

/**
 * Hook for hybrid course data with automatic refresh
 */
export const useHybridCourses = () => {
  // This can be implemented as a React hook if needed
  // For now, we'll use the service functions directly
  return {
    getHybridCoursesForSemester,
    getHybridCurriculumData
  };
};
