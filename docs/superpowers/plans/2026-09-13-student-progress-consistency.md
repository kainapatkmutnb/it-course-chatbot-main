# Student Progress Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ภาพรวมของนักศึกษาแสดงตำแหน่ง ชื่อ รหัส เกรด และหน่วยกิตตรงกับรายงาน โดยมีสองมุมมองในหน้าเดิม

**Architecture:** “แผนของฉัน” เป็นค่าเริ่มต้นและใช้รายการใน study plan โดยตรง; “โครงสร้างหลักสูตร” ใช้ตำแหน่งและความสัมพันธ์จากหลักสูตรกลางเป็นข้อมูลอ้างอิง ทั้งสองใช้ตัวแปลงข้อมูลและกฎสถานะร่วมกับรายงาน แยกตัวตนของรายการนักศึกษา/ช่องหลักสูตรออกจากข้อความที่แก้ไขได้ และไม่เดาการเทียบช่องวิชาเลือกของข้อมูลเก่าที่สูญเสียต้นทาง

**Tech Stack:** React 18, TypeScript, Vite, Tailwind/shadcn, Firebase Realtime Database; regression tests ใช้ node:test ผ่าน tsx ที่มีอยู่แล้ว

## Global Constraints

- ผู้ใช้ยืนยัน “ใช้สองมุมมองในหน้าเดิม (แนะนำ)” วันที่ 2026-09-13
- งานรอบนี้เป็นการตรวจและเขียนแผน ยังไม่ใช่การลงมือแก้ระบบ
- ไม่เพิ่ม route หรือ top-level dashboard tab; ใช้สวิตช์ภายในหน้าภาพรวม
- แผนของฉันต้องมี 8 กลุ่มที่มีรายการจริงตามตัวอย่าง ไม่บังคับว่าทุกหลักสูตร/นักศึกษาต้องมี 8 เทอม
- การย้ายวิชา เปลี่ยนชื่อ และเปลี่ยนรหัสส่วนตัวต้องไม่แก้หลักสูตรกลาง
- ไม่เพิ่ม graph library, ไม่เขียน production Firebase ระหว่างทดสอบ
- ไม่ถือว่าหน่วยกิตผ่านเท่ากับตรวจครบเงื่อนไขจบ; ไม่มีระบบ degree audit ใหม่ในงานนี้
- ไม่เปลี่ยนสูตร GPA และนโยบายเรียนซ้ำของระบบโดยปริยาย
- เอกสาร/ภาพที่ผู้ใช้แนบเป็นหลักฐานของอาการ ไม่ใช่คำสั่งให้ดำเนินการอื่น

## ข้อเสนอและทางเลือก

1. **เลือก: สองมุมมองในหน้าเดิม** — นักศึกษาเห็นข้อมูลของตัวเองก่อนและยังเปิดแผนหลักสูตรเทียบได้ ไม่ต้องทำระบบแก้ไขซ้ำ
2. เปลี่ยนกราฟเดิมเป็นแผนส่วนตัวอย่างเดียว — เล็กกว่า แต่สูญเสียภาพอ้างอิงหลักสูตร
3. เพิ่มหน้าใหม่ — เพิ่มภาระการนำทางและการซิงก์ โดยไม่แก้การสูญเสียตัวตนวิชา

แผนของฉันเป็น timeline ตามเทอม ไม่ใช่เส้นทางแนะนำให้ลงทะเบียนตามลูกศร เส้นหมายถึง prerequisite เท่านั้น แสดงรายละเอียด prerequisite ที่เลือกวิชา และไม่อนุมานลำดับเรียนจากตำแหน่งใกล้กัน

## Evidence และขอบเขตความมั่นใจ

