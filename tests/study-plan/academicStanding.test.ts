import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAcademicStanding,
  calculateSemesterGPAHistory,
  calculateTargetGPANextTerm
} from '../../src/utils/gradeUtils.js';

interface TestCourse {
  year: number;
  semester: number;
  credits: number;
  grade?: string;
  status: string;
}

test('evaluateAcademicStanding: unrecorded/new student with no grades', () => {
  const result = evaluateAcademicStanding([]);
  assert.equal(result.standing, 'normal');
  assert.equal(result.isProbation, false);
  assert.equal(result.isRetired, false);
  assert.equal(result.consecutiveProbationCount, 0);
  assert.equal(result.allowedMaxCredits, 22);
  assert.equal(result.targetGPANextTerm, null);
});

test('evaluateAcademicStanding: normal student with GPAX >= 2.00', () => {
  const courses = [
    { year: 1, semester: 1, credits: 3, grade: 'B', status: 'completed' }, // 3.0
    { year: 1, semester: 1, credits: 3, grade: 'C+', status: 'completed' }, // 2.5
    { year: 1, semester: 2, credits: 3, grade: 'B+', status: 'completed' }  // 3.5
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.standing, 'normal');
  assert.equal(result.isProbation, false);
  assert.equal(result.isRetired, false);
  assert.equal(result.consecutiveProbationCount, 0);
  assert.equal(result.allowedMaxCredits, 22);
});

test('evaluateAcademicStanding: high probation (GPAX 1.75 - 1.99)', () => {
  // 10 credits with 18 grade points => GPAX = 1.80
  const courses = [
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' }, // 3 * 2.0 = 6.0
    { year: 1, semester: 1, credits: 3, grade: 'D+', status: 'completed' }, // 3 * 1.5 = 4.5
    { year: 1, semester: 2, credits: 4, grade: 'D+', status: 'completed' }  // 4 * 1.5 = 6.0 (total = 16.5 / 10 = 1.65, wait let's calibrate)
  ];
  // Let's create exact 1.80: 3 cr * 2.0 (6) + 3 cr * 2.0 (6) + 4 cr * 1.5 (6) = 18 pts / 10 cr = 1.80
  const coursesExact18: TestCourse[] = [
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' },
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' },
    { year: 1, semester: 2, credits: 4, grade: 'D+', status: 'completed' }
  ];
  const result = evaluateAcademicStanding(coursesExact18);
  assert.equal(result.standing, 'high_probation');
  assert.equal(result.isProbation, true);
  assert.equal(result.isHighProbation, true);
  assert.equal(result.isLowProbation, false);
  assert.equal(result.isRetired, false);
  assert.equal(result.allowedMaxCredits, 16);
  assert.equal(result.consecutiveProbationCount, 1);
});

test('evaluateAcademicStanding: low probation (GPAX 1.50 - 1.74)', () => {
  // 10 credits with 16 grade points => GPAX = 1.60
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 4, grade: 'C', status: 'completed' },  // 4 * 2.0 = 8
    { year: 1, semester: 2, credits: 6, grade: 'D+', status: 'completed' } // 6 * 1.5 = 9 => total 17 / 10 = 1.70
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.standing, 'low_probation');
  assert.equal(result.isProbation, true);
  assert.equal(result.isLowProbation, true);
  assert.equal(result.isHighProbation, false);
  assert.equal(result.isRetired, false);
  assert.equal(result.allowedMaxCredits, 16);
  assert.equal(result.consecutiveProbationCount, 1);
});

test('evaluateAcademicStanding: Year 1 Sem 1 with GPAX < 1.50 gives warning, not immediate retirement', () => {
  // Only Y1S1 completed with 1.40
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 3, grade: 'D', status: 'completed' }, // 3 * 1.0 = 3
    { year: 1, semester: 1, credits: 3, grade: 'D+', status: 'completed' } // 3 * 1.5 = 4.5 => total 7.5 / 6 = 1.25
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.isRetired, false);
  assert.equal(result.standing, 'low_probation'); // Warning in Y1S1
  assert.equal(result.consecutiveProbationCount, 1);
});

