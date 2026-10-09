import { Course } from '@/types/course';
import { StudyPlanCourse } from '@/services/firebaseService';

export interface UncompletedCourseResult {
  code: string;
  name: string;
  credits: number;
  category: string;
  year?: number;
  semester?: number;
  prerequisites: string[];
  isFailed: boolean;
}

export type ElectiveBucketType = 'gened' | 'major_elective' | 'free_elective' | 'pe';

/**
 * Checks if a course code is a curriculum wildcard or placeholder (e.g., 080xxxxxx, 0602333xx, xxxxxxxxx, 080303xxx)
 */
export function isWildcardCourseCode(code: string): boolean {
  if (!code) return false;
  const clean = code.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '');
  return /x{2,}/i.test(clean) || clean.toLowerCase().includes('xxx');
}

/**
 * Categorize elective courses into matching buckets based on category metadata, code patterns, and Thai names
 */
export function categorizeElectiveCourse(
  category?: string,
  mainCategory?: string,
  subCategory?: string,
  name?: string,
  code?: string
): ElectiveBucketType {
  const cat = (category || '').toLowerCase();
  const main = (mainCategory || '').toLowerCase();
  const sub = (subCategory || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const c = (code || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').toLowerCase();

  // Sports & Recreation (กีฬาและนันทนาการ)
  // Check specifically for PE keywords or 0803035xx (Physical Education courses at KMUTNB).
  // IMPORTANT: Do NOT match 080303xxx directly here because 080303xxx can also be Social Sciences & Humanities!
  if (sub.includes('กีฬา') || n.includes('กีฬา') || n.includes('นันทนาการ') || c.startsWith('0803035')) {
    return 'pe';
  }

  // Major Electives (กลุ่มวิชาชีพ / วิชาเลือกกลุ่มวิชาชีพ)
  if (
    sub.includes('วิชาชีพ') ||
    n.includes('วิชาเลือกกลุ่มวิชาชีพ') ||
    n.includes('วิชาเลือกในกลุ่มวิชาชีพ') ||
    n.includes('วิชาเลือก 1') ||
    n.includes('วิชาเลือก 2') ||
    n.includes('วิชาเลือก 3') ||
    n.includes('วิชาเลือก 4') ||
    n.includes('วิชาเลือก 5') ||
    c.startsWith('0602333') ||
    c.startsWith('060xxxxxx')
  ) {
    return 'major_elective';
  }

  // General Education (หมวดศึกษาทั่วไป)
  if (
    main.includes('ศึกษาทั่วไป') ||
    sub.includes('ศึกษาทั่วไป') ||
    sub.includes('กลุ่มวิชาภาษา') ||
    sub.includes('สังคมศาสตร์') ||
    sub.includes('วิทยาศาสตร์และคณิตศาสตร์') ||
    n.includes('สังคมศาสตร์') ||
    n.includes('มนุษยศาสตร์') ||
    cat === 'general' ||
    c.startsWith('080')
  ) {
    return 'gened';
  }

  // Free Electives (เลือกเสรี)
  return 'free_elective';
}

/**
 * Computes list of uncompleted curriculum courses by deducting passed courses from curriculum requirements
 * including prioritized category-quota deduplication for wildcards.
 */
export function computeUncompletedCurriculumCourses(
  curriculumCourses: Course[],
  studentCourses: readonly (StudyPlanCourse | any)[],
  failedCourseCodes: string[] = []
): UncompletedCourseResult[] {
  const cleanCode = (c: string) => (c || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '').trim();

  // 1. Extract passed courses (Grade D/S and above)
  const passedCourses = studentCourses.filter(c => {
    const g = (c.grade || '').trim().toUpperCase();
    return c.status === 'completed' && ['A', 'A-', 'A+', 'B', 'B+', 'B-', 'C', 'C+', 'C-', 'D', 'D+', 'D-', 'S', 'P'].includes(g);
  });

  const passedCodesSet = new Set(passedCourses.map(c => cleanCode(c.code)));

  // 2. Separate curriculum courses into exact and wildcard slots
  const exactCourses: Course[] = [];
  const wildcardCourses: Course[] = [];

  for (const course of curriculumCourses) {
    if (isWildcardCourseCode(course.code)) {
      wildcardCourses.push(course);
    } else {
      exactCourses.push(course);
    }
  }

  // 3. Process exact courses
  const uncompleted: UncompletedCourseResult[] = [];
  const matchedPassedCodes = new Set<string>();

  for (const course of exactCourses) {
    const code = cleanCode(course.code);
    if (passedCodesSet.has(code)) {
      matchedPassedCodes.add(code);
    } else {
      uncompleted.push({
        code: course.code,
        name: course.name,
        credits: course.credits,
        category: course.category,
        year: course.year ? Number(course.year) : undefined,
        semester: course.semester ? Number(course.semester) : undefined,
        prerequisites: course.prerequisites || [],
        isFailed: failedCourseCodes.includes(course.code) || failedCourseCodes.includes(code)
      });
    }
  }

  // 4. Remaining passed courses that were not matched to exact curriculum courses
  // These represent electives taken by the student (GenEd, Major electives, Free electives)
  const remainingPassedElectives = passedCourses.filter(c => !matchedPassedCodes.has(cleanCode(c.code)));

  // Create mutable pool of passed electives
  const electivePool = [...remainingPassedElectives];

  // Helper to categorize an elective from pool
  const getPoolItemType = (p: any): ElectiveBucketType => {
    return categorizeElectiveCourse(
      p.category,
      p.mainCategory,
      p.subCategory,
      p.name || p.originalName || p.customName,
      p.code || p.customCode
    );
  };

  // 5. Structure wildcard slots for multi-pass prioritized matching
  interface WildcardSlot {
    course: Course;
    targetType: ElectiveBucketType;
    satisfied: boolean;
  }

  const wildcardSlots: WildcardSlot[] = wildcardCourses.map(w => ({
    course: w,
    targetType: categorizeElectiveCourse(
      w.category,
      w.mainCategory,
      w.subCategory,
      w.name,
      w.code
    ),
    satisfied: false
  }));

  // Pass 1: Match specific PE slots
  for (const slot of wildcardSlots) {
    if (!slot.satisfied && slot.targetType === 'pe') {
      const idx = electivePool.findIndex(p => getPoolItemType(p) === 'pe');
      if (idx !== -1) {
        electivePool.splice(idx, 1);
        slot.satisfied = true;
      }
    }
  }

  // Pass 2: Match specific Major Elective slots
  for (const slot of wildcardSlots) {
    if (!slot.satisfied && slot.targetType === 'major_elective') {
      const idx = electivePool.findIndex(p => getPoolItemType(p) === 'major_elective');
      if (idx !== -1) {
        electivePool.splice(idx, 1);
        slot.satisfied = true;
      }
    }
  }

  // Pass 3: Match GenEd slots
  for (const slot of wildcardSlots) {
    if (!slot.satisfied && slot.targetType === 'gened') {
      const idx = electivePool.findIndex(p => getPoolItemType(p) === 'gened');
      if (idx !== -1) {
        electivePool.splice(idx, 1);
        slot.satisfied = true;
      }
    }
  }

  // Pass 4: Match Free Elective slots (any remaining course in pool can satisfy free electives)
  for (const slot of wildcardSlots) {
    if (!slot.satisfied && slot.targetType === 'free_elective') {
      if (electivePool.length > 0) {
        electivePool.splice(0, 1);
        slot.satisfied = true;
      }
    }
  }

  // 6. Any remaining unsatisfied wildcard slots are added to uncompleted
  for (const slot of wildcardSlots) {
    if (!slot.satisfied) {
      uncompleted.push({
        code: slot.course.code,
        name: slot.course.name,
        credits: slot.course.credits,
        category: slot.course.category,
        year: slot.course.year ? Number(slot.course.year) : undefined,
        semester: slot.course.semester ? Number(slot.course.semester) : undefined,
        prerequisites: slot.course.prerequisites || [],
        isFailed: false
      });
    }
  }

  // Sort uncompleted courses by year and semester for clear ordering
  uncompleted.sort((a, b) => {
    const yearDiff = (a.year || 0) - (b.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return (a.semester || 0) - (b.semester || 0);
  });

  return uncompleted;
}