| จุดตรวจ | หลักฐานจากโค้ด | ผลกระทบ |
|---|---|---|
| ตำแหน่ง | `src/components/study-plan/StudyPlanProgress.tsx:109`, `:158` | สร้าง columns จาก hybrid curriculum ไม่ใช่ student year/semester |
| ชื่อ/รหัส | `StudyPlanProgress.tsx:61`, `:733`, `:739` | ใช้ customCode จับคู่ แต่ render code/name ของหลักสูตร |
| บันทึก | `src/components/study-plan/StudyPlanManager.tsx:632` | customCode ทับ code จึงอาจสูญเสียรหัสช่องเดิมหลัง reload |
| ตัวตน | `StudyPlanManager.tsx:789` | student id ถูกสร้างใหม่ ไม่ใช่ curriculum id |
| จับคู่ | `StudyPlanProgress.tsx:202`–`:289` | รหัสช่องเลือกที่เปลี่ยนแล้วไม่ match; fallback เลือกตัวแรก ไม่ตรวจ unique ตาม comment |
| KPI | `StudyPlanProgress.tsx:458`–`:472`, `:592` | นับ matched curriculum nodes; 62% ในภาพคือ 31/50 วิชา |
| รายงาน | `src/components/study-plan/StudyPlanReport.tsx:104`–`:149` | จัดกลุ่มตาม student year/semester และใช้ custom name/code |
| ลูกศร | `StudyPlanProgress.tsx:333`, `:438` | literal code lookup และวาดเฉพาะ prerequisite ที่อยู่คอลัมน์ก่อนหน้า |
| โหลดข้อมูล | `src/hooks/useFirebaseData.ts` ฟังก์ชัน `useStudyPlan` | fetch เมื่อ mount/studentId เปลี่ยน ไม่ใช่ subscription |
| เป้าหมายหน่วยกิต | `src/services/departmentService.ts:58`–`:63` | INE-62 กำหนด 135 หน่วยกิต |

ตรวจ source และทดลอง matcher ที่สกัดจากโค้ดจริงแล้ว แต่ยังไม่ได้ sign in/replay บัญชีนักศึกษานี้หรืออ่าน production record จึงยืนยันกลไกได้ ไม่อ้างว่าสร้างภาพเดิมครบทั้ง 46 รายการจากฐานข้อมูลจริงแล้ว

### Debug ledger

| การทดลอง | ผล | ตัดสมมติฐานใด |
|---|---|---|
| เรียก matcher จริงด้วย 060233104 ย้ายจาก 1/1 เป็น 2/1 | match 1 รายการ แต่ layout เดิมยัง 1/1 | การย้ายเทอมไม่ได้ทำให้เกรดทุกวิชาหาย; ตำแหน่งเป็นอีกปัญหา |
| แทนช่อง 080103xxx ด้วย 080103001 | match 0 | การตัด prefix อย่างเดียวไม่แก้ renamed elective |
| เปลี่ยน input กลับเป็น 080103xxx โดยคงเกรด/เทอม | match 1 | สาเหตุอยู่ที่ identity lookup ไม่ใช่เกรด B |
| รวมยอดตามข้อความผู้ใช้ | 46 วิชา / 123 หน่วยกิต | ไม่ใช่ยอด 31/80 ของภาพ |

สมมติฐานเรียงตามหลักฐาน: (1) template layout ทำให้เทอมต่าง ยืนยัน, (2) custom code ทำให้ elective หลุด ยืนยันด้วย minimal repro, (3) template-based KPI ทำให้ยอดต่าง ยืนยันจาก source แต่ยังไม่จำลองส่วนต่าง 15 วิชาทีละรายการ, (4) ข้อมูลเก่าค้างจาก independent fetch เป็นความเสี่ยงที่ต้องทดสอบ ไม่ใช่สาเหตุยืนยันของภาพ, (5) เส้น SVG คำนวณผิดอย่างเดียวอธิบายอาการทั้งหมดไม่ได้

## Model และพฤติกรรมที่เสนอ

