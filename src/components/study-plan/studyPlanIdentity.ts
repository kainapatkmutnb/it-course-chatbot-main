import type { StudyPlanCourse } from '../../services/firebaseService';

/**
 * CurriculumOrigin — records where a course was added from in the catalog.
 * Stored at creation time; never overwritten by student edits or year/semester moves.
 */
export interface CurriculumOrigin {
  program: string;
  curriculumYear: string;
  year: number;
  semester: number;
  index: number;    // ordinal within semester array before any filter/sort
  code: string;     // original catalog code at time of add
}

/**
 * Serialize a student course for Firebase persistence.
 * Preserves: id, code, originalName, curriculumOrigin.
 * Never overwrites code with customCode; stores customCode separately.
 */
export function serializeStudentCourse(course: StudyPlanCourse): StudyPlanCourse {
  return {
    ...course,
    code: course.code,                                          // never clobber original code
    originalName: course.originalName,                         // never clobber original name
    customCode: (course as any).customCode ?? '',
    customName: (course as any).customName ?? '',
    name: (course as any).customName?.trim() || course.originalName,
    prerequisites: course.prerequisites ?? [],
  };
}

/**
 * Normalize a course code for matching:
 * - Remove recognized program prefix (INE-, INET-, IT-, ITI-, ITT-)
 * - Remove trailing star (*) and whitespace
 * - Never remove wildcard digits or match across program/year scopes
 */
export function normalizeCodeForMatching(code: string): string {
  return code
    .replace(/^(ITT|ITI|INET|INE|IT)-/i, '')
    .replace(/\*$/, '')
    .trim();
}
