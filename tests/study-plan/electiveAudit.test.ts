import test from 'node:test';
import assert from 'node:assert/strict';
import { getCoursesByProgramSync } from '../../src/services/courseService.js';
import {
  computeCategoryCreditAudit,
  categorizeCourseForAudit,
  AuditCategoryKey
} from '../../src/utils/electiveAuditUtils.js';
import { CURRICULUM_RULES_CATALOG } from '../../src/services/curriculumCatalogService.js';

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

test('ElectiveAuditEngine: Target category credits sum to total catalog credits across all 13 curricula', () => {
  for (const { program, year, label } of CURRICULA_TO_TEST) {
    const currCourses = getCoursesByProgramSync(program, year);
    const rule = CURRICULUM_RULES_CATALOG[label];
    assert.ok(currCourses.length > 0, `${label} courses found`);
    assert.equal(currCourses.length, rule.totalCourses, `${label} total course count matches catalog`);

    const audit = computeCategoryCreditAudit(currCourses, []);
    assert.equal(
      audit.totalRequiredCredits,
      rule.totalCredits,
      `${label}: Total required credits (${audit.totalRequiredCredits}) matches catalog (${rule.totalCredits})`
    );

    // Categories must sum to total
    const sumCategories =
      audit.categories.gened.requiredCredits +
      audit.categories.core_required.requiredCredits +
      audit.categories.major_elective.requiredCredits +
      audit.categories.free_elective.requiredCredits;

    assert.equal(sumCategories, rule.totalCredits, `${label}: 4 Category quotas sum to totalCredits`);
    assert.equal(audit.totalCompletedCredits, 0, 'New student has 0 completed credits');
    assert.equal(audit.totalRemainingCredits, rule.totalCredits, 'New student remaining credits equals total');
    assert.equal(audit.isAllSatisfied, false, 'New student is not satisfied');
  }
});

test('ElectiveAuditEngine: Waterfall Overflow — excess Major Elective credits cascade to Free Elective', () => {
  const currCourses = getCoursesByProgramSync('INE', '62');
  // INE-62 requires: GenEd 31, Core 89, Major 9, Free 6
  // Student passes: 12 credits of Major Electives (4 courses x 3 credits), 3 credits of Free Electives
  const studentCourses = [
    { id: '1', code: '060233301', name: 'วิชาเลือกกลุ่มวิชาชีพ 1', credits: 3, status: 'completed', grade: 'B', category: 'core', subCategory: 'กลุ่มวิชาชีพ' },
    { id: '2', code: '060233302', name: 'วิชาเลือกกลุ่มวิชาชีพ 2', credits: 3, status: 'completed', grade: 'A', category: 'core', subCategory: 'กลุ่มวิชาชีพ' },
    { id: '3', code: '060233303', name: 'วิชาเลือกกลุ่มวิชาชีพ 3', credits: 3, status: 'completed', grade: 'B+', category: 'core', subCategory: 'กลุ่มวิชาชีพ' },
    { id: '4', code: '060233304', name: 'วิชาเลือกกลุ่มวิชาชีพ 4', credits: 3, status: 'completed', grade: 'C+', category: 'core', subCategory: 'กลุ่มวิชาชีพ' },
    // Direct free elective: 3 credits
    { id: '5', code: '099999001', name: 'วิชาเลือกเสรี ดนตรีสากล', credits: 3, status: 'completed', grade: 'A', category: 'free', mainCategory: 'หมวดวิชาเลือกเสรี' }
  ];

  const audit = computeCategoryCreditAudit(currCourses, studentCourses);

  // Major Elective: 9 required, 12 earned -> 9 completed, 3 overflow!
  assert.equal(audit.categories.major_elective.requiredCredits, 9);
  assert.equal(audit.categories.major_elective.completedCredits, 9);
  assert.equal(audit.categories.major_elective.totalEarnedCredits, 12);
  assert.equal(audit.categories.major_elective.remainingCredits, 0);
  assert.equal(audit.categories.major_elective.overflowCredits, 3);
  assert.equal(audit.categories.major_elective.isSatisfied, true);

  // Free Elective: 6 required, 3 direct earned + 3 overflow = 6 completed!
  assert.equal(audit.categories.free_elective.requiredCredits, 6);
  assert.equal(audit.categories.free_elective.totalEarnedCredits, 3);
  assert.equal(audit.categories.free_elective.receivedOverflowCredits, 3);
  assert.equal(audit.categories.free_elective.completedCredits, 6);
  assert.equal(audit.categories.free_elective.remainingCredits, 0);
  assert.equal(audit.categories.free_elective.isSatisfied, true);

  // Check overflow log
  assert.equal(audit.overflowLog.length, 1);
  assert.equal(audit.overflowLog[0].source, 'major_elective');
  assert.equal(audit.overflowLog[0].target, 'free_elective');
  assert.equal(audit.overflowLog[0].credits, 3);
});

