# Production Readiness Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Authorization overrides execution defaults:** เอกสารนี้ยังไม่อนุมัติให้แก้ application code, เปลี่ยนบริการภายนอก, deploy, commit หรือ push ผู้ใช้อนุมัติเฉพาะการจัดทำเอกสาร ต้องได้รับอนุมัติขอบเขต implementation ก่อนเริ่มแต่ละชุดงาน

**Goal:** ปิดช่องสิทธิ์และความเสี่ยงต่อข้อมูล ทำ release ที่ตรวจสอบซ้ำได้ และเตรียมระบบให้เปิดใช้นักศึกษาภาควิชาเทคโนโลยีสารสนเทศ มจพ. วิทยาเขตปราจีนบุรีอย่างควบคุมความเสี่ยงได้

**Architecture:** คง React SPA และ Firebase ในกรณีมหาวิทยาลัยอนุมัติ Cloud เพิ่ม API gateway สำหรับ identity, privileged operations และ chat ที่ต้องเชื่อถือได้ วางเว็บบน infrastructure ของมหาวิทยาลัยตามสิทธิ์ที่ได้รับจริง หากนโยบายห้าม Firebase/LLM/Vector Cloud ให้หยุดสาขา deployment นี้และจัดทำแผนเปลี่ยนระบบแยกก่อน

**Tech Stack:** ปัจจุบัน React 18, TypeScript, Vite, Firebase Authentication/Realtime Database, `@n8n/chat`; ข้อเสนอเพิ่มเติม Node.js/TypeScript API, Firebase Admin SDK, Zod, Nginx, n8n และ PostgreSQL การเลือกเวอร์ชัน server/runtime เป็น release decision หลังทราบข้อจำกัดเครื่อง

## Global Constraints

- วันที่ 2026-10-09, timezone Asia/Bangkok; baseline commit `24651cb` เลขบรรทัดในเอกสารอ้างอิง baseline นี้
- ผู้ใช้รวมประมาณหลักร้อยขึ้นไป ไม่ได้ยืนยัน concurrent users หรือ concurrent chat requests
- n8n และ Firebase ที่ใช้อยู่เป็น Dev; ยังไม่ทราบ OS, SSH/sudo, Docker, domain, network และ quota ของ server มหาวิทยาลัย
- การอนุญาตให้ใช้ Firebase/LLM/Vector Cloud ยังต้องยืนยันกับอาจารย์/ผู้ดูแล
- แก้ความปลอดภัยและ correctness ก่อน refactor รูปแบบโค้ด ไม่ย้ายฐานข้อมูลหรือเพิ่ม queue โดยไม่มีเหตุผลจากข้อกำหนด/ผลวัด
- ทุก repro ที่เขียนข้อมูลใช้ Emulator หรือ isolated staging ที่อนุมัติเท่านั้น ห้ามทดลอง exploit กับข้อมูลนักศึกษาจริง
- Code/config/test paths ที่ระบุว่า **Create** เป็นผลลัพธ์ในอนาคต ยังไม่มีอยู่จากการเขียนแผนนี้
- ห้ามตีความ build ผ่านหรือ unit tests ผ่านว่า workflow, Rules ที่ deploy, recovery และ load test ผ่าน
- รายงาน test run ต้องบันทึก runtime, commit, command, fixture, ผลจริง และสิ่งที่ยังไม่ได้ตรวจ
- ไม่มีขั้นตอน commit/push อัตโนมัติในแผน; ส่ง diff และผลทดสอบให้ทบทวนก่อนตามสิทธิ์ที่ผู้ใช้อนุมัติ

## 1. ข้อเท็จจริงและการตัดสินใจที่ยังเปิดอยู่

| เรื่อง | สถานะ | การตัดสินใจ / ผู้รับผิดชอบ |
|---|---|---|
| ผู้ใช้เป้าหมาย | ยืนยันแล้ว | นักศึกษาภาควิชาไอที วิทยาเขตปราจีนบุรี และบุคลากรตามบทบาท |
| Hosting มหาวิทยาลัย | เป็นแนวทางที่คุยกับอาจารย์ ยังไม่ใช่ข้อกำหนดเครื่อง | ผู้ดูแลยืนยัน VM/SSH หรือ static hosting; ใช้แบบฟอร์มในคู่มือ deployment |
| Cloud และข้อมูลส่วนบุคคล | รอข้อกำหนด | อาจารย์/ผู้รับผิดชอบข้อมูลอนุมัติบริการและชนิดข้อมูลที่ส่งออก |
| แผนการเรียน | ในระบบมีข้อมูลที่ผู้ใช้กรอกและคำนวณ | ให้เจ้าของระบบยืนยันว่าเป็นข้อมูลเพื่อแนะนำ ไม่ใช่ทะเบียนผลการเรียนทางการ; หากเป็นทางการต้องเปลี่ยนสิทธิ์การแก้เกรด |
| สมาชิกภาควิชา | อีเมลมหาวิทยาลัยอย่างเดียวไม่พอ | เสนอใช้ verified email + approved membership record; รอแหล่งทะเบียน/ผู้อนุมัติ |
| Backup/SLO | ยังไม่ได้ตกลง | เสนอค่าเริ่มต้นในคู่มือ; ผู้ดูแลรับรองก่อน go-live |

ข้อเสนอที่ง่ายที่สุดคือรักษา SPA และ RTDB แต่ปิด trust boundary ให้ถูกต้อง การ rewrite ทั้งระบบไม่ใช่ prerequisite ที่พิสูจน์แล้ว ไม่มี ADR ที่ประกาศ Accepted เพราะ infrastructure/data policy ยังไม่ตกลง

## 2. Baseline ledger และวิธี debug