- `StudyPlanCourse.id`: ตัวตนรายการของนักศึกษา; คงเดิมเมื่อย้ายเทอม/แก้ชื่อ/แก้รหัส
- `code` / `originalName`: ต้นฉบับที่ยังมีอยู่; ห้ามบันทึก override ทับอีก
- `customCode` / `customName`: ข้อความที่ผู้ใช้แก้; ใช้แสดงใน timeline และ report
- `curriculumOrigin` (optional): `{ program, curriculumYear, year, semester, index, code }` เป็นข้อมูลต้นทางเมื่อเพิ่มวิชาจาก catalog ไม่ใช่เวลาปัจจุบันที่ลงเรียน `index` คือ ordinal ใน semester array เพื่อแยกช่อง wildcard ซ้ำ ต้องเก็บก่อน filter/sort และก่อนเปลี่ยนปีเทอม
- Origin ใช้ได้เฉพาะ catalog scope และ original slot ที่ยังตรงกัน หาก catalog ถูก reorder/เปลี่ยน code ต้องถือ unresolved ไม่ใช้ index จับคู่ใหม่โดยลำพัง; การสร้าง ID ถาวรทั่ว catalog เป็นอีกงาน
- Legacy ไม่มี origin: จับคู่ได้เมื่อ normalized concrete code มีผู้สมัครเดียวในหลักสูตรที่เลือกและไม่ใช่ wildcard เท่านั้น ถ้าซ้ำ/ไม่พบ/หลักสูตรเปลี่ยนให้ unresolved ไม่เดาจากชื่อหรือเทอมที่ย้ายแล้ว
- ทุก student row รวม unresolved ยังคงแสดงในแผนส่วนตัว/รายงานและรวมยอดตาม grade; การไม่พบในหลักสูตรไม่ใช่ “ยังไม่ผ่าน”
- ไม่มี automatic migration เขียน origin ให้ข้อมูลเก่าในรอบนี้; รายการ unresolved แสดงข้อความ “ยังเชื่อมโยงกับหลักสูตรไม่ได้” พร้อมจำนวน การเทียบช่องโดยผู้มีสิทธิ์และการตรวจจบเป็นงานแยก
- กฎร่วม: A, B+, B, C+, C, D+, D, S = ผ่าน; F/U = ไม่ผ่าน; I = ผลยังไม่สมบูรณ์; W = ถอน; ไม่มีเกรดใช้ in_progress หรือ planned ตามสถานะ; เกรดอื่น = ไม่ทราบผลและไม่นับหน่วยกิต ต้องไม่ให้ completed ที่ไม่มีเกรดกลายเป็นผ่านเอง
- P/A+ ไม่อยู่ใน dropdown เกรดปัจจุบัน: แสดง unknown และไม่นับ จนมีข้อกำหนดรองรับ ไม่แอบขยาย grade/GPA policy
- KPI ในสองมุมมอง: “ผ่านตามแผนที่บันทึก 46 วิชา / 123 หน่วยกิต”, “เป้าหมายหน่วยกิตหลักสูตร 135”, “สัดส่วนหน่วยกิตที่ผ่าน 91%” (123/135 ปัดเศษ) พร้อมข้อความว่าไม่ใช่ผลตรวจเงื่อนไขสำเร็จการศึกษา
- ห้ามแสดง “เหลือ 19 วิชา” โดยลบ template count กับ matched count; ส่วน curriculum แสดง “จับคู่กับหลักสูตรได้ … / ยังเชื่อมโยงไม่ได้ …” แยกจาก KPI
- ถ้าไม่พบเป้าหมายของ program/year ให้แสดง “ยังไม่มีข้อมูลเป้าหมาย” ไม่ fallback 120/135 เงียบ ๆ; ไม่ใช้ `studyPlan.totalCredits` เป็นเป้าหมายเพราะ writer ปัจจุบันรวม planned credits เข้าไปด้วย
- หลักสูตรส่วนตัวอาจมีมากกว่า 4 ปี/ฤดูร้อน/เทอมยังไม่กำหนด; แสดงตามข้อมูลจริง แยกกลุ่มยังไม่กำหนดท้ายสุด
- เรียนซ้ำต่าง row id ต้องไม่ถูก matcher กลืน; คงยอด “ตามรายการที่บันทึก” แบบ report ปัจจุบันและไม่อ้างเป็นหน่วยกิตสุทธิสำหรับจบ

## File map