test('evaluateAcademicStanding: Year 1 Sem 2 with GPAX < 1.50 triggers immediate retirement', () => {
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 3, grade: 'D', status: 'completed' }, // 3 * 1.0 = 3
    { year: 1, semester: 2, credits: 3, grade: 'D', status: 'completed' }  // 3 * 1.0 = 3 => 6 / 6 = 1.00 < 1.50
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.standing, 'retired');
  assert.equal(result.isRetired, true);
  assert.match(result.retireReason || '', /1\.50/);
});

test('evaluateAcademicStanding: 4 consecutive semesters with GPAX < 2.00 triggers retirement', () => {
  // Y1S1: 1.70, Y1S2: 1.70, Y2S1: 1.70, Y2S2: 1.70 (all >= 1.50 and < 2.00)
  const courses: TestCourse[] = [
    // Y1S1
    { year: 1, semester: 1, credits: 6, grade: 'D+', status: 'completed' }, // 9 pts / 6 cr = 1.50
    // Y1S2
    { year: 1, semester: 2, credits: 6, grade: 'D+', status: 'completed' }, // 18 pts / 12 cr = 1.50
    // Y2S1
    { year: 2, semester: 1, credits: 6, grade: 'D+', status: 'completed' }, // 27 pts / 18 cr = 1.50
    // Y2S2 (4th consecutive probation)
    { year: 2, semester: 2, credits: 6, grade: 'D+', status: 'completed' }  // 36 pts / 24 cr = 1.50
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.standing, 'retired');
  assert.equal(result.isRetired, true);
  assert.equal(result.consecutiveProbationCount, 4);
  assert.match(result.retireReason || '', /4 ภาคการศึกษา/);
});

test('evaluateAcademicStanding: probation counter resets when GPAX reaches >= 2.00', () => {
  const courses: TestCourse[] = [
    // Y1S1: GPAX 1.75 (Probation 1)
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' },  // 6 pts
    { year: 1, semester: 1, credits: 3, grade: 'D+', status: 'completed' }, // 4.5 pts => 10.5 / 6 = 1.75
    // Y1S2: GPAX >= 2.00 (Reset!)
    { year: 1, semester: 2, credits: 6, grade: 'B', status: 'completed' },  // 18 pts => 28.5 / 12 = 2.375 >= 2.00
    // Y2S1: Drops back to probation (1.75)
    { year: 2, semester: 1, credits: 6, grade: 'D', status: 'completed' }  // 6 pts => (28.5 + 6) / 18 = 34.5 / 18 = 1.91 (High probation)
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.consecutiveProbationCount, 1); // Reset back to 1, NOT 2 or 3!
  assert.equal(result.isRetired, false);
  assert.equal(result.isProbation, true);
});

test('evaluateAcademicStanding: summer semester does not increment consecutive probation counter', () => {
  const courses: TestCourse[] = [
    // Y1S1: Probation 1
    { year: 1, semester: 1, credits: 6, grade: 'D+', status: 'completed' },
    // Y1S2: Probation 2
    { year: 1, semester: 2, credits: 6, grade: 'D+', status: 'completed' },
    // Y1S3 (Summer): still < 2.00, but counter stays 2!
    { year: 1, semester: 3, credits: 3, grade: 'D+', status: 'completed' }
  ];
  const result = evaluateAcademicStanding(courses);
  assert.equal(result.consecutiveProbationCount, 2); // Still 2, not 3!
  assert.equal(result.isRetired, false);
});

test('calculateTargetGPANextTerm: calculates required GPA accurately', () => {
  // Currently: 30 credits completed with 51 grade points => GPAX = 1.70
  // Next semester: 16 credits
  // Total credits will be 46
  // Required total points for 2.00 = 46 * 2.00 = 92
  // Required points in next term = 92 - 51 = 41
  // Required GPA = 41 / 16 = 2.5625 => 2.57
  const target = calculateTargetGPANextTerm(30, 51, 16);
  assert.ok(target !== null);
  assert.equal(target.requiredGPA, 2.57);
  assert.equal(target.isAchievableInOneTerm, true);
});
