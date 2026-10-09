# Firebase CRUD and Credit Consistency Audit Plan

> **For agentic workers:** Use executing-plans to execute this audit task-by-task. Checkboxes track evidence collection, not assumed success.

**Goal:** ตรวจว่าการเพิ่ม แก้ไข และลบวิชา/ผู้ใช้ผ่าน Admin และ Staff เปลี่ยนข้อมูลจริงครบถ้วน และหน่วยกิตในแต่ละหน้าสอดคล้องกับข้อมูลที่ควรใช้

**Architecture:** เริ่มจาก UI ของแอปจริง ตามผ่าน service ไปยัง Firebase Authentication และ Realtime Database แล้วอ่านผลด้วย connection อิสระหลัง server ยืนยัน ตรวจซ้ำหลัง reload และ login ใหม่เพื่อจับข้อมูลค้าง/ข้อมูลที่ถูกสร้างกลับ ใช้ Firebase Emulator หรือโปรเจกต์ทดสอบแยกจาก production

**Tech Stack:** React, TypeScript, Vite, Firebase Authentication, Realtime Database; Firebase Emulator สำหรับการทดสอบในขั้นดำเนินงาน

## Global Constraints

- รอบนี้ส่งมอบแผนเท่านั้น ไม่รันทดสอบเพิ่ม/ลบข้อมูลจริง และไม่แก้ business logic
- ทุกกรณีมีผล PASS, FAIL, BLOCKED หรือ POLICY-PENDING; อ่าน source อย่างเดียวไม่ถือว่า E2E ผ่าน
- Emulator ต้องครอบคลุมทั้ง Auth และ Database และแอปต้องเชื่อมต่อทั้งคู่ก่อน login; ถ้ายังไม่มีการเชื่อมต่อ emulator ให้เตรียม test-only entry/config และตรวจว่า URL ทุกตัวเป็น localhost ก่อนเริ่ม
- ห้ามรัน test-course-sync.js, test-course-edit.js หรือ test-all-fixes.js ตรงกับ .env production: สคริปต์เดิมมีการเขียนข้อมูลจริง
- อย่าใช้ toast สำเร็จหรือการหายไปจากรายการเป็นหลักฐานเดียว; ตรวจ read-back, reload และ session อื่น
- ชื่อผู้ใช้/อีเมลจริง รหัสผ่าน token และ service account key ห้ามอยู่ในรายงานหรือ Git
- ข้อพบจากการตรวจครั้งก่อนเป็นสมมติฐานที่จะพิสูจน์ซ้ำ ไม่ใช่ผลทดสอบของแผนนี้
- ไม่ deploy rules, push, หรือแก้ไขข้อมูล production ระหว่าง audit

## คำศัพท์และคำถามที่ต้องแยกให้ชัด

อ้างอิง User Profile, Firebase Authentication Account และ StudyPlan ใน CONTEXT.md

| คำ | สิ่งที่ต้องตรวจ |
| --- | --- |
| ลบผู้ใช้ | profile หาย, บัญชี Auth ถูกลบ/ปิดตามนโยบาย, login ใหม่ไม่ได้, session เดิมไม่มีสิทธิ์, ข้อมูลอ้างอิงถูกจัดการ |
| ลบวิชา | วิชาไม่ถูกเสนอใช้งานต่อในขอบเขตหลักสูตรนั้น แม้ reload; ตรวจทั้ง courses, curriculum และ static fallback |
| หน่วยกิตรายวิชา | น้ำหนักของวิชา เช่น 3 → 4 |
| หน่วยกิตรายการที่แสดง | ผลรวมของรายการหลัง filter; ไม่ใช่เกณฑ์จบหลักสูตร |
| หน่วยกิตในแผน | ผลรวมวิชาที่อยู่ใน StudyPlan ของนักศึกษา |
| หน่วยกิตผ่าน | ผลรวมวิชาที่มีเกรดผ่าน; แยกจากตัวหาร GPA |
| เกณฑ์จบหลักสูตร | จำนวนที่หลักสูตรกำหนด ไม่ควรเปลี่ยนเพียงเพราะ filter หรือเพิ่มวิชาในแผน |