ผลด้านล่างมาจาก assessment ก่อนหน้า ไม่ใช่ผลหลังแก้ และไม่รัน live tests ซ้ำเพื่อสร้างเอกสาร

| ID | การตรวจ / ผล | พิสูจน์อะไร / ไม่ได้พิสูจน์อะไร |
|---|---|---|
| B01 | TypeScript app `noEmit`: 22 diagnostics; node config: 0 | มี undefined imports และ type mismatch; ไม่ได้เป็น browser E2E |
| B02 | ESLint ไม่ fix/cache: 137 errors, 35 warnings | มี lint debt; ไม่ใช่จำนวนช่องโหว่ |
| B03 | Vite production build แบบ in-memory ผ่าน; main JS 3,736,902 bytes / gzip 973,205 bytes | bundle สำเร็จ แต่ `vite build` ไม่ gate type errors |
| B04 | 86 tests ผ่าน | รวมเทสต์ที่ fetch Dev plan โดยไม่ส่ง token: ตัวกรองข้ามเทสต์ไม่ทำงาน จึงไม่เรียกชุดนี้ว่า offline |
| B05 | Rules source อนุญาต self-role write และ cross-user studyPlans write | ยืนยัน semantics ของ source; ไม่ได้ลองเขียนโจมตีระบบจริง |
| B06 | advisory query ตรงกับเวอร์ชันใน 33 package names | ต้อง triage reachability; ไม่ใช่ 33 ช่องโหว่ที่โจมตี SPA ได้แน่นอน |
| B07 | Git working tree สะอาดก่อนเริ่มเขียนเอกสาร | ไม่มี application change จาก assessment |

ทุกบั๊กที่นำมาแก้ต้องทำตามลำดับ:

1. Reproduce: เขียน regression ที่ใช้ synthetic data และผล pass/fail ชัดเจน
2. Trace: ติด debugger เมื่อเข้าถึงเส้นทางได้; มิฉะนั้นไล่ entry → service → Rules/SDK → UI ระบุ knobs เช่น role, network, env, data version
3. Falsify: บันทึก 3–5 สมมติฐานที่เป็นไปได้ แล้วทดสอบสิ่งที่อาจหักล้างสมมติฐานก่อนแก้
4. Ledger: เทียบผลกับ run ก่อนหน้า ไม่สรุป root cause จากคำอธิบายใน comment หรือเทสต์ที่ตรวจค่าที่สร้างเอง

ตัวอย่างสำหรับ false-success: H1 service คืน false, H2 caller ไม่ await, H3 UI แสดง stale state, H4 write สำเร็จแต่ refresh อ่านผิด path; จำลอง service reject/false แยกกันและตรวจ persisted value จาก connection อิสระ

สร้าง `docs/audits/production-remediation-ledger.md` เมื่อ implementation ได้รับอนุมัติ โดยใช้ schema:

```text
Run ID | Commit | Runtime | Command | Fixture/environment
Expected failure | Actual result | Hypothesis ruled out
Changed files | Remaining uncertainty | Reviewer decision
```

## 3. ขอบเขตไฟล์และสัญญาระหว่างส่วน

### ไฟล์เดิมที่เกี่ยวข้อง

| Files | ความรับผิดชอบ / จุดที่จะเปลี่ยน |
|---|---|
| `database.rules.json`, `firebase.json` | trust boundary, validation และ emulator |
| `src/contexts/AuthContext.tsx`, `src/types/auth.ts`, `src/components/ProtectedRoute.tsx` | login/profile/roles/logout |
| `src/services/firebaseService.ts`, `src/hooks/useFirebaseData.ts` | read scope, error contracts, persistence |
| `src/components/study-plan/StudyPlanManager.tsx` | optimistic state, revision conflicts, derived progress |
| `src/services/hybridCourseService.ts`, `src/components/dashboard/CourseManagement.tsx` | scoped curriculum identity, delete/merge semantics |
| `src/components/curriculum/CurriculumTimelineFlowchart.tsx` | เอา maintenance writes ออกจากการแสดงผล |
| `src/components/chat/ChatBot.tsx`, `src/components/chat/FeedbackBanner.tsx`, `src/services/chatLogService.ts` | authenticated chat, lifecycle, feedback/error UI |
| `src/App.tsx`, `src/pages/CurriculumDashboard.tsx`, `src/components/dashboard/StudentDetailView.tsx` | runtime/type errors และ routing |
| `package.json`, `package-lock.json`, `tsconfig*.json`, `.env.example` | reproducible checks และ environment contract |
| `tests/study-plan/electiveAudit.test.ts`, root `test-*.js`, `migrate-curriculum-data.ts` | แยก fixture/test/admin maintenance target |

### โครงสร้างใหม่ที่เสนอ ไม่ใช่ของที่มีอยู่แล้ว

```text
server/
  package.json, package-lock.json, tsconfig.json
  src/app.ts                 HTTP composition; /api routes; body/error limits
  src/auth.ts                verify token, active account, membership, role
  src/users.ts               privileged account lifecycle
  src/chat.ts                validate request, construct trusted context, call n8n
  src/audit.ts               append server-owned security events
  src/contracts.ts           versioned request/response schemas
  tests/auth.test.ts, chat.test.ts, users.test.ts
src/services/chatTransport.ts        browser request/auth/deadline adapter
src/services/persistenceResult.ts    explicit failure handling
scripts/run-unit-tests.mjs           controlled test-file enumeration
scripts/check-production-env.mjs     fail-fast build configuration
scripts/migrate-study-plans.ts       offline dry-run/validated staging migration
tests/security/database.rules.test.ts
tests/integration/persistence.test.ts
tests/e2e/production-critical.spec.ts
deploy/compose.yaml                 only if Docker approved
deploy/nginx.conf                   only if Nginx approved
workflows/academic-advisor.json      sanitized export from actual n8n
docs/audits/production-remediation-ledger.md
```

