# Category-Quota Bucket Deduplication for Uncompleted Curriculum Courses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the chatbot advising engine so that placeholder/wildcard curriculum courses (such as `080xxxxxx`, `0602333xx`, `xxxxxxxxx`) are deduplicated against the student's passed electives by category quota, ensuring the chatbot only reports truly uncompleted courses instead of phantom wildcards.

**Architecture:** 
1. Build a pure utility function `computeUncompletedCurriculumCourses` in `src/utils/curriculumDeduplicationUtils.ts` that separates exact-code courses from wildcard courses, classifies passed courses into category buckets (GenEd, Major Electives, Free Electives), and deducts passed electives from curriculum wildcard slots.
2. Integrate this function into `src/components/chat/ChatBot.tsx` for generating `uncompletedCurriculumCourses` metadata.
3. Update advising directives in `ChatBot.tsx` to instruct the n8n / LLM model to report uncompleted courses with exact codes and state whether elective quotas are fulfilled.
4. Comprehensive unit test suite in `tests/study-plan/curriculumDeduplication.test.ts` verifying Kainapat's INE-62 study plan (46 passed courses, only 3-4 remaining instead of 11).

**Tech Stack:** TypeScript, React, Node test runner (`node:test`, `node:assert/strict`), Vite.

## Global Constraints

- Must not break existing 26 unit tests in `tests/study-plan/academicStanding.test.ts` and `tests/study-plan/progress.test.ts`.
- Must work across all 13 supported departmental curricula (IT, INE, INET, ITI, ITT).
- Preserve exact course codes and original course attributes.

---

### Task 1: Create Category-Quota Bucket Deduplication Utility

**Files:**
- Create: `src/utils/curriculumDeduplicationUtils.ts`
- Test: `tests/study-plan/curriculumDeduplication.test.ts`

**Interfaces:**
- Consumes: `Course` from `@/types/course`, `StudyPlanCourse` from `@/services/firebaseService`
- Produces: `computeUncompletedCurriculumCourses(curriculumCourses, studentCourses, failedCourseCodes)`

- [ ] **Step 1: Write the failing unit tests covering wildcard and elective bucket deduction**

Create `tests/study-plan/curriculumDeduplication.test.ts`:
```typescript
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

test('computeUncompletedCurriculumCourses on student Kainapat (INE-62)', () => {
  const curriculumCourses = getCoursesByProgramSync('INE', '62');
  const failedCodes: string[] = [];

  const uncompleted = computeUncompletedCurriculumCourses(
    curriculumCourses,
    studentCourses,
    failedCodes
  );

  // Kainapat has 46 passed courses in fixtures.
  // Wildcards for GenEd (080xxxxxx), PE (080303xxx), Major Electives (0602333xx * 3), and Free Electives (xxxxxxxxx * 2)
  // should be fully satisfied and NOT appear in uncompleted.
  const uncompletedCodes = uncompleted.map(c => c.code.replace(/^INE-/, '').replace(/[\*\s]+$/g, ''));

  assert.equal(uncompletedCodes.includes('040203111'), true, 'Should include Math 1');
  assert.equal(uncompletedCodes.includes('040203112'), true, 'Should include Math 2');
  assert.equal(uncompletedCodes.includes('060233402'), true, 'Should include Project 2');

  // Must NOT include wildcard placeholders because student already passed them
  assert.equal(uncompletedCodes.some(c => /x{2,}/i.test(c)), false, 'Must not include wildcards');
  assert.equal(uncompleted.length <= 4, true, `Expected <= 4 uncompleted courses, got ${uncompleted.length}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/study-plan/curriculumDeduplication.test.ts`
Expected: FAIL with "Cannot find module '../../src/utils/curriculumDeduplicationUtils.js'"

- [ ] **Step 3: Implement `src/utils/curriculumDeduplicationUtils.ts`**

Create `src/utils/curriculumDeduplicationUtils.ts`:
```typescript
import { Course } from '@/types/course';
import { StudyPlanCourse } from '@/services/firebaseService';

export interface UncompletedCourseResult {
  code: string;
  name: string;
  credits: number;
  category: string;
  year?: number;
  semester?: number;
  prerequisites: string[];
  isFailed: boolean;
}

/**
 * Checks if a course code is a curriculum wildcard or placeholder (e.g., 080xxxxxx, 0602333xx, xxxxxxxxx)
 */