คำถามสำหรับเจ้าของระบบก่อนตัดสินผลที่ขึ้นกับนโยบาย:

1. แก้วิชา 3 → 4 หน่วยกิต ต้องเปลี่ยนแผน/เกรดเก่าด้วยหรือไม่? แนะนำเก็บผลที่เรียนจบเป็นประวัติ และกำหนดการย้ายแผนที่ยังวางแผนไว้อย่างชัดเจน; ยังไม่ถือว่าได้รับอนุมัติ
2. ลบวิชาที่มีนักศึกษาเรียนผ่านแล้วให้ทำอย่างไร? แนะนำยุติการเสนอวิชาใหม่และเก็บประวัติผลการเรียน แทนลบประวัติทั้งหมด
3. Staff มีสิทธิ์เพิ่ม/ลบผู้ใช้อื่นหรือไม่? แผนตั้งฐานตาม UI/rules ปัจจุบันว่า Admin จัดการผู้ใช้และ Staff จัดการวิชา; หากต้องการเปลี่ยนสิทธิ์ต้องระบุใหม่

ตรวจข้อเท็จจริงอื่นต่อได้ระหว่างรอคำตอบ โดยกรณีที่ขึ้นกับคำตอบให้ลง POLICY-PENDING

## จุดตรวจใน repository

ทุก path ต่อไปนี้สัมพันธ์กับ root `C:/Users/guy26/Desktop/it-course-chatbot-main-Aektawan-manage-course/`

| ไฟล์ | ความรับผิดชอบ |
| --- | --- |
| src/components/dashboard/CourseManagement.tsx | ฟอร์มเพิ่ม/แก้/ลบที่ Admin และ Staff ใช้ร่วมกัน |
| src/components/dashboard/AdminDashboard.tsx | เพิ่ม/แก้/ลบผู้ใช้, import, สรุปยอด, เงื่อนไขวิชา |
| src/components/dashboard/StaffDashboard.tsx | สิทธิ์ Staff, แก้เงื่อนไขและสรุปวิชา |
| src/services/firebaseService.ts | Auth creation, users, courses, curriculum, studyPlans และ auditLogs |
| src/contexts/AuthContext.tsx; src/types/auth.ts | login, profile recreation, role derivation |
| src/services/hybridCourseService.ts; src/services/courseService.ts; src/services/completeCurriculumData.ts | merge static/Firebase, fallback, identity ของวิชา |
| src/hooks/useFirebaseData.ts | refresh/listener และค่าหน่วยกิตจากแผน |
| src/pages/Courses.tsx; src/pages/CurriculumDashboard.tsx | รายการวิชาและยอดบนหน้าจอ |
| src/components/study-plan/StudyPlanManager.tsx; StudyPlanProgress.tsx; StudyPlanReport.tsx | แผน, หน่วยกิตผ่าน, GPA และรายงาน |
| database.rules.json; src/config/firebase.ts | กฎที่อยู่ใน repo และการเลือก environment |

## Task 1: เตรียมสภาพแวดล้อมและหลักฐานตั้งต้น

**Input:** source ปัจจุบันและ config ทดสอบ **Output:** environment ที่ยืนยันปลายทางแล้วและ baseline

- [ ] บันทึก `git rev-parse HEAD`, `git status --short`, Node version และชื่อ environment ลงรายงาน
- [ ] อ่าน config/rules และตรวจว่ามี Emulator/test project พร้อมหรือไม่; หากไม่มีให้บันทึก BLOCKED ของ live tests พร้อมขั้นตอนเตรียม test-only configuration แทนใช้ production
- [ ] ตรวจ rules ที่โหลดเข้า emulator; แยกออกจาก rules ที่ deploy จริงซึ่งยังไม่ยืนยัน
- [ ] สร้างบัญชีทดสอบ Admin, Staff, Student, Instructor และ guest session; ใช้ browser profile แยกกัน และเก็บ credentials นอก repo
- [ ] เตรียมหลักสูตร IT-67 และ IT-62, วิชาใหม่ QA-A = 3 หน่วยกิต, QA-B = 2 หน่วยกิต, วิชาจาก static อย่างน้อยหนึ่งรายการ และแผนนักศึกษาสองคน
- [ ] ตั้งแผนตัวอย่าง QA-A เกรด A, QA-B planned: หน่วยกิตแผน 5, ผ่าน 3, GPA 4.00; บันทึกค่าเริ่มต้นทุก path
- [ ] อ่านค่าจาก connection อิสระเพื่อยืนยัน fixture และบันทึก mapping UID/courseId/planId ของข้อมูลทดสอบ

