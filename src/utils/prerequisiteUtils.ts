/**
 * Prerequisite Utilities
 * - ตรวจสอบเงื่อนไขก่อนเรียน (prerequisite validation)
 * - แนะนำรายวิชาถัดไป (course recommendation)
 */

interface SimpleCourse {
  code: string;
  name: string;
  credits: number;
  year: number;
  semester: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'failed';
  prerequisites?: string[];
  corequisites?: string[];
  category?: string;
  mainCategory?: string;
  subCategory?: string;
  description?: string;
}

export interface PrerequisiteCheckResult {
  isValid: boolean;
  missingPrereqs: string[]; // course codes ที่ต้องเรียนก่อนแต่ยังไม่ผ่าน
  missingPrereqNames: string[]; // ชื่อ + รหัสวิชาที่ต้องเรียนก่อน (สำหรับแสดงผล)
}

export interface RecommendedCourse {
  code: string;
  name: string;
  credits: number;
  year: number;
  semester: number;
  category?: string;
  mainCategory?: string;
  subCategory?: string;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  /** วิชาที่ผ่านแล้วที่ทำให้วิชานี้ปลดล็อค */
  unlockedBy: string[];
}

/**
 * แปลง prerequisite string ให้เป็น course code ที่ใช้ match ได้
 * 
 * prerequisites ในระบบเก็บเป็น string เช่น:
 * - "060243102 การโปรแกรมคอมพิวเตอร์"
 * - "060243108 ระบบฐานข้อมูล"
 * - "080103001 ภาษาอังกฤษ 1"
 * - "060243107 สถาปัตยกรรมคอมพิวเตอร์ หรือตามความเห็นชอบของภาควิชา"
 * - "060243104* การโปรแกรมเชิงวัตถุ"  (มี * ด้วย)
 * - "060243108* ระบบฐานข้อมูล"
 * - "โดยความเห็นชอบของภาควิชา" (ไม่มี code → ข้าม)
 * 
 * Course code ในแผนมี prefix เช่น "IT-060243102"
 */
export const extractPrereqCode = (prereqString: string): string | null => {
  // ลอง match ตัวเลข 9 หลักหรือมากกว่า (อาจมี * ต่อท้าย)
  const match = prereqString.match(/(\d{6,})\*?/);
  if (match) {
    return match[1]; // return เฉพาะตัวเลข ไม่มี *
  }
  return null; // ไม่มี course code (เช่น "โดยความเห็นชอบของภาควิชา")
};

/**
 * Normalize course code — ตัด prefix เช่น "IT-" ออก แล้วเหลือเฉพาะตัวเลข
 * เช่น "IT-060243102" → "060243102"
 *      "IT-060243104*" → "060243104"
 */
export const normalizeCourseCode = (code: string): string => {
  // ตัด prefix (เช่น IT-, INE-COOP-) ออก
  const withoutPrefix = code.replace(/^[A-Za-z-]+/, '');
  // ตัด * ออก
  const withoutStar = withoutPrefix.replace(/\*$/, '');
  // ตัด whitespace
  return withoutStar.trim();
};

/**
 * ตรวจสอบว่าวิชาที่จะเพิ่มผ่าน prerequisites หรือไม่
 * 
 * @param courseToAdd — วิชาที่ต้องการเพิ่ม (ต้องมี prerequisites)
 * @param planCourses — วิชาทั้งหมดในแผนปัจจุบัน
 * @returns PrerequisiteCheckResult
 */
export const checkPrerequisites = (
  courseToAdd: SimpleCourse,
  planCourses: SimpleCourse[]
): PrerequisiteCheckResult => {
  const prereqs = courseToAdd.prerequisites || [];

  if (prereqs.length === 0) {
    return { isValid: true, missingPrereqs: [], missingPrereqNames: [] };
  }

  // สร้าง Set ของ course code (normalized) ที่ completed ในแผน
  const completedCodes = new Set(
    planCourses
      .filter(c => c.status === 'completed')
      .map(c => normalizeCourseCode(c.code))
  );

  const missingPrereqs: string[] = [];
  const missingPrereqNames: string[] = [];

  for (const prereqStr of prereqs) {
    const prereqCode = extractPrereqCode(prereqStr);
    if (!prereqCode) {
      // ไม่มี code (เช่น "โดยความเห็นชอบของภาควิชา") → ข้ามไป
      continue;
    }

    if (!completedCodes.has(prereqCode)) {
      missingPrereqs.push(prereqCode);
      missingPrereqNames.push(prereqStr);
    }
  }

  return {
    isValid: missingPrereqs.length === 0,
    missingPrereqs,
    missingPrereqNames
  };
};

