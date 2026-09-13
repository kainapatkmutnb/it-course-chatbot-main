import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurriculumDurationGuard,
  getActiveCurriculumRule,
  CURRICULUM_RULES_CATALOG,
} from '../../src/services/curriculumCatalogService.js';

test('catalog contains all 13 specific curricula', () => {
  const keys = Object.keys(CURRICULUM_RULES_CATALOG);
  const required = ['ITT-67','ITI-66','ITI-61','INET-67','INET-62','IT-67','IT-67-COOP','IT-62','IT-62-COOP','INE-67','INE-67-COOP','INE-62','INE-62-COOP'];
  for (const id of required) assert.ok(keys.includes(id), 'Missing: ' + id);
});

test('catalog contains all 5 fallback group keys', () => {
  const keys = Object.keys(CURRICULUM_RULES_CATALOG);
  for (const g of ['ITT','ITI','INET','IT','INE']) assert.ok(keys.includes(g), 'Missing group: ' + g);
});

test('getCurriculumDurationGuard returns same object', () => {
  assert.deepEqual(getCurriculumDurationGuard(), CURRICULUM_RULES_CATALOG);
});

test('ITT-67 has no internship, no co-op, 4 semesters, 84 credits', () => {
  const r = CURRICULUM_RULES_CATALOG['ITT-67'];
  assert.equal(r.internship.hasInternship, false);
  assert.equal(r.coop.hasCoop, false);
  assert.equal(r.durationYears, 2);
  assert.equal(r.totalSemesters, 4);
  assert.equal(r.totalCredits, 84);
  assert.equal(r.totalCourses, 28);
});

test('ITI-66 internship 1-3 060223129 2cr', () => {
  const r = CURRICULUM_RULES_CATALOG['ITI-66'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '1-3');
  assert.equal(r.internship.courseCode, '060223129');
  assert.equal(r.internship.credits, 2);
  assert.equal(r.coop.hasCoop, false);
});

test('ITI-61 internship 1-3 060223129 2cr', () => {
  const r = CURRICULUM_RULES_CATALOG['ITI-61'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '1-3');
  assert.equal(r.internship.courseCode, '060223129');
  assert.equal(r.internship.credits, 2);
  assert.equal(r.coop.hasCoop, false);
});

test('INET-67 internship 2-3 060233403 1cr', () => {
  const r = CURRICULUM_RULES_CATALOG['INET-67'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '2-3');
  assert.equal(r.internship.courseCode, '060233403');
  assert.equal(r.internship.credits, 1);
  assert.equal(r.coop.hasCoop, false);
  assert.equal(r.durationYears, 3);
});

test('INET-62 internship 2-3 060233403 2cr', () => {
  const r = CURRICULUM_RULES_CATALOG['INET-62'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '2-3');
  assert.equal(r.internship.courseCode, '060233403');
  assert.equal(r.internship.credits, 2);
  assert.equal(r.coop.hasCoop, false);
});

test('IT-67 internship 3-3 060243204 1cr 9semesters', () => {
  const r = CURRICULUM_RULES_CATALOG['IT-67'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '3-3');
  assert.equal(r.internship.courseCode, '060243204');
  assert.equal(r.internship.credits, 1);
  assert.equal(r.coop.hasCoop, false);
  assert.equal(r.durationYears, 4);
  assert.equal(r.totalSemesters, 9);
  assert.ok(r.validSemesters.includes('3-3'));
});

test('IT-62 internship 3-3 060243201 2cr', () => {
  const r = CURRICULUM_RULES_CATALOG['IT-62'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '3-3');
  assert.equal(r.internship.courseCode, '060243201');
  assert.equal(r.internship.credits, 2);
  assert.equal(r.coop.hasCoop, false);
});

test('INE-67 internship 3-3 060233403 1cr', () => {
  const r = CURRICULUM_RULES_CATALOG['INE-67'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '3-3');
  assert.equal(r.internship.courseCode, '060233403');
  assert.equal(r.internship.credits, 1);
  assert.equal(r.coop.hasCoop, false);
  assert.equal(r.totalSemesters, 9);
});

test('INE-62 internship 3-3 060233403 2cr 135credits', () => {
  const r = CURRICULUM_RULES_CATALOG['INE-62'];
  assert.equal(r.internship.hasInternship, true);
  assert.equal(r.internship.semester, '3-3');
  assert.equal(r.internship.courseCode, '060233403');
  assert.equal(r.internship.credits, 2);
  assert.equal(r.coop.hasCoop, false);
  assert.equal(r.totalCredits, 135);
  assert.equal(r.totalCourses, 50);
});

test('IT-67-COOP coop 4-1/4-2 060243301->060243302', () => {
  const r = CURRICULUM_RULES_CATALOG['IT-67-COOP'];
  assert.equal(r.internship.hasInternship, false);
  assert.equal(r.coop.hasCoop, true);
  assert.equal(r.coop.prepSemester, '4-1');
  assert.equal(r.coop.prepCourseCode, '060243301');
  assert.equal(r.coop.prepCredits, 1);
  assert.equal(r.coop.coopSemester, '4-2');
  assert.equal(r.coop.coopCourseCode, '060243302');
  assert.equal(r.coop.coopCredits, 6);
  assert.equal(r.totalSemesters, 8);
  assert.ok(r.forbiddenSemesters.includes('3-3'));
});