## Task 2: ตรวจสิทธิ์ก่อน CRUD

**Input:** sessions ของ Task 1 **Output:** permission matrix พร้อมผลจริง

| Actor | CRUD วิชา | CRUD ผู้ใช้อื่น | Direct API ที่ต้องลองใน emulator |
| --- | --- | --- | --- |
| Admin | อนุญาต | อนุญาต | สร้าง/แก้/ลบและอ่านรายการ users จาก parent path |
| Staff | อนุญาต | ปฏิเสธตามฐานปัจจุบัน | เรียก users/<uid> ของคนอื่นแม้ไม่มีปุ่ม |
| Student/Instructor | ปฏิเสธ | ปฏิเสธ | เขียน courses/curriculum และแก้ role ตนเอง |
| Guest | ปฏิเสธ | ปฏิเสธ | unauthenticated writes |

- [ ] ทดสอบทั้ง route/UI และ API โดยตรง; ปุ่มถูกซ่อนไม่ได้พิสูจน์ความปลอดภัย
- [ ] ลองแก้ role ตัวเองใน emulator และสมัครอีเมลทดสอบที่มีคำว่า admin/staff; ตรวจว่าได้สิทธิ์สูงขึ้นเองหรือไม่
- [ ] ตรวจ `getUsers()`/listener ที่อ่าน parent users: read rule ที่ child ไม่ได้ยืนยันว่าอ่าน parent ได้
- [ ] จับ permission denied และตรวจว่า UI แสดง error ไม่ใช่รายการว่างหรือสำเร็จ

## Task 3: เพิ่ม/แก้/ลบวิชา — ทำครบทั้ง Admin และ Staff

**Input:** fixture หลักสูตร **Output:** CRUD matrix พร้อม read-back ทั้งสองตำแหน่ง

ตรวจ `courses/<id>` และ `curriculum/<program>/<curriculumYear>/<year>/<semester>/courses/<id>` ทุกครั้ง

| Case | ขั้นตอน | ผลที่ต้องพิสูจน์ |
| --- | --- | --- |
| C01 | เพิ่ม QA-A 3 หน่วยกิต | เกิดหนึ่งรายการในสองตำแหน่ง; ยอดรายการ +3; reload แล้วยังอยู่ |
| C02 | เปลี่ยน QA-A เป็น 4 | ทั้งสองตำแหน่งเป็น 4; ยอดเพิ่มจากเดิมเพียง 1 |
| C03 | ลบ QA-A ที่สร้างใหม่ | สองตำแหน่งหาย; ยอดลด 4; reload/session อื่นไม่พบ |
| C04 | ลบวิชาที่มาจาก static | ไม่ปรากฏกลับผ่าน hybrid/fallback; ตรวจว่าการลบแค่ override คืนค่าเดิมหรือไม่ |
| C05 | ย้ายปี/เทอม | ไม่มีสำเนาเก่าค้าง; index ชี้ตำแหน่งใหม่; ยอดเทอมเก่าลดและเทอมใหม่เพิ่มเท่ากัน |
| C06 | เพิ่ม code ซ้ำในเทอมเดียว/ต่างเทอม/ต่างหลักสูตร | ไม่เขียนทับโดยเงียบ; แยก identity ตามขอบเขตที่ออกแบบ |
| C07 | เปลี่ยนชื่อ/code/หมวด/เงื่อนไข | รายการทุกหน้าตรงกัน; prerequisite references ไม่เสียโดยไม่มีแจ้งเตือน |
| C08 | ว่าง, 0, ติดลบ, ทศนิยม, NaN, code มี . # $ [ ] / | validation หรือ error ที่ชัดเจน; ไม่มี record ครึ่งหนึ่ง |
| C09 | กดบันทึกซ้ำเร็ว ๆ | ไม่มี duplicate หรือยอดเพิ่มสองครั้ง |