ข้อเสนอ server endpoints (ยังไม่มี implementation):

| Endpoint | Auth และผลลัพธ์ |
|---|---|
| `GET /api/health/live` | ไม่มี PII; 200 เมื่อ process ทำงาน |
| `GET /api/health/ready` | 200/503 ตาม readiness แบบ bounded; ไม่เรียก LLM เพื่อ health check |
| `GET /api/users` | active privileged role; คืนเฉพาะ fields และ advisees ตามหน้าที่; pagination จำกัด page size 50 |
| `GET /api/study-plans` | active instructor/staff/admin ตาม access matrix; instructor จำกัด assigned UID; cursor pagination สูงสุด 50 |
| `POST /api/chat` | verified active member; JSON contract ด้านล่าง; 401/403/413/429/502/504 ตามเหตุ |
| `PATCH /api/admin/users/:uid` | admin claim + active membership; เปลี่ยน role/active status; audit |
| `DELETE /api/admin/users/:uid` | admin; แยก disable/revoke กับการลบข้อมูลตาม retention ที่อนุมัติ |

```ts
export type ChatRequest = {
  requestId: string; // UUID; client ใช้ค่าเดิมเมื่อ retry งานเดิม
  sessionId: string; // server ต้อง bind กับ UID; ID อย่างเดียวไม่ใช่สิทธิ์
  message: string;   // trim; 1..4000 characters
};
export type ChatResponse = {
  requestId: string;
  sessionId: string;
  answer: string;
  citations: Array<{ documentId: string; page: number }>;
};
export type ApiError = {
  error: { code: string; message: string; requestId: string };
};
```

Browser ไม่ส่ง role, email, grades หรือ system directives เป็น authoritative fields; server ใช้ verified UID ดึง context ที่อนุญาต ข้อจำกัดข้อความ/เวลา/อัตราในแผนเป็นค่าเริ่มต้นสำหรับ staging ไม่ใช่ capacity ที่รับรองแล้ว

## 4. ลำดับงานและ gate

`T01 → T02 → T03 → T04 → T05 → T06/T07 → T08 → T09 → T10 → T11 → T12`

T06/T07 แยก review ได้แต่ต้องใช้ persistence contract เดียวกัน ทุก task เป็นงานเสนอให้ทำหลังอนุมัติ ขั้น checklist คือหน่วยลงมือทำและทบทวน ไม่ใช่การสั่งให้เริ่มตอนอ่านเอกสาร

### T01 — ยืนยัน deployment boundary และทำ test harness ให้ปลอดภัย (High)

**Files:** Modify `tests/study-plan/electiveAudit.test.ts:128`, `package.json:6`; Create `scripts/run-unit-tests.mjs`, `tests/study-plan/fixtures/ine62-elective-plan.json`, `docs/audits/production-remediation-ledger.md`.

**Consumes:** baseline B01–B07; server/data-policy questionnaire ในคู่มือ deployment. **Produces:** offline unit command และหลักฐาน environment ที่อนุมัติ.

- [ ] บันทึกคำตอบ server/Cloud จากผู้ดูแล หากยังไม่ทราบให้ทำเฉพาะ local hardening และเอกสาร ห้ามเลือก production target แทนผู้ดูแล
- [ ] ย้ายกรณี live fetch ไป synthetic fixture ที่รักษารูปข้อมูลและผลคำนวณ โดยไม่คัดลอกชื่อ/อีเมล/UID นักศึกษาจริง
- [ ] ทำ regression ตรวจผล credits เดิมจาก fixture; รันใน environment ที่ปิด network แล้วต้องผ่าน
- [ ] สร้าง runner ที่ค้นหาเฉพาะ `tests/study-plan` และ `tests/curriculum` และส่งรายชื่อไฟล์เป็น argument array ห้ามพึ่ง test-name regex เพื่อกัน live data

```js
// scripts/run-unit-tests.mjs (proposed complete runner)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.test.ts') ? [path] : [];
  });
}
const selected = ['tests/study-plan', 'tests/curriculum'].flatMap(files).sort();
if (!selected.length) throw new Error('No unit tests found');
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...selected], {
  stdio: 'inherit', env: { ...process.env, TSX_DISABLE_CACHE: '1' }
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
```

- [ ] หลังตรวจ test imports ว่าไม่มี external side effects จึงรัน `node scripts/run-unit-tests.mjs`; expected exit 0 และไม่มี external requests
- [ ] แยก root `test-*.js`/migration ออกจาก CI พร้อม guard ที่ต้องระบุ project และ explicit maintenance intent

**Acceptance:** offline run ผ่านโดยตัดอินเทอร์เน็ตได้ ไม่มีคำสั่งที่อ่าน/เขียน Dev อัตโนมัติ; ledger มีผลจริง ไม่คัดลอก badge ใน README

### T02 — ปิด role escalation และกำหนด membership (Critical)

**Files:** Modify `database.rules.json:3`, `src/contexts/AuthContext.tsx:53,349`, `src/types/auth.ts:99`; Create `server/package.json`, `server/package-lock.json`, `server/tsconfig.json`, `server/src/app.ts`, `server/src/auth.ts`, `server/src/users.ts`, `tests/security/database.rules.test.ts`, `server/tests/auth.test.ts`.

**Consumes:** verified Firebase token; approved membership policy. **Produces:** `requireActiveMember(token): Promise<{uid: string; role: 'student'|'instructor'|'staff'|'admin'}>` และ server-only role assignment.