test('IT-62-COOP coop 4-1/4-2 060243301->060243302 prepCredits=2', () => {
  const r = CURRICULUM_RULES_CATALOG['IT-62-COOP'];
  assert.equal(r.internship.hasInternship, false);
  assert.equal(r.coop.hasCoop, true);
  assert.equal(r.coop.prepCourseCode, '060243301');
  assert.equal(r.coop.prepCredits, 2);
  assert.equal(r.coop.coopCourseCode, '060243302');
  assert.equal(r.coop.coopCredits, 6);
  assert.ok(r.forbiddenSemesters.includes('3-3'));
});

test('INE-67-COOP coop 4-1/4-2 060233501->060233502', () => {
  const r = CURRICULUM_RULES_CATALOG['INE-67-COOP'];
  assert.equal(r.internship.hasInternship, false);
  assert.equal(r.coop.hasCoop, true);
  assert.equal(r.coop.prepSemester, '4-1');
  assert.equal(r.coop.prepCourseCode, '060233501');
  assert.equal(r.coop.prepCredits, 1);
  assert.equal(r.coop.coopCourseCode, '060233502');
  assert.equal(r.coop.coopCredits, 6);
  assert.ok(r.forbiddenSemesters.includes('3-3'));
});

test('INE-62-COOP prep in 3-2 (distinct) 060233501->060233502 prepCredits=2', () => {
  const r = CURRICULUM_RULES_CATALOG['INE-62-COOP'];
  assert.equal(r.internship.hasInternship, false);
  assert.equal(r.coop.hasCoop, true);
  assert.equal(r.coop.prepSemester, '3-2');
  assert.equal(r.coop.prepCourseCode, '060233501');
  assert.equal(r.coop.prepCredits, 2);
  assert.equal(r.coop.coopCourseCode, '060233502');
  assert.equal(r.coop.coopCredits, 6);
  assert.ok(r.forbiddenSemesters.includes('3-3'));
});

test('getActiveCurriculumRule exact match IT-67', () => {
  const r = getActiveCurriculumRule('IT-67');
  assert.ok(r !== null);
  assert.equal(r.programId, 'IT-67');
  assert.equal(r.internship.courseCode, '060243204');
});

test('getActiveCurriculumRule exact match IT-67-COOP', () => {
  const r = getActiveCurriculumRule('IT-67-COOP');
  assert.ok(r !== null);
  assert.equal(r.programId, 'IT-67-COOP');
  assert.equal(r.coop.hasCoop, true);
});

test('getActiveCurriculumRule fallback IT-70 -> IT', () => {
  const r = getActiveCurriculumRule('IT-70');
  assert.ok(r !== null);
  assert.equal(r.programId, 'IT');
});

test('getActiveCurriculumRule fallback INE-58 -> INE', () => {
  const r = getActiveCurriculumRule('INE-58');
  assert.ok(r !== null);
  assert.equal(r.programId, 'INE');
});

test('getActiveCurriculumRule empty string -> null', () => {
  assert.equal(getActiveCurriculumRule(''), null);
});

test('getActiveCurriculumRule unknown -> null', () => {
  assert.equal(getActiveCurriculumRule('XYZ-99'), null);
});

test('INET curricula forbid 4-1 and 4-2', () => {
  for (const id of ['INET-67','INET-62']) {
    const r = CURRICULUM_RULES_CATALOG[id];
    assert.ok(r.forbiddenSemesters.includes('4-1'), id + ' must forbid 4-1');
    assert.ok(r.forbiddenSemesters.includes('4-2'), id + ' must forbid 4-2');
  }
});

test('ITT-67 forbids all semesters beyond 2-2', () => {
  const r = CURRICULUM_RULES_CATALOG['ITT-67'];
  for (const s of ['1-3','2-3','3-1','3-2','3-3','4-1','4-2']) {
    assert.ok(r.forbiddenSemesters.includes(s), 'ITT-67 must forbid ' + s);
    assert.ok(!r.validSemesters.includes(s), 'ITT-67 valid must not contain ' + s);
  }
});

test('4-year regular curricula have 3-3 as valid', () => {
  for (const id of ['IT-67','IT-62','INE-67','INE-62']) {
    const r = CURRICULUM_RULES_CATALOG[id];
    assert.ok(r.validSemesters.includes('3-3'), id + ' must have 3-3 as valid');
    assert.ok(!r.forbiddenSemesters.includes('3-3'), id + ' must not forbid 3-3');
  }
});

test('4-year co-op curricula forbid 3-3', () => {
  for (const id of ['IT-67-COOP','IT-62-COOP','INE-67-COOP','INE-62-COOP']) {
    const r = CURRICULUM_RULES_CATALOG[id];
    assert.ok(r.forbiddenSemesters.includes('3-3'), id + ' must forbid 3-3');
    assert.ok(!r.validSemesters.includes('3-3'), id + ' must not have 3-3 as valid');
  }
});
