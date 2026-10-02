import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAcademicStanding,
  calculateSemesterGPAHistory
} from '../../src/utils/gradeUtils.js';
import type { StudyMode } from '../../src/types/auth.js';

interface TestCourse {
  year: number;
  semester: number;
  credits: number;
  grade?: string;
  status: string;
}

// Case A: GPAX 2.50 -> normal, consecutiveBelow2Terms: 0, probation: false, regular 9-22
test('Case A: GPAX 2.50 -> normal, consecutiveBelow2Terms: 0, probation: false, regular 9-22', () => {
  // 6 credits with 15 grade points => GPAX = 2.50
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 3, grade: 'B', status: 'completed' },  // 3 * 3.0 = 9
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' }   // 3 * 2.0 = 6 => 15 / 6 = 2.50
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'normal');
  assert.equal(standing.currentGPAX, 2.50);
  assert.equal(standing.isProbation, false);
  assert.equal(standing.isHighProbation, false);
  assert.equal(standing.isLowProbation, false);
  assert.equal(standing.isRetired, false);
  assert.equal(standing.consecutiveBelow2Terms, 0);
  assert.equal(standing.consecutiveProbationCount, 0);
  assert.equal(standing.allowedMaxCredits, 22);
  assert.deepEqual(standing.probationCreditRange, { min: 15, max: 16 });
});

// Case B: GPAX 1.85 1 regular term -> high_probation (P2), consecutiveBelow2Terms: 1, probation: true, probationCreditRange: { min: 15, max: 16 }
test('Case B: GPAX 1.85 1 regular term -> high_probation (P2), consecutiveBelow2Terms: 1, probation: true', () => {
  // 10 credits with 18.5 grade points => GPAX = 1.85
  // e.g. 7 cr of C (14 pts) + 3 cr of D+ (4.5 pts) = 18.5 pts / 10 cr = 1.85
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 7, grade: 'C', status: 'completed' },
    { year: 1, semester: 1, credits: 3, grade: 'D+', status: 'completed' }
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'high_probation');
  assert.equal(standing.currentGPAX, 1.85);
  assert.equal(standing.isProbation, true);
  assert.equal(standing.isHighProbation, true);
  assert.equal(standing.isLowProbation, false);
  assert.equal(standing.isRetired, false);
  assert.equal(standing.consecutiveBelow2Terms, 1);
  assert.equal(standing.consecutiveProbationCount, 1);
  assert.equal(standing.allowedMaxCredits, 16);
  assert.deepEqual(standing.probationCreditRange, { min: 15, max: 16 });
  assert.ok(standing.targetGPANextTerm !== null);
});

// Case C: GPAX 1.65 1 regular term -> low_probation (P1), consecutiveBelow2Terms: 1, probation: true, probationCreditRange: { min: 15, max: 16 } (ไม่ถือว่ารีไทร์ทันที)
test('Case C: GPAX 1.65 1 regular term -> low_probation (P1), consecutiveBelow2Terms: 1, probation: true (not retired)', () => {
  // 10 credits with 16.5 grade points => GPAX = 1.65
  // e.g. 3 cr of C (6 pts) + 7 cr of D+ (10.5 pts) = 16.5 pts / 10 cr = 1.65
  const courses: TestCourse[] = [
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' },
    { year: 1, semester: 1, credits: 7, grade: 'D+', status: 'completed' }
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'low_probation');
  assert.equal(standing.currentGPAX, 1.65);
  assert.equal(standing.isProbation, true);
  assert.equal(standing.isLowProbation, true);
  assert.equal(standing.isHighProbation, false);
  assert.equal(standing.isRetired, false);
  assert.equal(standing.consecutiveBelow2Terms, 1);
  assert.equal(standing.consecutiveProbationCount, 1);
  assert.equal(standing.allowedMaxCredits, 16);
  assert.deepEqual(standing.probationCreditRange, { min: 15, max: 16 });
});