/**
 * ตรวจสอบวิชาในแผนที่ผิดลำดับ (prerequisite ไม่ผ่าน)
 * 
 * @param planCourses — วิชาทั้งหมดในแผน
 * @returns Map<courseId, วิชา prerequisite ที่ยังขาด[]>
 */
export const getCoursesWithPrereqWarnings = (
  planCourses: SimpleCourse[]
): Map<string, string[]> => {
  const warnings = new Map<string, string[]>();

  // สร้าง Set ของ course code (normalized) ที่ completed
  const completedCodes = new Set(
    planCourses
      .filter(c => c.status === 'completed')
      .map(c => normalizeCourseCode(c.code))
  );

  for (const course of planCourses) {
    // ตรวจเฉพาะวิชาที่กำลังเรียนหรือวางแผน (ไม่ใช่ completed)
    if (course.status === 'completed') continue;

    const prereqs = course.prerequisites || [];
    const missing: string[] = [];

    for (const prereqStr of prereqs) {
      const prereqCode = extractPrereqCode(prereqStr);
      if (!prereqCode) continue;

      if (!completedCodes.has(prereqCode)) {
        missing.push(prereqStr);
      }
    }

    if (missing.length > 0) {
      warnings.set(course.code, missing);
    }
  }

  return warnings;
};

/**
 * แนะนำวิชาถัดไปที่ควรเรียน
 * 
 * Logic:
 * 1. ดู completedCourses ในแผน
 * 2. ดูวิชาทั้งหมดในหลักสูตร (allCurriculumCourses)
 * 3. หาวิชาที่:
 *    a. ยังไม่ได้อยู่ในแผน
 *    b. prerequisites ครบแล้ว (ทุก prereq อยู่ใน completedCourses)
 *    c. ไม่ใช่วิชาเลือก/วิชาเลือกเสรีที่ไม่มีเลขระบุ
 * 
 * @param planCourses — วิชาทั้งหมดในแผน
 * @param allCurriculumCourses — วิชาทั้งหมดในหลักสูตร
 * @returns รายการวิชาที่แนะนำ
 */
export const getRecommendedCourses = (
  planCourses: SimpleCourse[],
  allCurriculumCourses: SimpleCourse[]
): RecommendedCourse[] => {
  // สร้าง Set ของ course code (normalized) ที่ completed
  const completedCodes = new Set(
    planCourses
      .filter(c => c.status === 'completed')
      .map(c => normalizeCourseCode(c.code))
  );

  // สร้าง Set ของ course code (normalized) ที่อยู่ในแผนแล้ว (ทุกสถานะ)
  const planCodes = new Set(
    planCourses.map(c => normalizeCourseCode(c.code))
  );

  const recommendations: RecommendedCourse[] = [];

  for (const course of allCurriculumCourses) {
    const normalizedCode = normalizeCourseCode(course.code);
    
    // ข้าม ถ้าอยู่ในแผนแล้ว
    if (planCodes.has(normalizedCode)) continue;

    // ข้าม วิชาที่ code เป็น placeholder (มี X หรือ x)
    if (/[Xx]{3,}/.test(course.code)) continue;

    const prereqs = course.prerequisites || [];

    // ถ้าไม่มี prerequisites → ไม่แนะนำ (เพราะเป็นวิชาพื้นฐานที่ลงได้เลย)
    // ยกเว้นถ้ามี completedCourses แล้ว (หมายถึง user เริ่มเรียนแล้ว)
    if (prereqs.length === 0 && completedCodes.size === 0) continue;

    // ตรวจสอบว่า prerequisites ครบหรือไม่
    let allPrereqsMet = true;
    const unlockedBy: string[] = [];

    for (const prereqStr of prereqs) {
      const prereqCode = extractPrereqCode(prereqStr);
      if (!prereqCode) continue; // ข้ามกรณี "โดยความเห็นชอบของภาควิชา"

      if (completedCodes.has(prereqCode)) {
        unlockedBy.push(prereqStr);
      } else {
        allPrereqsMet = false;
        break;
      }
    }

    // ถ้าไม่มี prerequisite ที่เป็น code → ลงได้เลย (เช่นวิชาที่ prereq เป็นข้อความอย่างเดียว)
    const hasCodePrereqs = prereqs.some(p => extractPrereqCode(p) !== null);
    
    if (hasCodePrereqs && allPrereqsMet && unlockedBy.length > 0) {
      recommendations.push({
        code: course.code,
        name: course.name,
        credits: course.credits,
        year: course.year,
        semester: course.semester,
        category: course.category,
        mainCategory: course.mainCategory,
        subCategory: course.subCategory,
        description: course.description,
        prerequisites: course.prerequisites,
        corequisites: course.corequisites,
        unlockedBy
      });
    }
  }

  // เรียงตาม year แล้ว semester
  recommendations.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.semester - b.semester;
  });

  return recommendations;
};
