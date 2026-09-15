import { courseDatabase } from './completeCurriculumData';
import { getDepartments } from './departmentService';

export interface CurriculumSummaryItem {
  id: string;
  name: string;
  program: string;
  curriculumYear: string;
  duration: number;
  totalCredits: number;
  totalCourses: number;
  creditStructure: {
    generalCredits: number;
    coreCredits: number;
    freeCredits: number;
  };
}

export interface CatalogCourseItem {
  code: string;
  name: string;
  credits: number;
  category: string;
  year: number;
  semester: number;
  prerequisites: string[];
}

export interface CurriculumDetailItem {
  id: string;
  name: string;
  program: string;
  curriculumYear: string;
  totalCredits: number;
  totalCourses: number;
  semesters: Record<string, CatalogCourseItem[]>;
}

/**
 * Mapping helper to translate between departmentService curriculum IDs
 * and courseDatabase keys
 */
const mapToCourseDbKey = (program: string, currYear: string): { progKey: string; yearKey: string } => {
  // Handle coop aliases
  if (currYear.includes('COOP')) {
    const baseYear = currYear.replace('-COOP', '');
    return { progKey: program, yearKey: `${baseYear} สหกิจ` };
  }
  return { progKey: program, yearKey: currYear };
};

/**
 * Builds high-level summary catalog of all 13 department curricula
 */
export const getCurriculumSummaryCatalog = (): CurriculumSummaryItem[] => {
  const departments = getDepartments();
  const summary: CurriculumSummaryItem[] = [];

  departments.forEach(dept => {
    dept.curricula.forEach(curr => {
      // Determine year key
      const parts = curr.id.split('-');
      const prog = parts[0];
      const yearPart = parts.slice(1).join('-');

      const { progKey, yearKey } = mapToCourseDbKey(prog, yearPart);
      const semData = (courseDatabase as any)[progKey]?.[yearKey] || (courseDatabase as any)[progKey]?.[yearPart];

      let courseCount = 0;
      let generalCredits = 0;
      let coreCredits = 0;
      let freeCredits = 0;
      let calculatedTotalCredits = 0;

      if (semData && typeof semData === 'object') {
        Object.values(semData).forEach((semCourses: any) => {
          if (Array.isArray(semCourses)) {
            semCourses.forEach((c: any) => {
              courseCount++;
              const credits = Number(c.credits) || 0;
              calculatedTotalCredits += credits;

              const mainCat = (c.mainCategory || '').toLowerCase();
              const cat = (c.category || '').toLowerCase();

              if (mainCat.includes('ศึกษาทั่วไป') || cat === 'general') {
                generalCredits += credits;
              } else if (mainCat.includes('เลือกเสรี') || cat === 'free') {
                freeCredits += credits;
              } else {
                coreCredits += credits;
              }
            });
          }
        });
      }

      summary.push({
        id: curr.id,
        name: curr.name,
        program: dept.code,
        curriculumYear: yearPart,
        duration: curr.duration,
        totalCredits: curr.totalCredits || calculatedTotalCredits,
        totalCourses: courseCount,
        creditStructure: {
          generalCredits,
          coreCredits,
          freeCredits
        }
      });
    });
  });

  return summary;
};

/**
 * Builds compact all-curricula course map organized by curriculum ID and semester
 */
// ============================================================================================
// CURRICULUM DURATION & GUARD RULES — Single Source of Truth for AI ChatBot (ครบ 13 หลักสูตร)
// ============================================================================================

export interface CurriculumInternshipInfo {
  hasInternship: boolean;
  semester?: string;       // e.g. '3-3', '1-3', '2-3'
  courseCode?: string;     // e.g. '060243204'
  courseName?: string;     // Thai name
  credits?: number;
  minHours?: number;       // minimum hours required (e.g. 240)
}