- [ ] เปิด Courses, CurriculumDashboard และ overview ของผู้แก้; จับค่าก่อน/หลังและหลัง reload
- [ ] เปิด session อีก role ค้างไว้ก่อนแก้; แยกผลการ sync ทันทีจากผลหลัง reload และระบุเวลาที่สังเกต
- [ ] แก้เงื่อนไขจากหน้าเฉพาะของ Admin/Staff ด้วย ไม่จำกัดเฉพาะ CourseManagement

## Task 4: เพิ่ม/แก้/ลบผู้ใช้

**Input:** test users **Output:** lifecycle ระหว่าง Auth/profile/ข้อมูลอ้างอิง

| Case | ขั้นตอน | ผลที่ต้องพิสูจน์ |
| --- | --- | --- |
| U01 | Admin เพิ่ม user พร้อม password | Auth UID ตรง profile key, role ถูก, login ใหม่ได้, Admin ยังอยู่ใน session เดิม |
| U02 | email ซ้ำ/รหัสผ่านไม่ผ่าน validation | แจ้งล้มเหลว, ไม่มี profile หรือ Auth ค้างเพิ่ม |
| U03 | บังคับ profile write ล้มเหลวหลัง Auth สำเร็จ | ตรวจ orphan Auth; retry ไม่ติด email ซ้ำโดยไม่มีทางกู้ |
| U04 | import user ไม่มี password | ตรวจว่าเป็น profile-only หรือบัญชี login ได้; UI ต้องไม่อ้างว่าสร้าง Auth สำเร็จ |
| U05 | แก้ email/role/isActive | เปรียบเทียบ Auth/profile และ login ด้วย email เก่า/ใหม่; ตรวจสิทธิ์ session เดิม |
| U06 | Admin ลบ test user | profile หาย; ตรวจ Auth แยกต่างหาก; login ใหม่และ session เดิมไม่มีสิทธิ์ตามสัญญาการลบ |
| U07 | login หลังลบ profile | ตรวจ AuthContext ว่าสร้าง profile กลับหรือไม่ |
| U08 | ลบ student/instructor ที่มี references | ตรวจ studyPlans, advisorId, logs ตามนโยบายเก็บประวัติ; แยก orphan จากข้อมูลที่ตั้งใจเก็บ |
| U09 | Staff เรียกเพิ่ม/ลบ user โดยตรง | ปฏิเสธ; ไม่มี Auth/profile ค้างจาก partial action |
| U10 | ลบตัวเอง/ผู้ดูแลคนสุดท้าย | มีการป้องกันหรือ workflow ที่กำหนดไว้; ไม่ทำให้ระบบไร้ผู้ดูแลโดยไม่แจ้ง |

## Task 5: ตรวจหน่วยกิตและข้อมูลที่คำนวณต่อ

**Input:** C01–C09 และแผนตัวอย่าง **Output:** ตาราง before/after แยกยอดทุกชนิด

- [ ] เริ่ม QA-A 3 + QA-B 2: รายการรวม 5; filter เหลือ QA-A ต้องแสดง 3 โดยเกณฑ์จบไม่เปลี่ยน
- [ ] QA-A 3 → 4: รายการรวมเป็น 6; ลบ QA-A แล้วเหลือ 2; เพิ่มคืนต้องไม่เพิ่มซ้ำจาก static/index
- [ ] ตรวจแผนที่มีอยู่ก่อนแก้, แผนใหม่หลังแก้, รายงาน/PDF, dashboard, progress และ chatbot metadata แยกกัน
- [ ] สำหรับแผนเดิม บันทึกว่าค่า credits snapshot เปลี่ยนหรือไม่; ตัดสิน PASS/FAIL หลังตอบนโยบายประวัติเท่านั้น
- [ ] ตรวจ completedCredits/GPA ด้วยเกรด A, F, S, U, I, W: S ผ่านและได้หน่วยกิตแต่ไม่เข้า GPA; F ไม่ผ่านแต่มีผลต่อ GPA ตามสูตรที่ระบบใช้; ค่าที่ไม่เข้า GPA ต้องไม่กลายเป็นศูนย์ในตัวหาร
- [ ] ทดสอบลบวิชา planned และ completed แยกกัน; ห้ามใช้ผลรวมรายการ catalog เป็นผลรวมแผนของนักศึกษาทั้งหมด
- [ ] ตรวจ cross-curriculum: แก้ IT-67 ต้องไม่เปลี่ยน IT-62 โดย lookup code เดียวกันโดยไม่ตั้งใจ