| File | Responsibility |
|---|---|
| Modify `src/services/firebaseService.ts` | เพิ่ม optional customCode/curriculumOrigin ใน StudyPlanCourse โดยไม่เปลี่ยน persistence API |
| Modify `src/components/study-plan/StudyPlanManager.tsx` | รักษา origin/id/code ใน load/create/add/save รวมเส้นทาง delete ที่มี writer แยก |
| Create `src/components/study-plan/studyPlanViewModel.ts` | pure projection: display fields, status, groups, totals |
| Create `src/components/study-plan/studyPlanIdentity.ts` | origin validation, conservative catalog mapping; serializer รักษา identity |
| Create `src/components/study-plan/StudentPlanTimeline.tsx` | personal semester columns และ prerequisite detail |
| Modify `src/components/study-plan/StudyPlanProgress.tsx` | สวิตช์สองมุมมอง, shared KPI, คง reference SVG; เลิกอ่าน student plan ซ้ำเอง |
| Modify `src/components/study-plan/StudyPlanReport.tsx` | ใช้ projection/gates เดียวกันสำหรับหน้าจอและ PDF |
| Modify `src/hooks/useFirebaseData.ts` | reset stale user state/cancel obsolete request; รักษา useStudyPlan API |
| Create `tests/study-plan/progress.test.ts` | node:test pure data regressions |
| Create `tests/study-plan/fixtures.ts` | anonymized 46-course fixture ไม่ใส่ชื่อ/อีเมลนักศึกษา |
| Create `docs/audits/student-progress-consistency.md` | emulator/UI/PDF verification ledger |

## Task 1: Lock down the failing data contract

**Files:** Create `tests/study-plan/fixtures.ts`, `tests/study-plan/progress.test.ts`; create `src/components/study-plan/studyPlanViewModel.ts`.

**Interfaces:** `buildStudyPlanView(courses: readonly StudyPlanCourse[], requiredCredits: number | null): StudyPlanView`; groups contain original stable row IDs and display fields; summary is independent of catalog matching.

- [ ] Create a fixture builder using these anonymized inputs (tuple = code, credits, grade); use the full names from the user's report for screenshot/PDF verification, and code as `originalName` in pure tests:

```ts
export const terms = [
  [1, 1, [['060233101',3,'B'],['060233105',1,'D'],['080103001',3,'B'],['080303504',1,'A'],['080303601',3,'B']]],
  [1, 2, [['040503001',3,'C'],['060233102',3,'B+'],['060233103',1,'B'],['060233108',3,'D+'],['060233110',3,'C'],['080103002',3,'C+']]],
  [2, 1, [['060233104',3,'D'],['040203123',3,'D'],['060233112',3,'B+'],['080103034',3,'B+'],['060243112',3,'C'],['060233201*',1,'D'],['060233205*',3,'C+']]],
  [2, 2, [['060233106',3,'A'],['060233107',3,'C+'],['060233111*',3,'C+'],['061100001',3,'A'],['080103035',3,'B'],['080203905',3,'B'],['060233202*',1,'A']]],
  [3, 1, [['060233213*',3,'B'],['060233109',3,'B'],['060233114',3,'D'],['060233308',3,'C'],['080303606',3,'B+'],['060233203*',1,'A'],['060233204',3,'D']]],
  [3, 2, [['060233210',3,'C'],['060233207',3,'B'],['060233309',3,'A'],['060233209',3,'B'],['060233208*',3,'A'],['060233206*',3,'A']]],
  [4, 1, [['060233401',3,'B+'],['060233211*',3,'B'],['060233212',3,'D+'],['060233214',1,'A'],['060233306',3,'A'],['080203906',3,'B'],['080303103',3,'B+']]],
  [4, 3, [['060233403',2,'S']]],
] as const;
export const studentCourses = terms.flatMap(([year, semester, rows]) =>
  rows.map(([code, credits, grade], index) => ({
    id: `row-${year}-${semester}-${index}`, code: `INE-${code}`,
    originalName: code, credits, grade, year, semester,
    category: 'core' as const, status: 'completed' as const,
  })));
```

