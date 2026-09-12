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
            semesters[semKey] = semCourses.map((c: any) => {
              totalCourses++;
              totalCredits += Number(c.credits) || 0;
              return {
                code: c.code,
                name: c.name,
                credits: Number(c.credits) || 0,
                category: c.mainCategory || c.category || '',
                year: y || 1,
                semester: s || 1,
                prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : []
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