- [ ] เพิ่ม Rules regression ใน emulator: student เขียน own role เป็น admin ต้องถูกปฏิเสธ; verified student แก้ display name ตนเองได้
- [ ] ตั้ง server test/build harness พร้อม task นี้เพื่อให้ auth tests รันได้ก่อนงาน chat: `build` ใช้ `tsc -p tsconfig.json`, `start` ใช้ `node dist/app.js`, `test` ใช้ Node test runner ผ่าน tsx กับ `server/tests`; ใช้ isolated synthetic credentials และ fake provider clients
- [ ] Seed profile และ authority records ด้วย `withSecurityRulesDisabled` เฉพาะ setup; assertion ใช้ authenticated client จริง

```ts
// Assertion inside the emulator test after fixtures are seeded
await assertFails(set(ref(studentDb, 'users/student-a/role'), 'admin'));
await assertFails(set(ref(studentDb, 'memberships/student-a/active'), true));
await assertSucceeds(set(ref(studentDb, 'users/student-a/name'), 'Student A'));
```

- [ ] ใช้ `@firebase/rules-unit-testing` และ Firebase CLI ที่ pin ใน lockfile; `firebase emulators:exec --only auth,database --project demo-it-course-chatbot "node --import tsx --test tests/security/database.rules.test.ts"` ต้องเริ่มจาก regression fail แล้วผ่านหลังแก้
- [ ] แยก authority เป็น `memberships/<uid>` ที่ client เขียนไม่ได้: `active`, `role`, `advisorId`; custom claims ถูกตั้งด้วย Admin SDK เท่านั้น ตรวจความสอดคล้อง claims กับ authority เพื่อลดช่วงสิทธิ์เก่าค้าง
- [ ] โปรไฟล์แก้ได้เฉพาะ field allowlist; เอา role inference จาก substring ของ email ออกจากการตัดสินสิทธิ์ บัญชีสมัครใหม่ไม่เป็นสมาชิกจนผ่าน policy
- [ ] อีเมลไม่ verified / inactive / claim-role ไม่ตรง authority / token ผิด project ต้องถูกปฏิเสธที่ API และ Rules ที่เกี่ยวข้อง
- [ ] วาง bootstrap admin ผ่าน operator ที่ได้รับอนุมัติ; migration ต้องมี manifest UID/role ที่ผู้ดูแลตรวจ ห้ามเชื่อ role เดิมทั้งหมดแล้วเลื่อนเป็น trusted claims อัตโนมัติ

**Acceptance:** ทดสอบ student/admin/staff/instructor/anonymous matrix; self-escalation ปิดทั้ง direct SDK และ REST. Role เปลี่ยนต้อง refresh token และ re-evaluate authority; UI ไม่ใช่ security boundary

### T03 — Ownership, schema และการอ่านแผนเฉพาะเจ้าของ (High)

**Files:** Modify `database.rules.json:17`, `src/services/firebaseService.ts:624,656,675,736,765`, `src/hooks/useFirebaseData.ts:187`, caller ใน `StudyPlanManager.tsx`; Create `scripts/migrate-study-plans.ts`, `tests/integration/persistence.test.ts`.

**Consumes:** T02 authority. **Produces:** canonical path `studyPlans/<uid>`, `studentId` เป็น Firebase UID; revision integer เริ่ม 0; student number เก็บแยกจาก UID.

- [ ] Repro ด้วย student A/B: A อ่าน/แก้/ลบ B และอ่าน parent collection ไม่ได้; instructor อ่านเฉพาะ advisee; privileged list ใช้ API ตรวจ role แทนการเปิด parent read ให้ทุกคน
- [ ] สร้าง migration dry-run จาก backup ที่ได้รับอนุมัติ แยกรายการ duplicate/orphan และห้ามลบทิ้ง เลือก canonical record ด้วยการ review โดยไม่ merge grades อัตโนมัติ
- [ ] ตรวจ schema: immutable `studentId`; program/curriculum ต้องรู้จัก; course IDs ไม่ซ้ำ; grade อยู่ใน enum ที่ domain รองรับ; credits เป็น finite nonnegative number ตามชนิดวิชาที่อนุมัติ; year/semester และจำนวน rows มีขอบเขต; unknown fields ปฏิเสธ
- [ ] กำหนด owners/advisors ที่อ่านได้จาก authority โดยไม่อนุญาต client เปลี่ยน advisor เอง; profiles list อ่านผ่าน privileged API หรือ scoped index ที่ไม่เปิด PII ทั้งระบบ
- [ ] เปลี่ยน getter/listener/sync ทุกตัวให้ใช้ canonical UID เดียวกัน ตรวจ search `ref(..., 'studyPlans')` และ `Object.values(...).find` ที่เหลือทีละ caller
- [ ] ย้าย admin list/instructor analytics ไป scoped API ตาม endpoint contract; API ต้อง enforce authorization เองทุก query เพราะ Admin SDK ข้าม RTDB Rules ห้ามเพียงย้าย whole-collection read ไป server แล้วส่งทั้งหมดกลับ browser
- [ ] ทดสอบ create/read/update/delete, invalid schema, parent read และ deleted plan ว่า UI ล้างข้อมูลเก่า
- [ ] ทำ staging cutover แบบหยุดเขียน → backup → dry-run approval → migrate → read verification → เปิด client รุ่นใหม่; เก็บ backup/legacy path แบบปิด client access

**Acceptance:** independent client B เห็นเฉพาะข้อมูล B; ไม่ต้องดาวน์โหลดแผนทุกคน; orphan/duplicate manifest มีผลตัดสินครบ; rollback รองรับ schema ที่เปลี่ยน ไม่เปิด public rules ชั่วคราว

### T04 — Account lifecycle, logout และ audit (High)

**Files:** Modify `src/contexts/AuthContext.tsx:302`, `src/services/firebaseService.ts:310`, AdminDashboard callers; Create `server/src/audit.ts`, `server/tests/users.test.ts`; Modify Rules audit/users.

**Consumes:** T02 identity. **Produces:** admin-only disable/role/delete endpoints ตาม contract; server-owned append-only audit.