- [ ] Write the failing regression before implementing projection:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { studentCourses } from './fixtures';
import { buildStudyPlanView } from '../../src/components/study-plan/studyPlanViewModel';
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
  const row = {...studentCourses[0],year:5,semester:3,customCode:'CUSTOM-1',customName:'ชื่อใหม่'};
  const view = buildStudyPlanView([row], null);
  assert.equal(view.groups[0].year, 5);
  assert.equal(view.groups[0].courses[0].id, row.id);
  assert.equal(view.groups[0].courses[0].code, 'CUSTOM-1');
  assert.equal(view.groups[0].courses[0].name, 'ชื่อใหม่');
  assert.equal(view.progressPercent, null);
});
```

- [ ] Run `npx tsx --test tests/study-plan/progress.test.ts`; expect module-not-found before implementation, then implement this pure projection:

```ts
import type { StudyPlanCourse } from '../../services/firebaseService';
export type ResultStatus = 'completed'|'failed'|'incomplete'|'withdrawn'|'in_progress'|'planned'|'unknown';
export function resolveResult(status: string, grade?: string): ResultStatus {
  const g = (grade ?? '').trim().toUpperCase();
  if (['A','B+','B','C+','C','D+','D','S'].includes(g)) return 'completed';
  if (g === 'F' || g === 'U') return 'failed';
  if (g === 'I') return 'incomplete';
  if (g === 'W') return 'withdrawn';
  if (g) return 'unknown';
  return status === 'in_progress' ? 'in_progress' : 'planned';
}
export type DisplayCourse = {
  id: string; code: string; name: string; credits: number; grade?: string;
  category: string; result: ResultStatus; source: StudyPlanCourse;
};
export type SemesterGroup = {year:number;semester:number;courses:DisplayCourse[];totalCredits:number};
export type StudyPlanView = {groups:SemesterGroup[];passedCount:number;passedCredits:number;progressPercent:number|null};
export function buildStudyPlanView(courses: readonly StudyPlanCourse[], requiredCredits: number|null): StudyPlanView {
  const groups = new Map<string, SemesterGroup>();
  let passedCount = 0, passedCredits = 0;
  for (const source of courses) {
    const scheduled = Number.isInteger(source.year) && source.year > 0 && [1,2,3].includes(source.semester);
    const year = scheduled ? source.year : 0, semester = scheduled ? source.semester : 0;
    const key = `${year}-${semester}`;
    const group = groups.get(key) ?? {year,semester,courses:[],totalCredits:0};
    const credits = Number.isFinite(source.credits) && source.credits >= 0 ? source.credits : 0;
    const result = resolveResult(source.status, source.grade);
    group.courses.push({id:source.id,code:source.customCode?.trim() || source.code,
      name:source.customName?.trim() || source.originalName || source.name || '',
      credits,grade:source.grade,category:source.category,result,source});
    group.totalCredits += credits;
    groups.set(key,group);
    if (result === 'completed') { passedCount++; passedCredits += credits; }
  }
  return {groups:[...groups.values()].sort((a,b)=>(a.year || Infinity)-(b.year || Infinity) || a.semester-b.semester),
    passedCount,passedCredits,
    progressPercent:requiredCredits !== null && requiredCredits > 0 ? Math.min(100,Math.round(passedCredits/requiredCredits*100)) : null};
}
```

- [ ] Add `customCode?: string` to service type before running TS checks. Run regression again; expect two passing tests. Keep missing/invalid credits visible as a validation message in the UI; zero above is calculation protection, not permission to silently repair persisted data.
- [ ] Add table-driven tests for every `resolveResult` branch, empty array, unknown target, duplicate code with distinct row ids, and unassigned semester. Commands remain the same. Commit only the test/projection/type files: `git commit -m "fix: derive student progress from recorded courses"`.

## Task 2: Preserve identity through edits and reload

**Files:** `firebaseService.ts`, `StudyPlanManager.tsx`, new `studyPlanIdentity.ts`, `progress.test.ts`.

**Interfaces:** optional `curriculumOrigin` as defined above; `serializeStudentCourse(course: StudyPlanCourse): StudyPlanCourse`; manager local type extends the shared type instead of redefining fields.

- [ ] Add a round-trip regression: create wildcard row, set customCode/name, serialize, reload and move term; assert original code/id/origin remain equal and display code/name changed. Also round-trip an existing legacy row with no origin without inventing one.
- [ ] Run targeted regression and observe failure. Implement the serializer and use it in `saveToFirebase` and the delete writer:

```ts
import type { StudyPlanCourse } from '../../services/firebaseService';
export function serializeStudentCourse(course: StudyPlanCourse): StudyPlanCourse {
  return {...course, code:course.code, originalName:course.originalName,
    customCode:course.customCode ?? '', customName:course.customName ?? '',
    name:course.customName?.trim() || course.originalName,
    prerequisites:course.prerequisites ?? []};
}
```

- [ ] Preserve `courseId` and optional origin in the load conversion (do not assume either matches hybrid IDs). In curriculum flattening, retain the original semester-array index before any filters. At initial creation and every add-course path copy `{program, curriculumYear, year: catalogYear, semester: catalogSemester, index: catalogIndex, code: catalogCode}`; never use the student's chosen destination term in origin.
- [ ] Retain the current internship grade/GPA behavior in this task; serializer consumes the course after that existing transformation. Check that every writer uses the same identity-preserving serialization. Do not overwrite legacy `code` with a guessed placeholder.
- [ ] Verify exact-case/prefix/star formatting does not affect persisted display text. Matching normalization may trim/remove a recognized program prefix and a terminal `*` marker, but must preserve wildcard digits and never match across program/year scopes.
- [ ] Run regression and `npx tsc --noEmit -p tsconfig.app.json`; inspect existing diagnostics separately. Commit `fix: preserve study plan course origin on edits`.

## Task 3: Render the personal timeline and shared report

**Files:** new `StudentPlanTimeline.tsx`; modify `StudyPlanProgress.tsx`, `StudyPlanReport.tsx`.

**Interfaces:** `StudentPlanTimeline({view}:{view:StudyPlanView})`; both screens consume the same projection. Keep `StudyPlanReport({studentId,studentUser})` for admin reuse.

- [ ] Before implementation, add a test using the same fixture through the report adapter and timeline adapter; assert identical arrays of `(id,code,name,year,semester,credits,grade,result)` and identical totals. No Firebase mocks that replace the projection.
- [ ] Replace report's independent `resolveCourseStatus` and grouping with projection. Map `incomplete`, `withdrawn`, `unknown` to explicit Thai labels in `STATUS_CONFIG`; preserve original grade text. GPA continues to use `calculateGPA`; completed-credit/count KPIs use projection, not a second grade rule. Resolve target from the exact program/year catalog entry; check existence before calling helpers with fallback behavior.
- [ ] Render one column per `view.groups` entry, scrollable horizontally, using student row id as React key and data attribute. Use this minimal body as the initial render contract, then apply existing Card/status styles:

```tsx
export function StudentPlanTimeline({view}:{view:StudyPlanView}) {
  return <div className="flex gap-4 overflow-x-auto pb-4" aria-label="แผนการเรียนของฉัน">
    {view.groups.map(group => <section key={`${group.year}-${group.semester}`} className="w-64 shrink-0">
      <h3>{group.year === 0 ? 'ยังไม่ได้จัดตาราง' : `ปีที่ ${group.year} — ${group.semester === 3 ? 'ภาคฤดูร้อน' : `ภาคเรียนที่ ${group.semester}`}`}</h3>
      <p>{group.courses.length} วิชา · {group.totalCredits} หน่วยกิต</p>
      {group.courses.map(course => <article key={course.id} data-course-id={course.id} className="my-3 rounded-lg border p-3">
        <p>{course.code}</p><p>{course.name}</p><p>{course.credits} หน่วยกิต · {course.grade || 'ยังไม่มีเกรด'}</p>
      </article>)}
    </section>)}
  </div>;
```

- [ ] Add status text in every card (color alone is insufficient), keyboard-focusable prerequisite detail, and validation note for invalid credits. Do not fabricate lecture/lab hours from total credits as old SVG does.
- [ ] Add controlled shadcn Tabs in progress: values `personal` (default) and `curriculum`; header/KPI stays outside TabsContent. Personal content receives projection, curriculum content wraps existing SVG. Use `useStudyPlan(user?.id)` instead of progress's own mapping that drops fields. Personal view must work while catalog loading fails; reference view can show retry/error independently.
- [ ] Remove template-based “ผ่าน/เหลือ” headline counts, retain explicitly labeled reference matching metrics only. Rename the dashboard label “การวางแผนการเรียน” to “ความคืบหน้าการเรียน” only if needed for the existing page title; no new top-level item.
- [ ] Run regression, build, and emulator manual check: initial personal tab, switch reference/back, move programming to 2/1, internship to 4/3, rename an elective, reload, open report, export PDF. All displayed student rows and semester sums must match. Commit `feat: add personal and curriculum progress views`.

## Task 4: Conservative reference matching and prerequisite presentation

**Files:** `studyPlanIdentity.ts`, `StudyPlanProgress.tsx`, `StudentPlanTimeline.tsx`, regression tests.

**Interfaces:** `matchCurriculumRows(rows, slots)` returns `{matches: Map<string,string>, unresolved: string[]}` keyed by student row id to catalog slot key. Slot key is scoped origin tuple; a slot contains at most one row unless a separately implemented repeat policy exists. `resolvePrerequisites(row, rows)` returns resolved row IDs plus unresolved prerequisite strings.

- [ ] Test origin match after a move/rename, two identical wildcard slots, same code in different curricula, duplicate concrete candidates, catalog reordered, missing origin, and a deleted catalog slot. Assert ambiguous matches remain unresolved and never consume the first candidate silently.
- [ ] Implement order: validate exact stored origin against scoped slot + original code; if origin exists but fails validation, mark unresolved without fallback. With no origin, accept only a unique concrete normalized code candidate that is not already consumed; all other rows unresolved. Origin-bearing rows are processed first. Keep complete student data independent of this mapping.
- [ ] Reference SVG keeps catalog code/name/position, with matched actual code/name/semester in detail. Use the new matches for grade lookup; show unknown mapping distinctly from a known ungraded course. Do not replace catalog node identity with display code.
- [ ] Personal timeline shows prerequisite relationships on selecting a course as a textual linked list (source row → selected row); defer a second SVG routing engine. This keeps same-semester/backward dependencies visible without pretending the curriculum arrows follow the student's actual schedule. Header explicitly says “ดูวิชาที่ต้องเรียนก่อนโดยเลือกวิชา”. Reference view retains prerequisite arrows.
- [ ] Resolve personal prerequisite references using recorded prerequisites and unambiguous original concrete codes/validated origin, not just custom display code. An unresolved token appears as “ตรวจสอบวิชาที่ต้องเรียนก่อน: <token>”; non-code approval text stays readable as a requirement, never becomes a fake node. Same/later-term matches show “ลำดับภาคเรียนควรตรวจสอบ” but do not delete recorded grades or block historical records. Do not infer prerequisites for newly named elective substitutions.
- [ ] Run regression and UI checks for same-term/backward/missing dependency, long Thai names, keyboard selection. Confirm moving a course changes only personal location and preserves reference location. Commit `fix: match curriculum references without guessing elective slots`.

## Task 5: Refresh lifecycle and end-to-end acceptance

**Files:** `useFirebaseData.ts`, `StudyPlanProgress.tsx`, `StudyPlanReport.tsx`, `docs/audits/student-progress-consistency.md`.

**Interfaces:** keep `useStudyPlan(studentId)` return contract `{studyPlan,loading,error,refreshStudyPlan}`. Current Radix dashboard panels unmount by default, so switching to progress/report fetches again; do not add a global event bus/cache or realtime listener for this scope.

- [ ] In the existing effect reset studyPlan/error when studentId changes or disappears; use a cancellation flag so an obsolete student's response cannot set new state. Apply the same active-student check in refresh. Ensure progress's catalog effect ignores obsolete responses when program/year changes.
- [ ] Check failed fetch shows error/retry rather than old student's data or a false empty-success state. Reuse `refreshStudyPlan` for retry. Confirm initial empty plan displays a link/instruction to the manager.
- [ ] Run `npx tsx --test tests/study-plan/progress.test.ts`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, `npm run lint`; record existing unrelated failures rather than fixing unrelated code. Do not run root `test-course-edit.js` / `test-all-fixes.js` as generic regression commands: inspect their database targets first (some scripts initialize real Firebase and mutate data).
- [ ] Start `npm run firebase:emulators` and `npm run dev:emulator` in separate terminals. Use a synthetic student, never copy personal identity from screenshot. Verify emulator configuration before seeding the 46-row fixture.
- [ ] Record pass/fail with screenshots for: desktop and narrow screen, long Thai labels, all 8 groups, 46/123 and 91%, custom fields after save/reload, unresolved electives still counted, unknown target, S/F/U/I/W/blank, catalog offline but personal data loaded, rapid tab changes, logout/login as different student, admin report target, PDF page boundaries.
- [ ] Verify no editing action writes to `curriculum/` or `courses/`; no automatic legacy origin migration occurred. Check `git diff --check`. Commit `test: verify student progress and report consistency` with the audit record.

## Acceptance matrix

| Scenario | Expected |
|---|---|
| เปิดภาพรวม | default “แผนของฉัน”; มีสวิตช์ “โครงสร้างหลักสูตร” |
| ตัวอย่างผู้ใช้ | 46 rows, 123 passed credits; groups 11/16/19/19/19/18/19/2 |
| Programming 060233104 | แผนของฉัน 2/1; reference ยังคงตามหลักสูตร |
| Internship 060233403 | แผนของฉัน 4/ฤดูร้อน; S ผ่านและนับ 2 หน่วยกิต |
| เปลี่ยนชื่อ/รหัส | timeline และ report ใช้ override เดียวกัน; id/origin คงเดิมหลัง reload |
| เปลี่ยน elective เก่าจนไม่มีต้นทาง | personal แสดงครบ; reference ระบุ unresolved; ไม่เดาช่อง |
| Prerequisite เทอมเดียวกัน/ย้อนกลับ | personal detail ยังแสดงความสัมพันธ์และข้อความตรวจสอบ |
| เกรด/ไม่มีเกรด | สี ข้อความ และยอดใช้ resolver เดียวกัน |
| 123/135 | แสดง 91% ของเป้าหน่วยกิต; ไม่สรุปว่าเหลือ 12 หน่วยกิตแล้วจบแน่นอน |
| Empty/offline/user switch | ไม่แสดงข้อมูลผู้ใช้ก่อนหน้าหรือยอดเก่าปะปน |

## Scrutinize / self-review

- ทางเลือกเล็กที่สุดที่ยังครบ intent คือสองมุมมองบนหน้าเดิมและ shared projection; เพิ่มหน้าใหม่ไม่แก้ต้นเหตุ
- **Major:** เปลี่ยนตำแหน่ง SVG อย่างเดียวทำให้เส้นย้อนกลับถูกตัดที่ `prevSemIndex < semIndex`; ใช้ personal timeline พร้อม prerequisite detail เพื่อไม่ซ่อนความสัมพันธ์
- **Major:** เก็บ origin ใหม่ไม่สามารถกู้ข้อมูลเก่าที่โดนทับได้; legacy unresolved เป็นส่วนหนึ่งของผลลัพธ์ ไม่ถือว่า migration สำเร็จ
- **Major:** course count progress กับ credit progress คนละนิยาม; ใช้ชื่อและสูตรที่แน่นอนและแบ่ง reference matching ออกจากยอดผ่าน
- **Scope:** ไม่เปลี่ยน catalog merge service/grade cascade/adviser/global GPA policies; regression พบข้อบกพร่องในส่วนเหล่านั้นให้บันทึกแยก
- แบบข้อมูล API และ task dependencies: Task 1 → 2 → 3 → 4 → 5. ทุก task มี regression/verification และ commit boundary
- Verdict: **พร้อมใช้เป็นแผนดำเนินงาน** ภายใต้ขอบเขตที่ยืนยันสองมุมมอง; ผลตรวจจบและการกู้ elective mapping แบบกำหนดเองอยู่นอกงานนี้

## Handoff

แผนนี้บันทึกเพื่อ review ยังไม่ได้แก้ application code หรือฐานข้อมูล เลือกดำเนินงานทีละ task ใน session เดิมด้วย executing-plans หรือแยก subagent ต่อ task เมื่อผู้ใช้สั่งให้เริ่ม