## Task 6: Failure, concurrency และการกู้คืน

- [ ] Emulator: อนุญาตเขียน curriculum แต่ปฏิเสธ courses แล้วทำ add/update/delete; ตรวจ partial write และ toast ของทุก operation
- [ ] ปิดเครือข่ายระหว่างบันทึก แล้วเปิดใหม่; แยก pending/local cache จาก server-confirmed data
- [ ] ให้ Admin และ Staff แก้วิชาเดียวกันพร้อมกัน และ delete แข่งกับ edit; บันทึก last write/lost update/resurrection
- [ ] ให้ auditLogs write ล้มเหลวหลัง mutation; แยกผลข้อมูลจริงจากผล log เพื่อไม่ให้ retry ซ้ำโดยเข้าใจผิด
- [ ] Reload หลังแต่ละ failure และอ่านข้อมูลด้วย connection อิสระ; ยืนยันว่า error ไม่ถูกกลืนเป็น success

## Task 7: สรุปข้อพบและจัดลำดับแก้

**Create during execution:** `docs/audits/firebase-crud-credit-audit.md`

- [ ] รายงานทุก case: actor, environment, commit, fixture IDs, ขั้นตอน, expected, observed, status, path ที่อ่าน, เวลา, screenshot/ผล read-back ที่ redact แล้ว
- [ ] แยกสถานะ Source risk / Reproduced in emulator / Verified in test project / Production unverified
- [ ] จัด P0 สิทธิ์สูงขึ้นหรือข้อมูลเสียวงกว้าง; P1 ลบไม่ครบ/ข้อมูลคืนกลับ/ยอดผิด/สำเร็จปลอม; P2 stale UI ที่ reload แล้วหาย
- [ ] ทุก bug ต้องมีวิธี reproduce และข้อเสนอแก้ขั้นต่ำ; เพิ่ม regression test ผ่าน UI/service จริงตอนลงมือแก้ ไม่ทดสอบ regex บน source
- [ ] สรุป coverage Admin/Staff × operation × Firebase path × credit consumer และรายการที่ยัง POLICY-PENDING/BLOCKED
- [ ] ล้างเฉพาะ fixtures ที่สร้างในการรันทดสอบตาม ledger และตรวจไม่เหลือ Auth/profile/plan ค้าง

## เกณฑ์จบ audit

ทุก case มีผลหรือเหตุผลที่ยังตรวจไม่ได้; ไม่สรุปว่าไม่มี bug เพียงเพราะ build ผ่าน ข้อมูลที่ลบต้องไม่กลับมาหลัง reload/login และค่าหน่วยกิตต้องตรงกับแหล่งข้อมูลและนโยบายที่ระบุ การแก้บั๊กเป็นงานต่อจากรายงาน ไม่อยู่ในคำขอเขียนแผนนี้

## Wayfinder: ลำดับคำตัดสิน

แผนนี้มีคำถามชัดพอสำหรับ audit เดียว จึงใช้ลำดับด้านล่างในไฟล์แทนสร้าง issue ภายนอก:

1. **ยืนยัน environment และสิทธิ์ที่คาดหวัง** → Task 1–2
2. **พิสูจน์ว่า CRUD เปลี่ยนข้อมูลครบหรือไม่** → Task 3–4
3. **กำหนดการรักษาประวัติหน่วยกิตและวิชาที่ถูกลบ** → คำถามเจ้าของระบบด้านบน; ไม่เดาคำตอบแทนผู้ใช้
4. **ตัดสินความสอดคล้องของยอดและลำดับแก้บั๊ก** → Task 5–7

ไม่มีการสร้าง ADR จนมีการเลือกนโยบายประวัติที่ยืนยันแล้ว; ใช้คำศัพท์เดิมใน CONTEXT.md ระหว่าง audit