- [ ] Repro delete-profile → login แล้ว profile ถูกสร้าง active กลับมา; ใช้ Auth emulator กับ synthetic account
- [ ] เปลี่ยน suspend ให้ authority inactive พร้อม disable Auth/revoke tokens; ทุกขั้นตอนมี retry/reconciliation เมื่อทำได้ไม่ครบ ไม่ถือ RTDB delete เป็น account deletion
- [ ] แยก policy ลบบัญชีกับ policy ลบข้อมูลแผน/chat; operation มี request ID และ idempotent outcome
- [ ] จำลอง audit write reject/offline; logout ต้องยังเรียก `signOut` โดยไม่รอ network audit; audit เป็น best-effort request แยกสำหรับ logout ส่วน privileged writes ต้องมี durable audit/reconciliation
- [ ] ลบการสร้าง role/active ใหม่โดยอัตโนมัติเมื่อไม่พบ authority; แสดง pending/disabled ตามสถานะจริง
- [ ] ปิด client overwrite/delete `auditLogs`, `chatLogs`, `chatSessions`; จำกัด server credentials และรักษา redacted audit

**Acceptance:** suspended user ใช้ token เก่าก็เข้าถึงข้อมูล protected ไม่ได้ตาม authority check; login ใหม่ไม่คืนสิทธิ์; audit fail ไม่ทำให้ logout ค้าง

### T05 — Typecheck, route contract และ error result (High)

**Files:** Modify `src/App.tsx:38`, `src/components/ProtectedRoute.tsx:7`, `src/pages/CurriculumDashboard.tsx:106`, `src/components/dashboard/StudentDetailView.tsx:80`, `src/services/chatLogService.ts`, `src/services/courseService.ts`, `src/utils/firestoreUtils.ts`, `package.json`; Create `src/services/persistenceResult.ts`, `tests/e2e/production-critical.spec.ts`.

**Consumes:** current domain types and T01 runner. **Produces:** type-safe build gate และ explicit persistence success/failure.

- [ ] บันทึก diagnostics ด้วย `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit`; reproduce undefined imports ใน browser test แยกจาก type error
- [ ] แก้ import ของ `getHybridCurriculumData`, `HybridCourse`, `ref`, `update`; เพิ่ม `neutralCount`; ใช้ field profile picture ตาม type; ตรวจ Course/StudyPlan required properties ทีละ caller
- [ ] ทำ `requiredRoles?: readonly UserRole[]` ใน ProtectedRoute และตรวจ inclusion ให้ตรงกับ App; กำหนด admin exception ชัดเจน พร้อม test ไม่ยกระดับสิทธิ์ API ตาม UI
- [ ] ลบ Firestore retry utility ที่ไม่ได้ใช้หลังตรวจ callers; ไม่ cast RTDB เป็น Firestore เพื่อให้ compiler ผ่าน
- [ ] เลือก service failure contract เดียว: คง boolean ชั่วคราวได้เมื่อ caller ตรวจทุกจุด ก่อนเปลี่ยนเป็น typed result ต้องย้าย caller พร้อมกัน

```ts
// Proposed shared guard for existing boolean services
export function requireSaved(saved: boolean, operation: string): void {
  if (!saved) throw new Error(`${operation} failed`);
}
```

- [ ] ตัวอย่าง caller: `requireSaved(await firebaseService.updateCourse(program, curriculumYear, year, semester, course), 'updateCourse');` จากนั้นจึง update UI/toast; catch ต้องเก็บ draft เพื่อให้ retry
- [ ] รัน tsc ทั้ง app/node config, `npm run lint`, offline unit runner; expected exit 0 ทุกตัว ห้ามใช้ `any`, disable rule หรือ ignore diagnostic เพื่อซ่อนข้อผิดพลาด

**Acceptance:** เลือก curriculum เห็น courses; บันทึกปีสำเร็จจริง; permission denied แสดง error และคง draft; typecheck 0 diagnostics; lint ผ่านตาม policy ที่ review แล้ว

### T06 — Study plan concurrency และ derived data (High)

**Files:** Modify `src/services/firebaseService.ts:675,736,765`, `src/components/study-plan/StudyPlanManager.tsx:727`, `src/hooks/useFirebaseData.ts`; Test `tests/integration/persistence.test.ts`.

**Consumes:** canonical UID/revision จาก T03, result contract จาก T05. **Produces:** `saveStudyPlan(uid, expectedRevision, patch)` คืน saved revision หรือ conflict; all callers ใช้ revision จาก latest snapshot.

- [ ] Repro A/B อ่าน revision 3; A แก้ row A แล้ว B แก้ row B โดยยังใช้ revision 3; เขียน regression ว่า B ต้องได้รับ conflict ไม่ silently overwrite
- [ ] ใช้ RTDB transaction ตรวจ current revision ก่อน apply; callback pure เพราะ SDK อาจเรียกซ้ำ ห้ามยิง log/network ใน callback

```ts
// Transaction decision sketch: shape validation/calculation precedes commit.
if (current.revision !== expectedRevision) return; // abort transaction
return { ...current, ...validatedPatch, revision: current.revision + 1 };
```

- [ ] รวม courses/GPA/credits ในการบันทึกแผนเดียว; แยก current study year ที่ผู้ใช้ระบุจาก derived progress ไม่เลื่อนชั้นปีโดย side effect ที่ไม่ได้อนุมัติ
- [ ] เอา sync ซ้ำที่เลือกแผนแรกออก; profile fields ที่ต้อง sync ใช้ contract แยกและรายงาน partial failure ห้ามแสดงว่า atomic หากใช้สอง transaction
- [ ] conflict UI แสดง reload/compare draft; ไม่ retry whole-array write แบบอัตโนมัติ; double-click ก่อ operation เดียว
- [ ] ทดสอบ refresh, disconnect/reconnect, deleted record, revision mismatch และผลคำนวณเทียบ snapshot ที่บันทึก