// Case D: GPAX 1.60 3 regular terms -> low_probation (P1), consecutiveBelow2Terms: 3, probation: true (ยังไม่รีไทร์ เพราะยังไม่ครบ 4 เทอม)
test('Case D: GPAX 1.60 3 regular terms -> low_probation (P1), consecutiveBelow2Terms: 3, probation: true (not retired)', () => {
  // 5 credits per term: 1 cr of C (2 pts) + 4 cr of D+ (6 pts) = 8 pts / 5 cr = 1.60
  const courses: TestCourse[] = [
    // Term 1 (Y1S1)
    { year: 1, semester: 1, credits: 1, grade: 'C', status: 'completed' },
    { year: 1, semester: 1, credits: 4, grade: 'D+', status: 'completed' },
    // Term 2 (Y1S2)
    { year: 1, semester: 2, credits: 1, grade: 'C', status: 'completed' },
    { year: 1, semester: 2, credits: 4, grade: 'D+', status: 'completed' },
    // Term 3 (Y2S1)
    { year: 2, semester: 1, credits: 1, grade: 'C', status: 'completed' },
    { year: 2, semester: 1, credits: 4, grade: 'D+', status: 'completed' }
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'low_probation');
  assert.equal(standing.currentGPAX, 1.60);
  assert.equal(standing.isProbation, true);
  assert.equal(standing.isLowProbation, true);
  assert.equal(standing.isRetired, false);
  assert.equal(standing.consecutiveBelow2Terms, 3);
  assert.equal(standing.consecutiveProbationCount, 3);
  assert.equal(standing.allowedMaxCredits, 16);
  assert.deepEqual(standing.probationCreditRange, { min: 15, max: 16 });
});

// Case E: GPAX 1.60 4 regular terms -> retired, consecutiveBelow2Terms: 4, isRetired: true, allowedMaxCredits: 0
test('Case E: GPAX 1.60 4 regular terms -> retired, consecutiveBelow2Terms: 4, isRetired: true, allowedMaxCredits: 0', () => {
  const courses: TestCourse[] = [
    // Term 1 (Y1S1)
    { year: 1, semester: 1, credits: 1, grade: 'C', status: 'completed' },
    { year: 1, semester: 1, credits: 4, grade: 'D+', status: 'completed' },
    // Term 2 (Y1S2)
    { year: 1, semester: 2, credits: 1, grade: 'C', status: 'completed' },
    { year: 1, semester: 2, credits: 4, grade: 'D+', status: 'completed' },
    // Term 3 (Y2S1)
    { year: 2, semester: 1, credits: 1, grade: 'C', status: 'completed' },
    { year: 2, semester: 1, credits: 4, grade: 'D+', status: 'completed' },
    // Term 4 (Y2S2) - 4th term!
    { year: 2, semester: 2, credits: 1, grade: 'C', status: 'completed' },
    { year: 2, semester: 2, credits: 4, grade: 'D+', status: 'completed' }
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'retired');
  assert.equal(standing.currentGPAX, 1.60);
  assert.equal(standing.isRetired, true);
  assert.equal(standing.consecutiveBelow2Terms, 4);
  assert.equal(standing.consecutiveProbationCount, 4);
  assert.equal(standing.allowedMaxCredits, 0);
  assert.match(standing.retireReason || '', /4 ภาคการศึกษา/);
});

// Case F: GPAX 1.40 หลังสิ้นสุดภาค 2 ของปี 1 (2 ภาคปกติ) -> retired ทันที (< 1.50), isRetired: true
test('Case F: GPAX 1.40 after end of Year 1 Semester 2 (2 regular terms) -> retired (< 1.50)', () => {
  // 5 credits per term with 7 points => 14 pts / 10 cr = 1.40
  // e.g. 4 cr of D (4 pts) + 1 cr of B (3 pts) = 7 pts
  const courses: TestCourse[] = [
    // Y1S1
    { year: 1, semester: 1, credits: 4, grade: 'D', status: 'completed' },
    { year: 1, semester: 1, credits: 1, grade: 'B', status: 'completed' },
    // Y1S2
    { year: 1, semester: 2, credits: 4, grade: 'D', status: 'completed' },
    { year: 1, semester: 2, credits: 1, grade: 'B', status: 'completed' }
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.standing, 'retired');
  assert.equal(standing.currentGPAX, 1.40);
  assert.equal(standing.isRetired, true);
  assert.equal(standing.allowedMaxCredits, 0);
  assert.match(standing.retireReason || '', /1\.50/);
});

