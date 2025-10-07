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
 * Get courses for a semester with Firebase updates applied
 * @param programCode - Program code (IT, INE, etc.)
 * @param curriculumYear - Curriculum year (62, 67, etc.)
 * @param year - Academic year (1, 2, 3, 4)
 * @param semester - Semester (1, 2, 3)
 * @param courseCount - Number of courses to generate (default: 6)
 * @returns Array of courses with Firebase updates applied
 */
export const getHybridCoursesForSemester = async (
  programCode: string,
  curriculumYear: string,
  year: string,
  semester: string,
  courseCount: number = 6
): Promise<HybridCourse[]> => {
  try {
    // Get base curriculum data
    const baseCourses = generateCoursesForSemester(
      programCode,
      curriculumYear,
      year,
      semester,
      courseCount
    );

    // Get all Firebase courses
    const firebaseCourses = await firebaseService.getCourses();
    
    // Create a map of Firebase courses by code for quick lookup
    const firebaseCoursesMap = new Map<string, any>();
    firebaseCourses.forEach(course => {
      firebaseCoursesMap.set(course.code, course);
    });

    // Merge base courses with Firebase updates
    const hybridCourses: HybridCourse[] = baseCourses.map(baseCourse => {
      const firebaseCourse = firebaseCoursesMap.get(baseCourse.code);
      
      if (firebaseCourse) {
        // Merge Firebase data with base course data
        return {
          ...baseCourse,
          name: firebaseCourse.name || baseCourse.name,
          description: firebaseCourse.description || baseCourse.description,
          credits: firebaseCourse.credits || baseCourse.credits,
          prerequisites: firebaseCourse.prerequisites || baseCourse.prerequisites,
          corequisites: firebaseCourse.corequisites || baseCourse.corequisites,
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
    });

    return hybridCourses;
  } catch (error) {
    console.error('Error getting hybrid courses:', error);
    // Fallback to base curriculum data if Firebase fails
    return generateCoursesForSemester(programCode, curriculumYear, year, semester, courseCount)
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
      
      // Regular semesters
      for (let semester = 1; semester <= 2; semester++) {
        const courses = await getHybridCoursesForSemester(
          programCode,
          curriculumYear,
          year.toString(),
          semester.toString(),
          7
        );
        
        if (courses.length > 0) {
          curriculumData[year][semester] = courses;
        }
      }
      
      // Special semester 3 handling
      if (!isCoopCurriculum) {
        if ((programCode === 'IT' || programCode === 'INE') && year === 3) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            2
          );
          if (courses.length > 0) curriculumData[year][3] = courses;
        }
        if (programCode === 'INET' && year === 2) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            2
          );
          if (courses.length > 0) curriculumData[year][3] = courses;
        }
        if (programCode === 'ITI' && year === 1) {
          const courses = await getHybridCoursesForSemester(
            programCode,
            curriculumYear,
            year.toString(),
            '3',
            2
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