**Acceptance:** ไม่มี lost update ในสองแท็บ; GPA/credits/courses สอดคล้องหลังอ่านกลับ; error ไม่มี success toast

### T07 — Curriculum identity, atomic writes และถอน auto-cleanup (High)

**Files:** Modify `src/services/firebaseService.ts:432,455,478,530`, `src/services/hybridCourseService.ts:78`, `src/components/dashboard/CourseManagement.tsx`, `src/components/curriculum/CurriculumTimelineFlowchart.tsx:32`; Create `tests/integration/curriculumPersistence.test.ts`.

**Consumes:** T05 result contract. **Produces:** scoped curriculum key, deletion tombstone และ atomic cross-path writes.

- [ ] Repro same code สอง curriculum years ด้วย credits ต่างกัน; ลบ static course แล้ว reload; เปิด timeline แล้ว assert ว่าไม่มี DB writes
- [ ] นำ cleanup call ออกจาก component; หากจำเป็นทำเป็น operator maintenance ที่แยก dry-run และ quarantine รายการก่อนลบ
- [ ] ใช้ `(program, curriculumYear, academicYear, semester, courseId)` เป็น record identity; course code ใช้ค้นหาใน scope เท่านั้น ไม่เป็น global identity
- [ ] ใช้ `update(ref(db), changes)` หนึ่งครั้งสำหรับ curriculum/index/tombstone ที่เกี่ยวข้อง; ย้ายเทอมต้องลบ old path และเพิ่ม new path ใน atomic operation เดียว
- [ ] เพิ่ม tombstone สำหรับ static-base deletion และ filter ก่อน merge; migration ต้องแยก unknown absence ออกจาก explicit delete
- [ ] ตรวจ consumers ทั้ง public courses, staff/admin, student plan และ chat context ให้เห็น revision เดียว; ลด fallback เงียบด้วยสถานะข้อมูล stale
- [ ] ทดสอบ permission failure, partial-path validation failure (ทั้งหมดต้อง abort), same-code different scope และ delete→reload

**Acceptance:** เปิดหน้าอ่านอย่างเดียวไม่เปลี่ยน DB; ลบแล้วไม่ฟื้นจาก static source; index/main record ไม่แยกผลสำเร็จ

### T08 — Authenticated chat gateway และ workflow contract (High)

**Files:** Create `server/src/contracts.ts`, `server/src/chat.ts`, `server/tests/chat.test.ts`, `src/services/chatTransport.ts`, `workflows/academic-advisor.json`; Modify server scaffold จาก T02 และ `src/components/chat/ChatBot.tsx:338,518`.

**Consumes:** T02 identity, T03 plan lookup, ChatRequest/ChatResponse contract. **Produces:** `POST /api/chat` และ sanitized versioned workflow export.

- [ ] ขอ export workflow Dev โดยตัด credentials/token/PII; trace webhook → identity/context → retrieval → model → response/log; ถ้ายังไม่มี export ให้บันทึกว่าฝั่ง server ยังไม่ verified และหยุดการรับรองงานนี้
- [ ] เขียน gateway tests ด้วย fake upstream: missing/expired/wrong-project token→401; inactive/non-member→403; metadata role spoof ถูกปฏิเสธ/ไม่ถูกใช้; session ของ UID อื่น→403
- [ ] ใช้ Firebase Admin verify token พร้อมตรวจ revocation/authority ตาม policy; สร้าง trusted context จาก server ห้าม forward client directives/grades ตรงเข้า system prompt
- [ ] Validate ChatRequest แบบ strict; JSON body ไม่เกิน 32 KiB, message 1–4000 chars; bind session owner และ TTL; deduplicate `(uid, requestId)` เพื่อไม่สร้างคำถาม/ค่าใช้จ่ายซ้ำเมื่อ retry
- [ ] กำหนด error envelope ไม่เปิด stack/provider credential; บันทึก request ID และ upstream execution ID โดยไม่ log token หรือ raw profile
- [ ] ค่า staging เริ่มต้น: 6 messages/minute/UID, burst 3, in-flight 1/UID; global concurrency คำนวณตาม provider quota; server ตอบ 429 พร้อม Retry-After; จำกัดตาม UID เป็นหลักเพราะนักศึกษาอาจแชร์ NAT
- [ ] Deadline เริ่มต้น: upstream budget 45 s, gateway 50 s, proxy 60 s, browser 65 s; retry transient 429/5xx ได้สูงสุด 2 ครั้งเมื่อเหลืองบเวลาและ upstream operation ทำซ้ำได้จริง
- [ ] Browser ดึง `getIdToken()` ตอนส่งแต่ละครั้ง ผ่าน adapter; ต้องทดสอบ session/token refresh กับ `@n8n/chat` เวอร์ชันที่ pin ไม่ตั้ง token ค้างตอน mount หาก library ไม่รองรับ transport hook ให้ใช้ adapter/widget ที่ตรง contract พร้อมทดสอบ UI
- [ ] ทดสอบ protocol ชัดเจน: ChatRequest ใหม่ไม่ตรง body/action ของ `@n8n/chat` โดยอัตโนมัติ ต้องแปลงทั้ง request/response ใน adapter; ห้ามเพียงเปลี่ยน URL แล้วถือว่าเสร็จ
- [ ] เก็บ/unmount widget instance; อัปเดต context โดยไม่ทำลาย session; login/logout แยก memory ตาม UID; n8n private webhook รับได้เฉพาะ gateway พร้อม service authentication
- [ ] รวม widget session, metadata session, n8n memory key และ feedback session ให้เป็น canonical contract เดียว: ใน baseline widget สร้าง session เองต่างจาก `sessionIdRef`; reset/rebind เมื่อ UID เปลี่ยน และทดสอบ A logout → B login, reload/new chat, session tampering และ token หมดอายุระหว่างรอคำตอบ

