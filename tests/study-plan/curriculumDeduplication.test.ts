import test from 'node:test';
import assert from 'node:assert/strict';
import { studentCourses } from './fixtures.js';
import { getCoursesByProgramSync } from '../../src/services/courseService.js';
import {
  isWildcardCourseCode,
  categorizeElectiveCourse,
  computeUncompletedCurriculumCourses
} from '../../src/utils/curriculumDeduplicationUtils.js';

test('isWildcardCourseCode identifies placeholder codes', () => {
  assert.equal(isWildcardCourseCode('080xxxxxx'), true);
  assert.equal(isWildcardCourseCode('INE-0602333xx'), true);
  assert.equal(isWildcardCourseCode('xxxxxxxxx'), true);
  assert.equal(isWildcardCourseCode('080303xxx'), true);
  assert.equal(isWildcardCourseCode('040203111'), false);
  assert.equal(isWildcardCourseCode('INE-060233101'), false);
});

test('categorizeElectiveCourse identifies categories correctly', () => {
  assert.equal(categorizeElectiveCourse('general', 'หมวดวิชาศึกษาทั่วไป', 'กลุ่มวิชาภาษา'), 'gened');
  assert.equal(categorizeElectiveCourse('general', 'หมวดวิชาศึกษาทั่วไป', 'กลุ่มวิชากีฬาและนันทนาการ'), 'pe');
  assert.equal(categorizeElectiveCourse('core', 'หมวดวิชาเฉพาะ', 'กลุ่มวิชาชีพ', 'วิชาเลือกกลุ่มวิชาชีพ 1'), 'major_elective');
  assert.equal(categorizeElectiveCourse('free', 'หมวดวิชาเลือกเสรี', undefined, 'วิชาเลือกเสรี 1'), 'free_elective');
});

test('computeUncompletedCurriculumCourses on student Kainapat (INE-62)', () => {
  const curriculumCourses = getCoursesByProgramSync('INE', '62');
  const failedCodes: string[] = [];

  const uncompleted = computeUncompletedCurriculumCourses(
    curriculumCourses,
    studentCourses,
    failedCodes
  );

  // Kainapat has 46 passed courses in fixtures.
  // Wildcards for GenEd (080xxxxxx * 3), PE (080303xxx), Major Electives (0602333xx * 3), and Free Electives (xxxxxxxxx * 2)
  // should be fully satisfied and NOT appear in uncompleted.
  const uncompletedCodes = uncompleted.map(c => c.code.replace(/^INE-/, '').replace(/[\*\s]+$/g, ''));

  assert.equal(uncompletedCodes.includes('040203111'), true, 'Should include Math 1');
  assert.equal(uncompletedCodes.includes('040203112'), true, 'Should include Math 2');
  assert.equal(uncompletedCodes.includes('060233402'), true, 'Should include Project 2');

  // Must NOT include wildcard placeholders because student already passed them
  assert.equal(uncompletedCodes.some(c => /x{2,}/i.test(c)), false, 'Must not include wildcards');
  assert.equal(uncompleted.length, 6, `Expected exactly 6 uncompleted courses, got ${uncompleted.length}`);
});
