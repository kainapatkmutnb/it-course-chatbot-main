import test from 'node:test';
import assert from 'node:assert/strict';
import { studentCourses } from './fixtures.js';
import { buildStudyPlanView, resolveResult, computeProgressKPI } from '../../src/components/study-plan/studyPlanViewModel.js';
import { getCurriculumSummaryCatalog } from '../../src/services/curriculumCatalogService.js';

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

// computeProgressKPI tests
test('computeProgressKPI: user example INE 62 47/50 courses and 126/135 credits', () => {
  const kpi = computeProgressKPI(47, 126, 50, 135);
  assert.equal(kpi.passedCourses, 47);
  assert.equal(kpi.targetCourses, 50);
  assert.equal(kpi.passedCredits, 126);
  assert.equal(kpi.targetCredits, 135);
  assert.equal(kpi.remainingCourses, 3);
  assert.equal(kpi.remainingCredits, 9);
  assert.equal(kpi.progressPercent, 93);
  assert.equal(kpi.isCompleted, false);
  assert.equal(kpi.formattedProgress, '47/50 วิชา · 126/135 หน่วยกิต');
  assert.equal(kpi.formattedRemaining, 'ขาดอีก 3 วิชา · 9 หน่วยกิต');
});

test('computeProgressKPI: exact completion', () => {
  const kpi = computeProgressKPI(50, 135, 50, 135);
  assert.equal(kpi.remainingCourses, 0);
  assert.equal(kpi.remainingCredits, 0);
  assert.equal(kpi.progressPercent, 100);
  assert.equal(kpi.isCompleted, true);
  assert.equal(kpi.formattedProgress, '50/50 วิชา · 135/135 หน่วยกิต');
  assert.equal(kpi.formattedRemaining, 'ครบตามเกณฑ์หลักสูตรแล้ว');
});

test('computeProgressKPI: exceeding requirements clamp remaining to 0', () => {
  const kpi = computeProgressKPI(52, 140, 50, 135);
  assert.equal(kpi.remainingCourses, 0);
  assert.equal(kpi.remainingCredits, 0);
  assert.equal(kpi.progressPercent, 100);
  assert.equal(kpi.isCompleted, true);
  assert.equal(kpi.formattedProgress, '52/50 วิชา · 140/135 หน่วยกิต');
  assert.equal(kpi.formattedRemaining, 'ครบตามเกณฑ์หลักสูตรแล้ว');
});

test('computeProgressKPI: handles missing target courses gracefully', () => {
  const kpi = computeProgressKPI(45, 120, null, 135);
  assert.equal(kpi.targetCourses, null);
  assert.equal(kpi.remainingCourses, null);
  assert.equal(kpi.remainingCredits, 15);
  assert.equal(kpi.formattedProgress, '45 วิชา · 120/135 หน่วยกิต');
  assert.equal(kpi.formattedRemaining, 'ขาดอีก 15 หน่วยกิต');
});

test('all 13 curricula in catalog have positive totalCourses and totalCredits', () => {
  const catalog = getCurriculumSummaryCatalog();
  assert.equal(catalog.length, 13);
  
  const expectedCurricula = [
    { id: 'IT-62', courses: 44, credits: 127 },
    { id: 'IT-62-COOP', courses: 43, credits: 127 },
    { id: 'IT-67', courses: 42, credits: 120 },
    { id: 'IT-67-COOP', courses: 41, credits: 120 },
    { id: 'INE-62', courses: 50, credits: 135 },
    { id: 'INE-62-COOP', courses: 49, credits: 135 },
    { id: 'INE-67', courses: 46, credits: 125 },
    { id: 'INE-67-COOP', courses: 45, credits: 125 },
    { id: 'INET-62', courses: 38, credits: 103 },
    { id: 'INET-67', courses: 38, credits: 102 },
    { id: 'ITI-61', courses: 31, credits: 81 },
    { id: 'ITI-66', courses: 32, credits: 78 },
    { id: 'ITT-67', courses: 28, credits: 84 },
  ];

  for (const exp of expectedCurricula) {
    const found = catalog.find(c => c.id === exp.id);
    assert.ok(found, `Curriculum ${exp.id} must exist in catalog`);
    assert.equal(found.totalCourses, exp.courses, `${exp.id} totalCourses`);
    assert.equal(found.totalCredits, exp.credits, `${exp.id} totalCredits`);
  }
});