export function isWildcardCourseCode(code: string): boolean {
  if (!code) return false;
  const clean = code.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '');
  return /x{2,}/i.test(clean) || clean.toLowerCase().includes('xxx');
}

/**
 * Categorize elective courses into matching buckets
 */
export function categorizeElectiveCourse(category?: string, mainCategory?: string, subCategory?: string, name?: string): 'gened' | 'major_elective' | 'free_elective' | 'pe' {
  const cat = (category || '').toLowerCase();
  const main = (mainCategory || '').toLowerCase();
  const sub = (subCategory || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (sub.includes('กีฬา') || n.includes('กีฬา') || n.includes('นันทนาการ')) {
    return 'pe';
  }
  if (main.includes('ศึกษาทั่วไป') || sub.includes('ศึกษาทั่วไป') || cat === 'general') {
    return 'gened';
  }
  if (sub.includes('วิชาชีพ') || n.includes('วิชาเลือกกลุ่มวิชาชีพ') || n.includes('วิชาเลือก 1') || n.includes('วิชาเลือก 2')) {
    return 'major_elective';
  }
  if (main.includes('เลือกเสรี') || cat === 'free' || n.includes('เลือกเสรี')) {
    return 'free_elective';
  }
  return 'free_elective';
}

/**
 * Computes list of uncompleted curriculum courses by deducting passed courses from curriculum requirements
 * including category-quota deduplication for wildcards.
 */
export function computeUncompletedCurriculumCourses(
  curriculumCourses: Course[],
  studentCourses: readonly (StudyPlanCourse | any)[],
  failedCourseCodes: string[] = []
): UncompletedCourseResult[] {
  // Normalize helper
  const cleanCode = (c: string) => (c || '').replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/[\*\s]+$/g, '').trim();

  // 1. Extract passed courses
  const passedCourses = studentCourses.filter(c => {
    const g = (c.grade || '').trim().toUpperCase();
    return c.status === 'completed' && ['A', 'A-', 'A+', 'B', 'B+', 'B-', 'C', 'C+', 'C-', 'D', 'D+', 'D-', 'S'].includes(g);
  });

  const passedCodesSet = new Set(passedCourses.map(c => cleanCode(c.code)));

  // 2. Separate curriculum courses into exact and wildcard slots
  const exactCourses: Course[] = [];
  const wildcardCourses: Course[] = [];

  for (const course of curriculumCourses) {
    if (isWildcardCourseCode(course.code)) {
      wildcardCourses.push(course);
    } else {
      exactCourses.push(course);
    }
  }

  // 3. Process exact courses
  const uncompleted: UncompletedCourseResult[] = [];
  const matchedPassedCodes = new Set<string>();

  for (const course of exactCourses) {
    const code = cleanCode(course.code);
    if (passedCodesSet.has(code)) {
      matchedPassedCodes.add(code);
    } else {
      uncompleted.push({
        code: course.code,
        name: course.name,
        credits: course.credits,
        category: course.category,
        year: course.year ? Number(course.year) : undefined,
        semester: course.semester ? Number(course.semester) : undefined,
        prerequisites: course.prerequisites || [],
        isFailed: failedCourseCodes.includes(course.code) || failedCourseCodes.includes(code)
      });
    }
  }

  // 4. Remaining passed courses that were not matched to exact curriculum courses
  // These represent electives taken by the student (GenEd electives, Major electives, Free electives)
  const remainingPassedElectives = passedCourses.filter(c => !matchedPassedCodes.has(cleanCode(c.code)));

  // Create mutable pool of passed electives
  const electivePool = [...remainingPassedElectives];

  // 5. Match wildcard slots against available elective pool
  for (const wildcard of wildcardCourses) {
    const targetType = categorizeElectiveCourse(wildcard.category, wildcard.mainCategory, wildcard.subCategory, wildcard.name);
    
    // Find matching candidate in electivePool
    const candidateIndex = electivePool.findIndex(p => {
      const pType = categorizeElectiveCourse(p.category, p.mainCategory, p.subCategory, p.name || p.originalName);
      if (targetType === 'pe') return pType === 'pe';
      if (targetType === 'major_elective') return pType === 'major_elective';
      if (targetType === 'gened') return pType === 'gened' || pType === 'pe';
      if (targetType === 'free_elective') return true; // Any course can count as free elective
      return false;
    });

    if (candidateIndex !== -1) {
      // Satisfied by student's elective
      electivePool.splice(candidateIndex, 1);
    } else {
      // Still uncompleted wildcard slot
      uncompleted.push({
        code: wildcard.code,
        name: wildcard.name,
        credits: wildcard.credits,
        category: wildcard.category,
        year: wildcard.year ? Number(wildcard.year) : undefined,
        semester: wildcard.semester ? Number(wildcard.semester) : undefined,
        prerequisites: wildcard.prerequisites || [],
        isFailed: false
      });
    }
  }

  return uncompleted;
}
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `npx tsx --test tests/study-plan/curriculumDeduplication.test.ts`
Expected: PASS (all tests pass)