export interface CurriculumCoopInfo {
  hasCoop: boolean;
  prepSemester?: string;       // semester of preparation course
  prepCourseCode?: string;
  prepCourseName?: string;
  prepCredits?: number;
  coopSemester?: string;       // semester of main co-op course
  coopCourseCode?: string;
  coopCourseName?: string;
  coopCredits?: number;
}

export interface CurriculumRuleItem {
  programId: string;           // e.g. 'IT-67', 'IT-67-COOP'
  programName: string;         // Thai full program name
  track: 'regular' | 'coop' | 'transfer' | 'continuing';
  durationYears: number;
  totalSemesters: number;      // total semesters including summer
  validSemesters: string[];    // allowed semester keys e.g. ['1-1','1-2','3-3']
  forbiddenSemesters: string[];
  totalCredits: number;
  totalCourses: number;
  internship: CurriculumInternshipInfo;
  coop: CurriculumCoopInfo;
  notes: string;               // strict Thai note for LLM reference
}

/**
 * Authoritative Curriculum Duration & Guard Rules Catalog — ครบทั้ง 13 หลักสูตร
 * Used by ChatBot metadata to enforce correct duration, internship, and co-op facts in n8n LLM.
 */
export const CURRICULUM_RULES_CATALOG: Record<string, CurriculumRuleItem> = {
  // -----------------------------------------------------------------------
  // กลุ่ม 2 ปี: เทียบโอน
  // -----------------------------------------------------------------------
  'ITT-67': {
    programId: 'ITT-67',
    programName: 'เทคโนโลยีสารสนเทศ (เทียบโอน) พ.ศ. 2567',
    track: 'transfer',
    durationYears: 2,
    totalSemesters: 4,
    validSemesters: ['1-1', '1-2', '2-1', '2-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-1', '3-2', '3-3', '4-1', '4-2'],
    totalCredits: 84,
    totalCourses: 28,
    internship: { hasInternship: false },
    coop: { hasCoop: false },
    notes: 'หลักสูตรเทียบโอน 2 ปี มีเฉพาะปี 1 และปี 2 รวม 4 เทอมเท่านั้น (1-1, 1-2, 2-1, 2-2) รวม 28 วิชา 84 หน่วยกิต ไม่มีปี 3 และปี 4 เด็ดขาด ไม่มีวิชาฝึกงานภาคฤดูร้อน ไม่มีสหกิจศึกษา'
  },

  // -----------------------------------------------------------------------
  // กลุ่ม 2 ปี: ต่อเนื่อง
  // -----------------------------------------------------------------------
  'ITI-66': {
    programId: 'ITI-66',
    programName: 'เทคโนโลยีสารสนเทศ (ต่อเนื่อง) พ.ศ. 2566',
    track: 'continuing',
    durationYears: 2,
    totalSemesters: 5,
    validSemesters: ['1-1', '1-2', '1-3', '2-1', '2-2'],
    forbiddenSemesters: ['2-3', '3-1', '3-2', '3-3', '4-1', '4-2'],
    totalCredits: 78,
    totalCourses: 32,
    internship: {
      hasInternship: true,
      semester: '1-3',
      courseCode: '060223129',
      courseName: 'การฝึกปฏิบัติงาน',
      credits: 2,
      minHours: 240
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตรต่อเนื่อง 2 ปี มี 5 เทอม (รวม 1-3 ภาคฤดูร้อน) รวม 32 วิชา 78 หน่วยกิต มีวิชาฝึกงาน 060223129 การฝึกปฏิบัติงาน (2 หน่วยกิต ≥ 240 ชม.) ในเทอม 1-3 ไม่มีปี 3 หรือปี 4 ไม่มีสหกิจศึกษา'
  },
  'ITI-61': {
    programId: 'ITI-61',
    programName: 'เทคโนโลยีสารสนเทศ (ต่อเนื่อง) พ.ศ. 2561',
    track: 'continuing',
    durationYears: 2,
    totalSemesters: 5,
    validSemesters: ['1-1', '1-2', '1-3', '2-1', '2-2'],
    forbiddenSemesters: ['2-3', '3-1', '3-2', '3-3', '4-1', '4-2'],
    totalCredits: 81,
    totalCourses: 31,
    internship: {
      hasInternship: true,
      semester: '1-3',
      courseCode: '060223129',
      courseName: 'การฝึกปฏิบัติงาน',
      credits: 2,
      minHours: 240
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตรต่อเนื่อง 2 ปี มี 5 เทอม (รวม 1-3 ภาคฤดูร้อน) รวม 31 วิชา 81 หน่วยกิต มีวิชาฝึกงาน 060223129 การฝึกปฏิบัติงาน (2 หน่วยกิต) ในเทอม 1-3 ไม่มีปี 3 หรือปี 4 ไม่มีสหกิจศึกษา'
  },

  // -----------------------------------------------------------------------
  // กลุ่ม 3 ปี: INET
  // -----------------------------------------------------------------------
  'INET-67': {
    programId: 'INET-67',
    programName: 'เทคโนโลยีสารสนเทศและเครือข่าย พ.ศ. 2567',
    track: 'regular',
    durationYears: 3,
    totalSemesters: 7,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '2-3', '3-1', '3-2'],
    forbiddenSemesters: ['1-3', '3-3', '4-1', '4-2'],
    totalCredits: 102,
    totalCourses: 38,
    internship: {
      hasInternship: true,
      semester: '2-3',
      courseCode: '060233403',
      courseName: 'การฝึกงานทางเทคโนโลยีสารสนเทศและเครือข่าย',
      credits: 1
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 3 ปี 7 เทอม (รวม 2-3 ภาคฤดูร้อน) รวม 38 วิชา 102 หน่วยกิต มีวิชาฝึกงาน 060233403 (1 หน่วยกิต) ในเทอม 2-3 ไม่มีปี 4 ไม่มีสหกิจศึกษา'
  },
  'INET-62': {
    programId: 'INET-62',
    programName: 'เทคโนโลยีสารสนเทศและเครือข่าย พ.ศ. 2562',
    track: 'regular',
    durationYears: 3,
    totalSemesters: 7,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '2-3', '3-1', '3-2'],
    forbiddenSemesters: ['1-3', '3-3', '4-1', '4-2'],
    totalCredits: 103,
    totalCourses: 38,
    internship: {
      hasInternship: true,
      semester: '2-3',
      courseCode: '060233403',
      courseName: 'การฝึกงานทางเทคโนโลยีสารสนเทศและเครือข่าย',
      credits: 2
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 3 ปี 7 เทอม (รวม 2-3 ภาคฤดูร้อน) รวม 38 วิชา 103 หน่วยกิต มีวิชาฝึกงาน 060233403 (2 หน่วยกิต) ในเทอม 2-3 ไม่มีปี 4 ไม่มีสหกิจศึกษา'
  },

  // -----------------------------------------------------------------------
  // กลุ่ม 4 ปี: IT (เทคโนโลยีสารสนเทศ)
  // -----------------------------------------------------------------------
  'IT-67': {
    programId: 'IT-67',
    programName: 'เทคโนโลยีสารสนเทศ พ.ศ. 2567 (ปกติ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 120,
    totalCourses: 42,
    internship: {
      hasInternship: true,
      semester: '3-3',
      courseCode: '060243204',
      courseName: 'การฝึกงานทางเทคโนโลยีสารสนเทศ',
      credits: 1
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 4 ปีปกติ 9 เทอม (รวม 3-3 ภาคฤดูร้อน) รวม 42 วิชา 120 หน่วยกิต มีวิชาฝึกงาน 060243204 การฝึกงานทางเทคโนโลยีสารสนเทศ (1 หน่วยกิต) ในเทอม 3-3 ภาคฤดูร้อน ไม่มีสหกิจศึกษา'
  },
  'IT-67-COOP': {
    programId: 'IT-67-COOP',
    programName: 'เทคโนโลยีสารสนเทศ พ.ศ. 2567 (สหกิจศึกษา)',
    track: 'coop',
    durationYears: 4,
    totalSemesters: 8,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-3'],
    totalCredits: 120,
    totalCourses: 41,
    internship: { hasInternship: false },
    coop: {
      hasCoop: true,
      prepSemester: '4-1',
      prepCourseCode: '060243301',
      prepCourseName: 'เตรียมสหกิจศึกษา',
      prepCredits: 1,
      coopSemester: '4-2',
      coopCourseCode: '060243302',
      coopCourseName: 'สหกิจศึกษา',
      coopCredits: 6
    },
    notes: 'หลักสูตร 4 ปีสหกิจศึกษา 8 เทอม รวม 41 วิชา 120 หน่วยกิต ไม่มีเทอม 3-3 ไม่มีวิชาฝึกงานภาคฤดูร้อน มีสหกิจศึกษา: 060243301 เตรียมสหกิจศึกษา (1 หน่วยกิต) ในเทอม 4-1 และ 060243302 สหกิจศึกษา (6 หน่วยกิต) ในเทอม 4-2'
  },
  'IT-62': {
    programId: 'IT-62',
    programName: 'เทคโนโลยีสารสนเทศ พ.ศ. 2562 (ปกติ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 127,
    totalCourses: 44,
    internship: {
      hasInternship: true,
      semester: '3-3',
      courseCode: '060243201',
      courseName: 'การฝึกงานทางเทคโนโลยีสารสนเทศ',
      credits: 2
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 4 ปีปกติ 9 เทอม (รวม 3-3 ภาคฤดูร้อน) รวม 44 วิชา 127 หน่วยกิต มีวิชาฝึกงาน 060243201 การฝึกงานทางเทคโนโลยีสารสนเทศ (2 หน่วยกิต) ในเทอม 3-3 ภาคฤดูร้อน ไม่มีสหกิจศึกษา'
  },
  'IT-62-COOP': {
    programId: 'IT-62-COOP',
    programName: 'เทคโนโลยีสารสนเทศ พ.ศ. 2562 (สหกิจศึกษา)',
    track: 'coop',
    durationYears: 4,
    totalSemesters: 8,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-3'],
    totalCredits: 127,
    totalCourses: 43,
    internship: { hasInternship: false },
    coop: {
      hasCoop: true,
      prepSemester: '4-1',
      prepCourseCode: '060243301',
      prepCourseName: 'เตรียมสหกิจศึกษา',
      prepCredits: 2,
      coopSemester: '4-2',
      coopCourseCode: '060243302',
      coopCourseName: 'สหกิจศึกษา',
      coopCredits: 6
    },
    notes: 'หลักสูตร 4 ปีสหกิจศึกษา 8 เทอม รวม 43 วิชา 127 หน่วยกิต ไม่มีเทอม 3-3 ไม่มีวิชาฝึกงานภาคฤดูร้อน มีสหกิจศึกษา: 060243301 เตรียมสหกิจศึกษา (2 หน่วยกิต) ในเทอม 4-1 และ 060243302 สหกิจศึกษา (6 หน่วยกิต) ในเทอม 4-2'
  },

  // -----------------------------------------------------------------------
  // กลุ่ม 4 ปี: INE (วิศวกรรมสารสนเทศและเครือข่าย)
  // -----------------------------------------------------------------------
  'INE-67': {
    programId: 'INE-67',
    programName: 'วิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2567 (ปกติ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 125,
    totalCourses: 46,
    internship: {
      hasInternship: true,
      semester: '3-3',
      courseCode: '060233403',
      courseName: 'การฝึกงานทางวิศวกรรมสารสนเทศและเครือข่าย',
      credits: 1
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 4 ปีปกติ 9 เทอม (รวม 3-3 ภาคฤดูร้อน) รวม 46 วิชา 125 หน่วยกิต มีวิชาฝึกงาน 060233403 (1 หน่วยกิต) ในเทอม 3-3 ภาคฤดูร้อน ไม่มีสหกิจศึกษา'
  },
  'INE-67-COOP': {
    programId: 'INE-67-COOP',
    programName: 'วิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2567 (สหกิจศึกษา)',
    track: 'coop',
    durationYears: 4,
    totalSemesters: 8,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-3'],
    totalCredits: 125,
    totalCourses: 45,
    internship: { hasInternship: false },
    coop: {
      hasCoop: true,
      prepSemester: '4-1',
      prepCourseCode: '060233501',
      prepCourseName: 'เตรียมสหกิจศึกษา',
      prepCredits: 1,
      coopSemester: '4-2',
      coopCourseCode: '060233502',
      coopCourseName: 'สหกิจศึกษา',
      coopCredits: 6
    },
    notes: 'หลักสูตร 4 ปีสหกิจศึกษา 8 เทอม รวม 45 วิชา 125 หน่วยกิต ไม่มีเทอม 3-3 ไม่มีวิชาฝึกงานภาคฤดูร้อน มีสหกิจศึกษา: 060233501 เตรียมสหกิจศึกษา (1 หน่วยกิต) ในเทอม 4-1 และ 060233502 สหกิจศึกษา (6 หน่วยกิต) ในเทอม 4-2'
  },
  'INE-62': {
    programId: 'INE-62',
    programName: 'วิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2562 (ปกติ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 135,
    totalCourses: 50,
    internship: {
      hasInternship: true,
      semester: '3-3',
      courseCode: '060233403',
      courseName: 'การฝึกงานทางวิศวกรรมสารสนเทศและเครือข่าย',
      credits: 2
    },
    coop: { hasCoop: false },
    notes: 'หลักสูตร 4 ปีปกติ 9 เทอม (รวม 3-3 ภาคฤดูร้อน) รวม 50 วิชา 135 หน่วยกิต มีวิชาฝึกงาน 060233403 (2 หน่วยกิต) ในเทอม 3-3 ภาคฤดูร้อน ไม่มีสหกิจศึกษา'
  },
  'INE-62-COOP': {
    programId: 'INE-62-COOP',
    programName: 'วิศวกรรมสารสนเทศและเครือข่าย พ.ศ. 2562 (สหกิจศึกษา)',
    track: 'coop',
    durationYears: 4,
    totalSemesters: 8,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-3'],
    totalCredits: 135,
    totalCourses: 49,
    internship: { hasInternship: false },
    coop: {
      hasCoop: true,
      prepSemester: '3-2',
      prepCourseCode: '060233501',
      prepCourseName: 'เตรียมสหกิจศึกษา',
      prepCredits: 2,
      coopSemester: '4-2',
      coopCourseCode: '060233502',
      coopCourseName: 'สหกิจศึกษา',
      coopCredits: 6
    },
    notes: 'หลักสูตร 4 ปีสหกิจศึกษา 8 เทอม รวม 49 วิชา 135 หน่วยกิต ไม่มีเทอม 3-3 ไม่มีวิชาฝึกงานภาคฤดูร้อน มีสหกิจศึกษา: 060233501 เตรียมสหกิจศึกษา (2 หน่วยกิต) ในเทอม 3-2 และ 060233502 สหกิจศึกษา (6 หน่วยกิต) ในเทอม 4-2'
  },

  // -----------------------------------------------------------------------
  // Fallback group keys (ใช้เมื่อ enrolledCurriculum ระบุเป็นกลุ่มกว้างๆ)
  // -----------------------------------------------------------------------
  'ITT': {
    programId: 'ITT',
    programName: 'เทคโนโลยีสารสนเทศ (เทียบโอน) — กลุ่ม',
    track: 'transfer',
    durationYears: 2,
    totalSemesters: 4,
    validSemesters: ['1-1', '1-2', '2-1', '2-2'],
    forbiddenSemesters: ['1-3', '2-3', '3-1', '3-2', '3-3', '4-1', '4-2'],
    totalCredits: 84,
    totalCourses: 28,
    internship: { hasInternship: false },
    coop: { hasCoop: false },
    notes: 'กลุ่มหลักสูตรเทียบโอน 2 ปี ไม่มีปี 3-4 ไม่มีฝึกงาน ไม่มีสหกิจศึกษา (ระบุปีหลักสูตรเพิ่มเติมสำหรับข้อมูลละเอียด)'
  },
  'ITI': {
    programId: 'ITI',
    programName: 'เทคโนโลยีสารสนเทศ (ต่อเนื่อง) — กลุ่ม',
    track: 'continuing',
    durationYears: 2,
    totalSemesters: 5,
    validSemesters: ['1-1', '1-2', '1-3', '2-1', '2-2'],
    forbiddenSemesters: ['2-3', '3-1', '3-2', '3-3', '4-1', '4-2'],
    totalCredits: 78,
    totalCourses: 32,
    internship: { hasInternship: true, semester: '1-3', courseCode: '060223129', courseName: 'การฝึกปฏิบัติงาน', credits: 2 },
    coop: { hasCoop: false },
    notes: 'กลุ่มหลักสูตรต่อเนื่อง 2 ปี มีฝึกงานภาคฤดูร้อน 1-3 ไม่มีปี 3-4 ไม่มีสหกิจศึกษา (ระบุปีหลักสูตรเพิ่มเติม)'
  },
  'INET': {
    programId: 'INET',
    programName: 'เทคโนโลยีสารสนเทศและเครือข่าย — กลุ่ม',
    track: 'regular',
    durationYears: 3,
    totalSemesters: 7,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '2-3', '3-1', '3-2'],
    forbiddenSemesters: ['1-3', '3-3', '4-1', '4-2'],
    totalCredits: 102,
    totalCourses: 38,
    internship: { hasInternship: true, semester: '2-3', courseCode: '060233403', courseName: 'การฝึกงาน', credits: 1 },
    coop: { hasCoop: false },
    notes: 'กลุ่มหลักสูตร 3 ปี มีฝึกงานภาคฤดูร้อน 2-3 ไม่มีปี 4 ไม่มีสหกิจศึกษา (ระบุปีหลักสูตรเพิ่มเติม)'
  },
  'IT': {
    programId: 'IT',
    programName: 'เทคโนโลยีสารสนเทศ — กลุ่ม (ปกติและสหกิจ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 120,
    totalCourses: 42,
    internship: { hasInternship: true, semester: '3-3', courseCode: '060243204', courseName: 'การฝึกงาน', credits: 1 },
    coop: { hasCoop: false },
    notes: 'กลุ่มหลักสูตร IT 4 ปี — ปกติ (IT-67, IT-62) มีฝึกงานในเทอม 3-3, สหกิจ (IT-67-COOP, IT-62-COOP) ไม่มี 3-3 แต่มีสหกิจศึกษาในเทอม 4-1 และ 4-2 กรุณาระบุแผนให้ชัดเจนเพื่อความแม่นยำ'
  },
  'INE': {
    programId: 'INE',
    programName: 'วิศวกรรมสารสนเทศและเครือข่าย — กลุ่ม (ปกติและสหกิจ)',
    track: 'regular',
    durationYears: 4,
    totalSemesters: 9,
    validSemesters: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '3-3', '4-1', '4-2'],
    forbiddenSemesters: ['1-3', '2-3'],
    totalCredits: 125,
    totalCourses: 46,
    internship: { hasInternship: true, semester: '3-3', courseCode: '060233403', courseName: 'การฝึกงาน', credits: 1 },
    coop: { hasCoop: false },
    notes: 'กลุ่มหลักสูตร INE 4 ปี — ปกติ (INE-67, INE-62) มีฝึกงานในเทอม 3-3, สหกิจ (INE-67-COOP, INE-62-COOP) ไม่มี 3-3 แต่มีสหกิจศึกษาในเทอม 4-1 หรือ 3-2 และ 4-2 กรุณาระบุแผนให้ชัดเจนเพื่อความแม่นยำ'
  }
};

/**
 * Returns the full curriculum duration & guard rules catalog for all 13 curricula.
 * Used by ChatBot to inject authoritative metadata into n8n webhook so the AI cannot
 * hallucinate incorrect internship / co-op / duration facts.
 */
export const getCurriculumDurationGuard = (): Record<string, CurriculumRuleItem> => {
  return CURRICULUM_RULES_CATALOG;
};

/**
 * Returns the guard rule for a specific curriculum ID (e.g. 'IT-67', 'IT-67-COOP').
 * Falls back to program-group key (e.g. 'IT', 'INE') if exact match not found.
 */
export const getActiveCurriculumRule = (curriculumId: string): CurriculumRuleItem | null => {
  if (!curriculumId) return null;
  if (CURRICULUM_RULES_CATALOG[curriculumId]) return CURRICULUM_RULES_CATALOG[curriculumId];
  // Try program-group fallback
  const groupKey = curriculumId.replace(/-\d+(-COOP)?$/, '').toUpperCase();
  return CURRICULUM_RULES_CATALOG[groupKey] ?? null;
};

export const getAllCurriculumsMap = (): Record<string, CurriculumDetailItem> => {
  const departments = getDepartments();
  const result: Record<string, CurriculumDetailItem> = {};

  departments.forEach(dept => {
    dept.curricula.forEach(curr => {
      const parts = curr.id.split('-');
      const prog = parts[0];
      const yearPart = parts.slice(1).join('-');

      const { progKey, yearKey } = mapToCourseDbKey(prog, yearPart);
      const semData = (courseDatabase as any)[progKey]?.[yearKey] || (courseDatabase as any)[progKey]?.[yearPart];

      const semesters: Record<string, CatalogCourseItem[]> = {};
      let totalCourses = 0;
      let totalCredits = 0;

      if (semData && typeof semData === 'object') {
        Object.entries(semData).forEach(([semKey, semCourses]: [string, any]) => {
          if (Array.isArray(semCourses)) {
            const [y, s] = semKey.split('-').map(Number);
            const cleanCode = (rawCode: string) => {
              if (!rawCode) return '';
              return rawCode
                .replace(/^(ITT|ITI|INET|INE|IT)-/i, '')
                .replace(/[\*\s]+$/g, '')
                .trim();
            };

            const cleanPrereq = (rawPrereq: string) => {
              if (!rawPrereq) return '';
              return rawPrereq
                .replace(/^(ITT|ITI|INET|INE|IT)-/i, '')
                .replace(/\*/g, '')
                .trim();
            };

            semesters[semKey] = semCourses.map((c: any) => {
              totalCourses++;
              totalCredits += Number(c.credits) || 0;
              return {
                code: cleanCode(c.code),
                name: (c.name || '').trim(),
                credits: Number(c.credits) || 0,
                category: c.mainCategory || c.category || '',
                year: y || 1,
                semester: s || 1,
                prerequisites: Array.isArray(c.prerequisites) 
                  ? c.prerequisites.map(cleanPrereq) 
                  : []
              };
            });
          }
        });
      }

      result[curr.id] = {
        id: curr.id,
        name: curr.name,
        program: dept.code,
        curriculumYear: yearPart,
        totalCredits: curr.totalCredits || totalCredits,
        totalCourses,
        semesters
      };
    });
  });

  return result;
};