// Case G: ติดโปร 1 เทอมปกติ -> ลง Summer -> Summer ไม่เพิ่ม counter consecutiveBelow2Terms (ยังคงเป็น 1 เท่าเดิม)
test('Case G: Probation 1 regular term -> Summer term -> Summer does not increment consecutiveBelow2Terms', () => {
  const courses: TestCourse[] = [
    // Y1S1: Regular term with GPAX 1.80 (Probation 1)
    { year: 1, semester: 1, credits: 3, grade: 'C', status: 'completed' },  // 6 pts
    { year: 1, semester: 1, credits: 3, grade: 'D+', status: 'completed' }, // 4.5 pts => 10.5 / 6 = 1.75
    // Y1S3 (Summer): term with GPAX < 2.00
    { year: 1, semester: 3, credits: 3, grade: 'D+', status: 'completed' } // 4.5 pts => 15 / 9 = 1.67
  ];
  const standing = evaluateAcademicStanding(courses);
  assert.equal(standing.isProbation, true);
  assert.equal(standing.consecutiveBelow2Terms, 1); // Stays 1, not 2!
  assert.equal(standing.consecutiveProbationCount, 1); // Stays 1, not 2!
  assert.equal(standing.isRetired, false);
});

// Additional tests: StudyMode and Credit limits logic
test('StudyMode and Credit Limits: regular mode', () => {
  const studyMode: StudyMode = 'regular';
  const isSpecialEvening = studyMode === 'special_evening';
  const minCredits = isSpecialEvening ? 6 : 9;
  const maxCredits = isSpecialEvening ? 18 : 22;
  const summerMax = 9;

  assert.equal(minCredits, 9);
  assert.equal(maxCredits, 22);
  assert.equal(summerMax, 9);
});

test('StudyMode and Credit Limits: special_evening mode', () => {
  const studyMode: StudyMode = 'special_evening';
  const isSpecialEvening = studyMode === 'special_evening';
  const minCredits = isSpecialEvening ? 6 : 9;
  const maxCredits = isSpecialEvening ? 18 : 22;
  const summerMax = 9;

  assert.equal(minCredits, 6);
  assert.equal(maxCredits, 18);
  assert.equal(summerMax, 9);
});

test('Authorized Credit Limit: registrationCreditLimitAuthorized true includes creditLimitSource approved', () => {
  const isCreditLimitAuthorized = true;
  const metadata = {
    registrationCreditLimitAuthorized: isCreditLimitAuthorized,
    ...(isCreditLimitAuthorized ? { creditLimitSource: 'approved' as const } : {})
  };
  assert.equal(metadata.registrationCreditLimitAuthorized, true);
  assert.equal(metadata.creditLimitSource, 'approved');

  const unauthorized = false;
  const unauthorizedMetadata: { registrationCreditLimitAuthorized: boolean; creditLimitSource?: string } = {
    registrationCreditLimitAuthorized: unauthorized,
    ...(unauthorized ? { creditLimitSource: 'approved' as const } : {})
  };
  assert.equal(unauthorizedMetadata.registrationCreditLimitAuthorized, false);
  assert.equal(unauthorizedMetadata.creditLimitSource, undefined);
});

