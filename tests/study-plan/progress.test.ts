import test from 'node:test';
import assert from 'node:assert/strict';
import { studentCourses } from './fixtures.js';
import { buildStudyPlanView, resolveResult } from '../../src/components/study-plan/studyPlanViewModel.js';

test('personal view matches all eight reported semesters', () => {
  const view = buildStudyPlanView(studentCourses, 135);
  assert.deepEqual(view.groups.map(g => [g.year,g.semester,g.courses.length,g.totalCredits]),
    [[1,1,5,11],[1,2,6,16],[2,1,7,19],[2,2,7,19],[3,1,7,19],[3,2,6,18],[4,1,7,19],[4,3,1,2]]);
  assert.equal(view.passedCount, 46);
  assert.equal(view.passedCredits, 123);
  assert.equal(view.progressPercent, 91);
  assert.equal(view.groups[2].courses[0].code, 'INE-060233104');
});

test('overrides and moved semester survive projection', () => {
  const row = {...studentCourses[0], year:5, semester:3, customCode:'CUSTOM-1', customName:'ชื่อใหม่'};
  const view = buildStudyPlanView([row], null);
  assert.equal(view.groups[0].year, 5);
  assert.equal(view.groups[0].courses[0].id, row.id);
  assert.equal(view.groups[0].courses[0].code, 'CUSTOM-1');
  assert.equal(view.groups[0].courses[0].name, 'ชื่อใหม่');
  assert.equal(view.progressPercent, null);
});

// resolveResult table-driven tests
test('resolveResult: passing grades', () => {
  for (const g of ['A','B+','B','C+','C','D+','D','S']) {
    assert.equal(resolveResult('completed', g), 'completed', `grade ${g}`);
  }
});
test('resolveResult: failing grades', () => {
  assert.equal(resolveResult('completed', 'F'), 'failed');
  assert.equal(resolveResult('completed', 'U'), 'failed');
});
test('resolveResult: incomplete and withdrawn', () => {
  assert.equal(resolveResult('completed', 'I'), 'incomplete');
  assert.equal(resolveResult('completed', 'W'), 'withdrawn');
});
test('resolveResult: unknown grade', () => {
  assert.equal(resolveResult('completed', 'P'), 'unknown');
  assert.equal(resolveResult('completed', 'X'), 'unknown');
});
test('resolveResult: no grade with status', () => {
  assert.equal(resolveResult('in_progress', ''), 'in_progress');
  assert.equal(resolveResult('planned', ''), 'planned');
  assert.equal(resolveResult('completed', ''), 'planned');
});
test('empty courses array', () => {
  const view = buildStudyPlanView([], 120);
  assert.equal(view.groups.length, 0);
  assert.equal(view.passedCount, 0);
  assert.equal(view.passedCredits, 0);
  assert.equal(view.progressPercent, 0);
});
test('null required credits gives null progressPercent', () => {
  const view = buildStudyPlanView(studentCourses, null);
  assert.equal(view.progressPercent, null);
});
test('duplicate codes with distinct row ids both appear', () => {
  const courses = [
    { id: 'r1', code: '060233101', originalName: 'X', credits: 3, grade: 'A', year: 1, semester: 1, category: 'core' as const, status: 'completed' as const },
    { id: 'r2', code: '060233101', originalName: 'X', credits: 3, grade: 'B', year: 1, semester: 1, category: 'core' as const, status: 'completed' as const },
  ];
  const view = buildStudyPlanView(courses, null);
  assert.equal(view.groups[0].courses.length, 2);
  assert.equal(view.passedCount, 2);
});
test('unassigned semester (year=0, semester=0) groups at start', () => {
  const courses = [
    { id: 'r1', code: 'A', originalName: 'A', credits: 3, grade: 'A', year: 0, semester: 0, category: 'core' as const, status: 'completed' as const },
  ];
  const view = buildStudyPlanView(courses, null);
  assert.equal(view.groups[0].year, 0);
  assert.equal(view.groups[0].semester, 0);
});
