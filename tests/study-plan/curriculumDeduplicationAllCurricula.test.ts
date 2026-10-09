import test from 'node:test';
import assert from 'node:assert/strict';
import { getCoursesByProgramSync } from '../../src/services/courseService.js';
import {
  isWildcardCourseCode,
  categorizeElectiveCourse,
  computeUncompletedCurriculumCourses
} from '../../src/utils/curriculumDeduplicationUtils.js';

// The 13 official curricula with catalog rules
const CURRICULA_TO_TEST = [
  { program: 'ITT', year: '67', label: 'ITT-67' },
  { program: 'ITI', year: '66', label: 'ITI-66' },
  { program: 'ITI', year: '61', label: 'ITI-61' },
  { program: 'INET', year: '67', label: 'INET-67' },
  { program: 'INET', year: '62', label: 'INET-62' },
  { program: 'IT', year: '67', label: 'IT-67' },
  { program: 'IT', year: '67-COOP', label: 'IT-67-COOP' },
  { program: 'IT', year: '62', label: 'IT-62' },
  { program: 'IT', year: '62-COOP', label: 'IT-62-COOP' },
  { program: 'INE', year: '67', label: 'INE-67' },
  { program: 'INE', year: '67-COOP', label: 'INE-67-COOP' },
  { program: 'INE', year: '62', label: 'INE-62' },
  { program: 'INE', year: '62-COOP', label: 'INE-62-COOP' }
];

for (const { program, year, label } of CURRICULA_TO_TEST) {
  test(`Curriculum Deduplication Engine: ${label}`, () => {
    const curriculumCourses = getCoursesByProgramSync(program, year);
    assert.ok(curriculumCourses.length > 0, `${label} should have courses in catalog`);

    const exactCourses = curriculumCourses.filter(c => !isWildcardCourseCode(c.code));
    const wildcardCourses = curriculumCourses.filter(c => isWildcardCourseCode(c.code));

    // 1. Scenario A: Brand new student (0 courses passed)
    const uncompletedNew = computeUncompletedCurriculumCourses(curriculumCourses, [], []);
    assert.equal(
      uncompletedNew.length,
      curriculumCourses.length,
      `${label}: New student should have all ${curriculumCourses.length} courses uncompleted`
    );

    // 2. Scenario B: Student passed all exact courses, but 0 electives
    const passedExact = exactCourses.map((c, idx) => ({
      id: `exact-${idx}`,
      code: c.code,
      name: c.name,
      credits: c.credits,
      category: c.category,
      status: 'completed',
      grade: 'B'
    }));

    const uncompletedAfterExact = computeUncompletedCurriculumCourses(curriculumCourses, passedExact, []);
    assert.equal(
      uncompletedAfterExact.length,
      wildcardCourses.length,
      `${label}: Should leave exactly ${wildcardCourses.length} wildcard courses uncompleted`
    );
    // Every uncompleted course must be a wildcard
    for (const unc of uncompletedAfterExact) {
      assert.ok(
        isWildcardCourseCode(unc.code),
        `${label}: Course ${unc.code} should be a wildcard`
      );
    }

    // 3. Scenario C: Student passed all exact courses AND fulfilled all wildcard electives
    // Generate matching electives based on the target type of each wildcard
    const passedElectives = wildcardCourses.map((w, idx) => {
      const targetType = categorizeElectiveCourse(
        w.category,
        w.mainCategory,
        w.subCategory,
        w.name,
        w.code
      );

      let sampleCode = `00000000${idx}`;
      let sampleName = `Elective ${idx}`;
      let sampleSub = '';

      if (targetType === 'pe') {
        sampleCode = `0803035${idx.toString().padStart(2, '0')}`;
        sampleName = `วิชากีฬา ${idx}`;
        sampleSub = 'กลุ่มวิชากีฬาและนันทนาการ';
      } else if (targetType === 'major_elective') {
        sampleCode = `0602339${idx.toString().padStart(2, '0')}`;
        sampleName = `วิชาเลือกกลุ่มวิชาชีพ ${idx}`;
        sampleSub = 'กลุ่มวิชาชีพ';
      } else if (targetType === 'gened') {
        sampleCode = `0802039${idx.toString().padStart(2, '0')}`;
        sampleName = `วิชาศึกษาทั่วไป ${idx}`;
        sampleSub = 'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์';
      } else {
        sampleCode = `0999999${idx.toString().padStart(2, '0')}`;
        sampleName = `วิชาเลือกเสรี ${idx}`;
      }

      return {
        id: `elective-${idx}`,
        code: `${program}-${sampleCode}`,
        name: sampleName,
        subCategory: sampleSub,
        credits: w.credits || 3,
        status: 'completed',
        grade: 'B'
      };
    });

    const allPassedCourses = [...passedExact, ...passedElectives];
    const uncompletedFullySatisfied = computeUncompletedCurriculumCourses(
      curriculumCourses,
      allPassedCourses,
      []
    );

    assert.equal(
      uncompletedFullySatisfied.length,
      0,
      `${label}: When all exact courses and electives are completed, uncompleted count must be 0 (got ${uncompletedFullySatisfied.length})`
    );

    // 4. Scenario D: Failed course handling
    if (exactCourses.length > 0) {
      const firstCourse = exactCourses[0];
      const coursesWithFail = [
        ...passedExact.slice(1),
        ...passedElectives,
        {
          id: 'failed-1',
          code: firstCourse.code,
          name: firstCourse.name,
          credits: firstCourse.credits,
          status: 'failed',
          grade: 'F'
        }
      ];

      const uncompletedWithFail = computeUncompletedCurriculumCourses(
        curriculumCourses,
        coursesWithFail,
        [firstCourse.code]
      );

      assert.equal(
        uncompletedWithFail.length,
        1,
        `${label}: Should have exactly 1 uncompleted course when 1 course failed`
      );
      assert.equal(
        uncompletedWithFail[0].code,
        firstCourse.code,
        `${label}: Uncompleted course should match the failed course code`
      );
      assert.equal(
        uncompletedWithFail[0].isFailed,
        true,
        `${label}: Failed course must have isFailed: true`
      );
    }
  });
}