test('ElectiveAuditEngine: Waterfall Overflow — excess GenEd credits cascade to Free Elective', () => {
  const currCourses = getCoursesByProgramSync('INE', '67');
  // INE-67: GenEd 24, Core 89, Major 6, Free 6
  // Student passes: 27 credits GenEd (3 credits surplus), 0 free electives
  const studentCourses = [
    { id: '1', code: '080103001', name: 'ภาษาอังกฤษ 1', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '2', code: '080103002', name: 'ภาษาอังกฤษ 2', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '3', code: '080203901', name: 'GenEd 1', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '4', code: '080203902', name: 'GenEd 2', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '5', code: '080203903', name: 'GenEd 3', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '6', code: '080203904', name: 'GenEd 4', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '7', code: '080203905', name: 'GenEd 5', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '8', code: '080203906', name: 'GenEd 6', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' },
    { id: '9', code: '080203907', name: 'GenEd 7', credits: 3, status: 'completed', grade: 'A', category: 'general', mainCategory: 'หมวดวิชาศึกษาทั่วไป' }
    // Total GenEd = 27 credits (surplus = 3)
  ];

  const audit = computeCategoryCreditAudit(currCourses, studentCourses);

  // INE-67 GenEd required is 24 credits (including PE). Student took 27 credits -> 3 overflow credits!
  assert.equal(audit.categories.gened.requiredCredits, 24);
  assert.equal(audit.categories.gened.completedCredits, 24);
  assert.equal(audit.categories.gened.totalEarnedCredits, 27);
  assert.equal(audit.categories.gened.overflowCredits, 3);
  assert.equal(audit.categories.gened.isSatisfied, true);

  // Free Elective: 6 required, 0 direct earned + 3 overflow = 3 completed, 3 remaining!
  assert.equal(audit.categories.free_elective.requiredCredits, 6);
  assert.equal(audit.categories.free_elective.totalEarnedCredits, 0);
  assert.equal(audit.categories.free_elective.receivedOverflowCredits, 3);
  assert.equal(audit.categories.free_elective.completedCredits, 3);
  assert.equal(audit.categories.free_elective.remainingCredits, 3);
  assert.equal(audit.categories.free_elective.isSatisfied, false);
});

test('ElectiveAuditEngine: Real Student Kainapat (INE-62) Firebase Study Plan verification', async () => {
  const currCourses = getCoursesByProgramSync('INE', '62');
  const res = await fetch('https://it-chatbot-f663e-default-rtdb.asia-southeast1.firebasedatabase.app/studyPlans/-OzruUs1m_rYg5iXAcTl.json');
  const plan = await res.json();

  const audit = computeCategoryCreditAudit(currCourses, plan.courses || []);

  assert.equal(audit.totalRequiredCredits, 135, 'Total curriculum credits must be 135');
  assert.equal(audit.totalCompletedCredits, 126, 'Kainapat completed credits must be 126');
  assert.equal(audit.totalRemainingCredits, 9, 'Kainapat remaining credits must be 9');
  assert.equal(audit.isAllSatisfied, false, 'Student still has uncompleted core courses');

  // GenEd: 31/31 (100% complete)
  assert.equal(audit.categories.gened.requiredCredits, 31);
  assert.equal(audit.categories.gened.completedCredits, 31);
  assert.equal(audit.categories.gened.remainingCredits, 0);
  assert.equal(audit.categories.gened.isSatisfied, true);

  // Major Elective: 9/9 (100% complete)
  assert.equal(audit.categories.major_elective.requiredCredits, 9);
  assert.equal(audit.categories.major_elective.completedCredits, 9);
  assert.equal(audit.categories.major_elective.remainingCredits, 0);
  assert.equal(audit.categories.major_elective.isSatisfied, true);

  // Free Elective: 6/6 (100% complete)
  assert.equal(audit.categories.free_elective.requiredCredits, 6);
  assert.equal(audit.categories.free_elective.completedCredits, 6);
  assert.equal(audit.categories.free_elective.remainingCredits, 0);
  assert.equal(audit.categories.free_elective.isSatisfied, true);

  // Core Required: 80/89 (80 passed, 9 remaining)
  assert.equal(audit.categories.core_required.requiredCredits, 89);
  assert.equal(audit.categories.core_required.completedCredits, 80);
  assert.equal(audit.categories.core_required.remainingCredits, 9);
  assert.equal(audit.categories.core_required.isSatisfied, false);
});

test('ElectiveAuditEngine: Dual Waterfall Overflow — both GenEd and Major Elective excess satisfy Free Elective fully', () => {
  const currCourses = getCoursesByProgramSync('IT', '62');
  // IT-62: GenEd 37, Core 69, Major 15, Free 6
  // Student takes:
  // GenEd: 40 credits (+3 surplus)
  // Major Elective: 18 credits (+3 surplus)
  // Direct Free: 0 credits
  const studentCourses = [
    // 40 GenEd credits
    ...Array.from({ length: 13 }, (_, i) => ({
      id: `g${i}`, code: `0802030${i.toString().padStart(2, '0')}`, name: `GenEd ${i}`, credits: i === 0 ? 4 : 3,
      status: 'completed', grade: 'B', category: 'general'
    })),
    // 18 Major Elective credits (6 courses x 3 credits)
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `m${i}`, code: `0602333${i.toString().padStart(2, '0')}`, name: `Major Elective ${i}`, credits: 3,
      status: 'completed', grade: 'A', category: 'core', subCategory: 'กลุ่มวิชาชีพ'
    }))
  ];

  const audit = computeCategoryCreditAudit(currCourses, studentCourses);

  assert.equal(audit.categories.gened.overflowCredits, 3);
  assert.equal(audit.categories.major_elective.overflowCredits, 3);

  // 3 from GenEd + 3 from Major = 6 received overflow credits!
  assert.equal(audit.categories.free_elective.requiredCredits, 6);
  assert.equal(audit.categories.free_elective.totalEarnedCredits, 0);
  assert.equal(audit.categories.free_elective.receivedOverflowCredits, 6);
  assert.equal(audit.categories.free_elective.completedCredits, 6);
  assert.equal(audit.categories.free_elective.remainingCredits, 0);
  assert.equal(audit.categories.free_elective.isSatisfied, true);
  assert.equal(audit.overflowLog.length, 2);
});

test('ElectiveAuditEngine: Direct Free Elective surplus is captured without breaking satisfaction', () => {
  const currCourses = getCoursesByProgramSync('ITT', '67');
  // ITT-67: Free 6 required
  // Student passes 9 credits of free electives (3 courses x 3 credits)
  const studentCourses = [
    { id: 'f1', code: '0901', name: 'Free 1', credits: 3, status: 'completed', grade: 'A', category: 'free' },
    { id: 'f2', code: '0902', name: 'Free 2', credits: 3, status: 'completed', grade: 'B', category: 'free' },
    { id: 'f3', code: '0903', name: 'Free 3', credits: 3, status: 'completed', grade: 'C', category: 'free' }
  ];

  const audit = computeCategoryCreditAudit(currCourses, studentCourses);

  assert.equal(audit.categories.free_elective.requiredCredits, 6);
  assert.equal(audit.categories.free_elective.completedCredits, 6);
  assert.equal(audit.categories.free_elective.totalEarnedCredits, 9);
  assert.equal(audit.categories.free_elective.overflowCredits, 3);
  assert.equal(audit.categories.free_elective.remainingCredits, 0);
  assert.equal(audit.categories.free_elective.isSatisfied, true);
});