**Acceptance:** bypass UI แล้วเข้าถึงข้อมูลคนอื่นไม่ได้; slow/error upstream มีข้อความและ deadline; retry ไม่เพิ่ม log/charge ซ้ำจากการรับงานซ้ำ; ไม่มี n8n editor/public webhook ที่ข้าม gateway

### T09 — Feedback, privacy และ RAG evaluation (High/Medium)

**Files:** Modify `src/services/chatLogService.ts:273`, `src/components/chat/FeedbackBanner.tsx:40`, `src/components/dashboard/ChatAnalyticsDashboard.tsx`; Create `tests/integration/chatFeedback.test.ts`, `tests/rag/advising-cases.json`, `docs/audits/rag-evaluation.md` เมื่อเริ่ม implementation.

**Consumes:** T08 session ownership; T02 trusted roles. **Produces:** feedback ownership/retention และผลประเมิน workflow จริง.

- [ ] Rules: ผู้ใช้สร้าง feedback ของตัวเอง/session ที่มีสิทธิ์ได้; admin อ่านแบบ query; ผู้ใช้เขียน userId คนอื่นหรือ overwrite records ไม่ได้
- [ ] Repro saveFeedback คืน null; UI ต้องแสดง retry และไม่ขอบคุณจนมี persisted key
- [ ] ใช้ timestamp จาก server; จำกัด enum/ขนาด/messageCount และ unique feedback policy; เลิกเชื่อ `unknown_session` เป็น ownership
- [ ] ประเมินคำถามอย่างน้อย: curriculum ทุกฉบับ, prerequisites, วิชาที่เรียนผ่าน, grade incomplete, curriculum switch, identity switch, no evidence, conflicting source และ prompt injection
- [ ] ทุก citation ต้องตามกลับไป document ID/page ใน retrieval metadata จริง; เก็บ index version, embedding model/dimension, chunking และ checksum ของเอกสารต้นฉบับ
- [ ] ให้ผู้รับผิดชอบวิชาการตรวจคำตอบ high-impact; แสดงข้อจำกัดของแผนผู้ใช้กรอกเองและช่องทางปรึกษาอาจารย์ ห้ามรับรองความแม่นยำจาก prompt อย่างเดียว
- [ ] ทำ privacy inventory: field ส่ง LLM, ผู้เห็น chat logs, provider retention, ระยะเก็บใน n8n/RTDB, ขั้นตอนลบ/สำรอง; ลดอีเมล/ชื่อที่ไม่จำเป็นและปิด raw PII console logs

**Acceptance:** ไม่มี cross-user memory; มีผล RAG ตาม input/output จริง; retention และผู้เข้าถึงได้รับการอนุมัติ; feedback failure แสดงตรงกับ DB

### T10 — Env, dependencies และ CI release gates (High)

**Files:** Modify `src/config/firebase.ts:19`, secondary config `src/services/firebaseService.ts:8`, `.env.example`, `package.json`, `package-lock.json`, `vite.config.ts`; Create `scripts/check-production-env.mjs`; CI location เลือกตาม platform ที่มหาวิทยาลัยอนุมัติ ไม่สร้าง provider workflow ก่อนรู้ platform.

**Consumes:** T01 safe tests, T05 green typecheck, T08 API contract. **Produces:** immutable frontend/server artifacts พร้อม release manifest.

- [ ] Tests: missing production project/database/API URL ต้อง fail; loopback/http ต้อง fail สำหรับ production; demo-* ใช้ได้เฉพาะ test; auth config และ secondary app ต้องใช้ project เดียวกัน
- [ ] เอา fallback Dev endpoint ออก; validation ทำใน build script และ runtime initialization ตามชนิด config; `VITE_NODE_ENV` ไม่ใช่ตัวแทน `import.meta.env.MODE`
- [ ] Pin supported Node.js/package-manager/server images หลัง compatibility test; ใช้ lockfile เดียวเป็น authoritative และติดตั้งด้วย `npm ci`
- [ ] Triage advisories แยก browser/runtime/build-time และ reachable API; อัปเดตแพ็กเกจแล้วทดสอบ PDF/Excel/markdown; เก็บ exception owner/เหตุผล/expiry เมื่อยังแก้ไม่ได้
- [ ] ตั้ง scripts หลังสร้าง harness จริง: `typecheck`, `test:unit`, `test:rules`, `test:integration`, `test:e2e`, `check:production-env`; server มี `build`, `start`, `test` ที่ชี้ executable จริง
- [ ] Pipeline: install → typecheck/lint → offline/Rules/integration tests → env check → build → scan artifact → staging smoke/E2E → approved promotion
- [ ] Production build ใช้ public env ของ target; บันทึก project ID/API origin/base path โดยไม่เก็บ server secrets; ไม่ promote staging-config bundle ไป Production ตรง ๆ
- [ ] หากมหาวิทยาลัยให้ subpath ให้ปรับ Vite `base`, BrowserRouter `basename`, `index.html` asset URLs, `src/components/home/HomeOverview.tsx` และ `src/pages/NotFound.tsx` พร้อม deep-link/login/asset regression; root-domain ใช้ค่า `/` ตามเดิม ดูตารางในคู่มือ

**Acceptance:** clean checkout สร้าง artifact ซ้ำได้; missing env ถูกหยุดก่อน upload; CI ไม่เชื่อม Dev; deploy มี manifest/hash และผ่าน review

### T11 — University infrastructure, recovery และโหลด (High)