- [ ] **Step 5: Commit Task 1**

```bash
git add src/utils/curriculumDeduplicationUtils.ts tests/study-plan/curriculumDeduplication.test.ts
git commit -m "feat(study-plan): add category-quota bucket deduplication for curriculum wildcards"
```

---

### Task 2: Integrate Deduplication into ChatBot Component & Update Advising Directives

**Files:**
- Modify: `src/components/chat/ChatBot.tsx:216-235`, `src/components/chat/ChatBot.tsx:290-305`

**Interfaces:**
- Consumes: `computeUncompletedCurriculumCourses` from `@/utils/curriculumDeduplicationUtils`
- Produces: Clean `uncompletedCurriculumCourses` metadata and `uncompletedCoursesAnsweringRule` directive for n8n AI

- [ ] **Step 1: Import utility in `ChatBot.tsx`**

```typescript
import { computeUncompletedCurriculumCourses } from '@/utils/curriculumDeduplicationUtils';
```

- [ ] **Step 2: Replace uncompletedCurriculumCourses computation in `ChatBot.tsx`**

Replace:
```typescript
        const uncompletedCurriculumCourses = isStudent
          ? curriculumCourses
              .filter(c => !completedCourseCodes.includes(c.code))
              .map(c => ({
                code: c.code,
                name: c.name,
                credits: c.credits,
                category: c.category,
                year: c.year,
                semester: c.semester,
                prerequisites: c.prerequisites || [],
                isFailed: failedCourseCodes.includes(c.code)
              }))
          : [];
```
With:
```typescript
        const uncompletedCurriculumCourses = isStudent
          ? computeUncompletedCurriculumCourses(
              curriculumCourses,
              studyPlan?.courses || [],
              failedCourseCodes
            )
          : [];
```

- [ ] **Step 3: Update `advisingDirectives` in `ChatBot.tsx`**

Add strict directive `uncompletedCoursesAnsweringRule`:
```typescript
          uncompletedCoursesAnsweringRule: 'STRICT: เมื่อผู้ใช้ถามว่า "เหลือวิชาที่ยังไม่ได้เรียนคือวิชาอะไร" หรือ "ขาดวิชาอะไรบ้าง" ให้ตอบเฉพาะรายวิชาที่อยู่ใน uncompletedCurriculumCourses เท่านั้น โดยระบุรหัสวิชา ชื่อวิชา จำนวนหน่วยกิต และชั้นปี/ภาคการศึกษาตามแผน ห้ามนำวิชาเลือก placeholder ที่นักศึกษาเก็บหน่วยกิตครบแล้วมาตอบเด็ดขาด หากเหลือน้อยกว่า 5 วิชา ให้แจกแจงทีละวิชาอย่างชัดเจนพร้อมแจ้งยอดรวมหน่วยกิตที่ยังขาด',
```

- [ ] **Step 4: Run all tests and build verification**

Run: `npx tsx --test tests/study-plan/curriculumDeduplication.test.ts tests/study-plan/academicStanding.test.ts tests/study-plan/progress.test.ts`
Expected: 28 tests passing.
Run: `npm run build`
Expected: Exit code 0.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/chat/ChatBot.tsx
git commit -m "fix(chatbot): integrate curriculum deduplication to prevent wildcard phantom uncompleted courses"
```

---

### Task 3: Documentation and Git Push

**Files:**
- Modify: `README.md`
- Create: `docs/adr/ADR-012-curriculum-wildcard-category-quota-deduplication.md`

- [ ] **Step 1: Create ADR-012 documenting the deduplication algorithm**
- [ ] **Step 2: Update README.md Section 2**
- [ ] **Step 3: Commit and Push to GitHub (`origin Kainapat-manage-course`)**