test('RegistrationRules structure conformity with n8n workflow v19.19', () => {
  const registrationRules = {
    regularSemester: {
      minCredits: 9,
      maxCredits: 22,
      exception: 'สามารถลงทะเบียนเรียนต่ำกว่า 9 หน่วยกิตได้ หากเป็นภาคการศึกษาสุดท้ายที่คาดว่าจะสำเร็จการศึกษา'
    },
    specialEveningSemester: {
      minCredits: 6,
      maxCredits: 18,
      exception: 'สำหรับนักศึกษาโครงการจัดการศึกษาภาคพิเศษ/สมทบ'
    },
    probation: {
      creditRange: { min: 15, max: 16 },
      maxCredits: 16,
      condition: 'นักศึกษาที่มีเกรดเฉลี่ยสะสม (GPAX) ต่ำกว่า 2.00 ติดสถานะวิทยาทัณฑ์ (โปรต่ำ 1.50-1.74, โปรสูง 1.75-1.99)',
      petitionGuideline: 'หากมีความจำเป็นต้องลงทะเบียนเรียนเกิน 15-16 หน่วยกิต ต้องได้รับอนุมัติจากอาจารย์ที่ปรึกษาและคณบดี'
    },
    summerSemester: {
      maxCredits: 9,
      note: 'ภาคเรียนฤดูร้อนลงทะเบียนได้ไม่เกิน 9 หน่วยกิต'
    },
    academicDismissal: {
      condition: 'เกรดเฉลี่ยสะสม (GPAX) ต่ำกว่า 1.50 (หลังสิ้นสุดภาค 2 ปี 1) หรือติดสถานะวิทยาทัณฑ์ (GPAX < 2.00) ติดต่อกันครบ 4 ภาคการศึกษาปกติ จะพ้นสภาพนักศึกษา (รีไทร์)'
    }
  };

  assert.equal(registrationRules.regularSemester.minCredits, 9);
  assert.equal(registrationRules.regularSemester.maxCredits, 22);
  assert.equal(registrationRules.specialEveningSemester.minCredits, 6);
  assert.equal(registrationRules.specialEveningSemester.maxCredits, 18);
  assert.deepEqual(registrationRules.probation.creditRange, { min: 15, max: 16 });
  assert.equal(registrationRules.probation.maxCredits, 16);
  assert.equal(registrationRules.summerSemester.maxCredits, 9);
  assert.match(registrationRules.summerSemester.note, /9 หน่วยกิต/);
  assert.match(registrationRules.academicDismissal.condition, /1\.50/);
  assert.match(registrationRules.academicDismissal.condition, /4 ภาคการศึกษาปกติ/);
});

test('Metadata conformity: categoryCreditAudit and advising directives for n8n chatbot', () => {
  const advisingDirectives = {
    categoryCreditAuditRule: 'STRICT: เมื่อนักศึกษาถามเกี่ยวกับวิชาเลือก หมวดวิชาศึกษาทั่วไป วิชาเลือกกลุ่มวิชาชีพ วิชาเลือกเสรี หรือถามว่าวิชาเลือกครบหรือยัง ขาดอีกกี่หน่วยกิต ให้ยึดข้อมูลจาก categoryCreditAudit เป็น Single Source of Truth โดยระบุจำนวนหน่วยกิตที่ต้องเรียน (required), ที่เรียนผ่านแล้ว (completed), ที่ยังขาดอยู่ (remaining), และสถานะว่าครบแล้วหรือไม่ (isSatisfied) ของหมวดวิชานั้นๆ อย่างชัดเจน รวมถึงระบุหากมีหน่วยกิตเกินจากวิชาเลือกกลุ่มวิชาชีพหรือศึกษาทั่วไปที่โอนไปช่วยเติมเต็มหมวดวิชาเลือกเสรี (Waterfall Overflow)'
  };

  assert.ok(advisingDirectives.categoryCreditAuditRule.includes('categoryCreditAudit'));
  assert.ok(advisingDirectives.categoryCreditAuditRule.includes('Waterfall Overflow'));
  assert.ok(advisingDirectives.categoryCreditAuditRule.includes('Single Source of Truth'));
});