**Files:** Create `deploy/nginx.conf`, `deploy/compose.yaml` เฉพาะสาขาที่อนุมัติ; Update `docs/deployment/UNIVERSITY_PRODUCTION_DEPLOYMENT.md` ให้ตรงเครื่องจริง; Create `docs/audits/production-load-and-recovery.md`.

**Consumes:** ข้อมูล server/Cloud ที่ยืนยันแล้ว, T10 artifacts. **Produces:** staging ที่ทำซ้ำได้ และ production go/no-go evidence.

- [ ] ผู้ดูแลเลือก VM/static/subpath และรับรอง outbound DNS/TLS/network; คง Cloud ตาม policy ที่อนุมัติเท่านั้น
- [ ] ตั้ง reverse proxy, TLS renewal, auth domains, firewall, secret mounting, non-public n8n/Postgres และ health/readiness probes ตามคู่มือ
- [ ] restore RTDB, n8n DB/credentials encryption key และ vector rebuild ใน isolated environment แล้วพิสูจน์ login/chat/plan ด้วย synthetic users
- [ ] ทดสอบ 25/50/100 concurrent web sessions เป็นขั้นและ chat concurrency แยกชุด; ใช้ fake LLM ก่อน จากนั้น limited real-provider test ที่มี cost cap
- [ ] บันทึก p50/p95, error %, denied security requests, queue wait, memory/CPU, bytes และ cost; หยุดเมื่อ data integrity fail หรือเกิน cap
- [ ] ค่า pilot ที่เสนอให้ผู้ดูแลอนุมัติ: non-LLM API p95 < 1 s, completed chat p95 < 30 s, server 5xx < 1%, access-control violations = 0; 429 แยกจาก 5xx และทดสอบตาม rate policy
- [ ] ถ้าไม่ผ่านให้ลดจำนวน pilot/แก้ bottleneck แล้ววัดใหม่; queue/worker เป็นงานเพิ่มเมื่อมีหลักฐาน ไม่ถือว่าซื้อเครื่องเพิ่มแก้ได้ทุกกรณี

**Acceptance:** ผู้ดูแลลงผล TLS/network/restore/load จริง; มี RPO/RTO owner และ rollback ที่ซ้อมแล้ว; ไม่ออกใบรับรอง capacity จากจำนวนผู้ใช้รวม

### T12 — Pilot, acceptance และงานภายหลัง (High → Medium/Low)

**Files:** Update deployment guide และ remediation ledger; change tickets สำหรับ refactor ภายหลังแยกจาก release.

**Consumes:** T01–T11 evidence. **Produces:** approved release decision.

- [ ] ทำ acceptance matrix anonymous/student A/student B/instructor/staff/admin/suspended กับทุก sensitive operation
- [ ] ให้ผู้รับผิดชอบวิชาการ/ข้อมูลตรวจ course scope, self-entered grades, privacy notice และ RAG evaluation
- [ ] เปิด pilot กลุ่มที่กำหนด มีผู้รับ incident และเงื่อนไขหยุด: cross-user access, corrupted writes, unbounded charges, failed recovery
- [ ] บันทึก release ID และผล monitor ก่อนเพิ่มผู้ใช้; dashboard/logs ต้องแยกไม่มีข้อมูลจากอ่านข้อมูลล้มเหลว
- [ ] งานภายหลัง: split oversized components, lazy routes/PDF/Excel, log aggregation, server-side analytics summaries และลด duplicated types โดยไม่เปลี่ยนกฎ domain

**Acceptance:** เปิดใช้ได้เมื่อ checklist ในคู่มือครบและอาจารย์/ผู้ดูแลอนุมัติ release; Critical/High ที่กระทบ scope เปิดใช้ต้องไม่มีรายการค้าง

## 5. Traceability และ self-review

| Assessment finding | Task |
|---|---|
| Role escalation / unverified privileged email | T02 |
| Dev anonymous plan read / test touches real data | T01, T02, T03 |
| Cross-user rules / no schema validation | T03 |
| Public chat writes / forged audit | T04, T08 |
| Delete recreates account / logout blocked by audit | T04 |
| Users parent read denied / feedback rules absent | T03, T09 |
| 22 type errors / runtime missing imports | T05 |
| False success / lost updates / duplicate plans | T05, T06 |
| Auto-cleanup / scoped merge / deleted static course returns | T07 |
| Localhost fallback / Dev env | T10 |
| Chat identity / session / deadlines / workflow unknown | T08, T09 |
| Collection scans / bundle / observability | T03, T09, T11, T12 |
| Dependencies / CI / backup / deployment | T10, T11 |

ตรวจแล้วในระดับแผน: security migration ต้องเปลี่ยน Rules+clients+authority ใน release เดียวที่ staging ผ่าน; server endpoints/harness/deploy artifacts ถูกระบุว่าเป็นของใหม่; n8n transport conversion เป็นงานจริง ไม่สมมติว่าการเปลี่ยน URL เพียงอย่างเดียวเพียงพอ; unknown infrastructure อยู่หลัง explicit decision gate

ผลเอกสารนี้ไม่ใช่ผลทดสอบ implementation ข้อสรุปยังเป็น **fix-then-ship** และต้องตรวจผลแต่ละ task ใหม่หลังอนุมัติลงมือ

## 6. เอกสารใช้งานประกอบ

- [คู่มือ deploy บน infrastructure มหาวิทยาลัย](../../deployment/UNIVERSITY_PRODUCTION_DEPLOYMENT.md)
- [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase Rules tests](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Rules semantics](https://firebase.google.com/docs/database/security/core-syntax)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)

เอกสารอ้างอิงออนไลน์ตรวจวันที่ 2026-10-09; ตอนเลือกเวอร์ชัน runtime ให้เทียบกับคู่มือของเวอร์ชันที่ pin อีกครั้ง
