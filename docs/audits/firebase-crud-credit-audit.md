# Firebase CRUD and Credit Consistency Audit

วันที่ตรวจ: 2026-09-12  
Branch: `Kainapat-manage-course`  
Baseline commit: `0651131fddc30ef916c1486b1f5454dc8f517e4c`  
Environment: Firebase Auth + Realtime Database Emulator, project `demo-it-course-chatbot`; rules loaded from repository `database.rules.json`. **ผลทั้งหมดเป็น emulator เท่านั้น; rules ที่ deploy จริงยังไม่ได้ยืนยัน.**

## สรุป

พบข้อผิดพลาดที่ reproduce ได้ 3 รายการใน Emulator:

1. **[P1 security] ผู้ใช้ยกระดับ role ของตัวเองเป็น admin ได้** โดยเขียน `/users/<ownUid>/role` ผ่าน Database REST API ด้วย Staff token; read-back ยืนยัน role เป็น `admin`.
2. **[P1] Admin อ่านรายการผู้ใช้ไม่ได้**: `GET /users.json` ได้ HTTP 401 แม้ Admin อ่าน profile ของตัวเองได้. Admin dashboard จึงแสดง 0 users/รายการว่าง พร้อม Permission denied ใน console.
3. **[P1] เพิ่มวิชาด้วย course code ที่มี `#` แสดง toast ว่าสำเร็จทั้งที่เขียนไม่สำเร็จ**: UI แสดงรายการชั่วคราว แต่ Firebase ไม่มี record. Service คืน failure และ log error; handler ไม่ตรวจผลก่อนแสดง success.

สิ่งที่ผ่าน: Admin เพิ่ม/แก้/ลบวิชาทดสอบผ่าน UI ได้; course และ curriculum index ตรงกัน, 3 → 4 หน่วยกิตเปลี่ยนทั้งคู่, delete หายจากทั้งคู่ และหลัง reload ไม่กลับมา. Staff ที่มี role `staff` เขียน/อ่าน/ลบ course paths โดยตรงได้ตาม rules; Student เขียน course ไม่ได้ (HTTP 401).

ยังไม่สรุป User lifecycle ผ่าน/ไม่ผ่านแบบ E2E, Staff UI, downstream credit displays, static fallback, concurrency และ failure-injection. ไม่มีการเปลี่ยนแปลง production Firebase, deploy rules หรือ commit.

## ขอบเขต/ความปลอดภัย

- ปฏิบัติตาม `docs/superpowers/plans/2026-09-12-firebase-crud-audit.md`; ไม่แก้ business logic.
- เพิ่มเฉพาะ local Emulator/test-mode configuration เพื่อทำ QA; `src/config/firebase.ts` ปฏิเสธ emulator flag หากไม่ใช่ Vite `test` mode หรือ project id ไม่ขึ้นต้น `demo-`.
- ใช้ localhost ports Auth `9099` และ Database `9000`; rules ที่โหลดคือ `database.rules.json`. ไม่ใช้ `.env` สำหรับ mutation.
- ไม่รัน `test-course-sync.js`, `test-course-edit.js` หรือ `test-all-fixes.js`; ไม่ deploy rules/push/commit.
- บัญชี/ข้อมูลที่สร้างอยู่ใน Emulator เท่านั้น; หยุด Emulator หลังทดสอบแล้ว ข้อมูลใน Emulator memory จึงไม่คงอยู่.
- ไม่บันทึก email, password, ID token หรือข้อมูลผู้ใช้ลงรายงาน.

## Environment และการตรวจสอบ

| Check | ผล |
| --- | --- |
| Node.js | `v26.5.1` |
| Emulator config | เพิ่ม `firebase.json`, `.env.test`, `dev:emulator` และ `firebase:emulators` scripts |
| Rules load | ยืนยัน Emulator โหลด `database.rules.json` บน namespace `demo-it-course-chatbot-default-rtdb` |
| App connection | Auth/Realtime Database เชื่อม localhost เฉพาะ test mode; browser UI เข้าถึง Emulator |
| Production build | `npm run build` ผ่าน; มีคำเตือนเดิมเกี่ยวกับ dynamic import/chunk ขนาดใหญ่ |
| `git diff --check` | ผ่าน |
| Production/deployed rules | ไม่ได้แตะ/ไม่ทราบสถานะ |

### Debugging breadcrumb: namespace probe ที่ทิ้งผล

การ probe รอบแรกชี้ Database namespace `demo-it-course-chatbot` แต่ Firebase CLI โหลด rules ไปยัง `<project>-default-rtdb`; namespace แรกจึงไม่ได้รับ rules และไม่ใช่หลักฐานของสิทธิ์จริง. ยกเลิกผล probe นั้น, แก้ URL เป็น `demo-it-course-chatbot-default-rtdb`, restart Emulator และทำกรณีที่รายงานข้างล่างซ้ำภายใต้ rules ที่ยืนยันแล้ว. ไม่มีข้อสรุปด้าน Student/role escalation อิงจาก probe ที่ผิด namespace.

## ผลตามกรณีทดสอบ

สถานะ `PASS`/`FAIL` ด้านล่างหมายถึงผลกับ Emulator ที่ใช้ rules ใน repository เท่านั้น ไม่ได้ยืนยัน behavior บน production.

| Case | Actor / ขั้นตอน | หลักฐานและผล | สถานะ |
| --- | --- | --- | --- |
| Permission: self role edit | Staff token เขียน role ของ UID ตนเป็น `admin` | REST write accepted; read-back `/users/<uid>/role` เป็น `admin`. ดู `database.rules.json:4–7` | **FAIL — P1 security** |
| Permission: list users | Admin อ่าน `/users.json`; อ่าน self profile แยก | parent GET 401; self-profile GET สำเร็จ. UI user list/count ว่างและ console มี Permission denied | **FAIL — P1** |
| Permission: course write | Staff เขียน/อ่าน/ลบ course + curriculum path โดยตรง | ทั้ง paths มีข้อมูลตรงกัน; ลบ fixture แล้ว read-back เป็น null | PASS (direct rules API เท่านั้น) |
| Permission: student course write | Student token PUT course fixture | HTTP 401; ไม่มี record | PASS |
| C01: add QA-A 3 credits | Admin UI เพิ่ม `QA-A-2026` | success; independent read-back ที่ `/courses/<id>` และ curriculum path มี record ตรงกัน หน่วยกิต 3 | PASS |
| C02: update 3 → 4 | Admin UI แก้ QA-A | success; independent read-back สอง path เป็น 4; หลัง reload/reselect UI แสดง 4 | PASS |
| C03: delete QA-A | Admin UI ลบ QA-A และยืนยัน dialog | read-back สอง path เป็น null; หลัง reload/reselect วิชาไม่กลับมา | PASS |
| C08: invalid key `QA#FAIL` | Admin UI เพิ่ม course code ที่ Firebase path ใช้ไม่ได้ | Firebase service log ระบุ invalid path; independent read-back ไม่พบ record; UI กลับแสดง course/count ชั่วคราวและ toast success | **FAIL — P1 false success** |
| User add/delete Auth + profile | Admin UI lifecycle ใน namespace ที่ rules ถูกต้อง | **ยังทดสอบไม่ครบ**; list-users ถูก rules ปฏิเสธ จึงยังยืนยัน Auth/profile coupling และ delete/login ไม่ได้ | BLOCKED |
| Staff UI CRUD | Staff sign-in แล้วจัดการวิชาผ่าน UI | ยังไม่ได้ยืนยัน UI lifecycle ครบ (มีเพียง direct rules API) | BLOCKED |
| C04–C07, C09 | static fallback, ย้ายเทอม, duplicate, metadata, double-submit | ไม่ได้ทดสอบ | BLOCKED |
| Credit consumers | catalog total/filter, StudyPlan, completed credits/GPA, report/PDF, progress, chatbot | catalog record เดียวเปลี่ยน 3 → 4 บน index paths; downstream views/fixtures ไม่ได้ทดสอบ | BLOCKED / POLICY-PENDING |
| Fault/concurrency/retry/audit log | partial writes, offline, competing Admin/Staff, log failure | ไม่ได้ทำ fault injection | BLOCKED |
| Cleanup | Emulator fixtures | Emulator process ถูกปิดหลังทดสอบ; ไม่มี production fixture | PASS (Emulator reset by stop) |

## รายละเอียดข้อพบ

### 1. Role escalation ผ่าน own profile (P1 security)

Database rules อนุญาตให้ authenticated user เขียน `/users/$uid` ของตัวเองได้ (`database.rules.json:4–7`) ซึ่งรวม `role`. ทดสอบด้วย Staff ID token และแก้เฉพาะ `role` ของตัวเอง; write สำเร็จและ read-back เป็น `admin`. นอกจากนี้ signup code กำหนด role จาก email pattern (`src/types/auth.ts:95–130`; flow `src/contexts/AuthContext.tsx:336–379`), จึงควรตรวจว่าการสมัครไม่สามารถขอ role สูงผ่าน email ได้ด้วย. ผลนี้ชี้ rules file ใน repo เท่านั้น ไม่ยืนยัน rules ที่ deploy.

### 2. Admin user listing ถูกปฏิเสธ (P1)

UI `getUsers()` อ่าน `/users` (`src/services/firebaseService.ts:59`), แต่ rules อนุญาต read ที่ child `/users/$uid` ולא parent; Admin `GET /users.json` ได้ 401, ขณะที่ self profile path อ่านได้. UI แสดงรายการว่าง/0 แทน error ที่ชัดเจน. User management CRUD จึงไม่สามารถถือว่าทำงานได้จนกว่า list path/access/error behavior จะได้รับการแก้และทดสอบใหม่.

### 3. Course add success ปลอม (P1)

`CourseManagement` ไม่ตรวจ boolean ที่ `firebaseService.addCourse` คืน (`src/components/dashboard/CourseManagement.tsx:214–289`; service `src/services/firebaseService.ts:426–446`). course code `QA#FAIL` ทำให้ Firebase path invalid; service ล้มเหลว แต่ UI แสดง success และ optimistic row. Reload/read-back ยืนยันว่าไม่ได้ถูกบันทึก. กรณี update/delete failure และ partial write ยังต้อง fault-inject.

### Source risk: ลบ profile ไม่ได้ลบบัญชี Auth

`firebaseService.deleteUser` ลบ `users/<userId>` ใน Realtime Database เท่านั้น (`src/services/firebaseService.ts:304–312`); Firebase Auth Account เป็นคนละ entity กับ User Profile. ยังไม่มีผล E2E ใน namespace ที่ถูกต้องยืนยันลำดับ delete/login; ห้ามสรุปว่าลบบัญชี Auth จริงจากการเห็น profile หาย.

### Source risk: course writes ไม่ atomic

add/update/delete ปรับ `curriculum/.../courses/<id>` และ `courses/<id>` ทีละ operation (`src/services/firebaseService.ts:426–484`). ยังไม่ได้บังคับให้ operation หนึ่งล้มเหลวเพื่อพิสูจน์ partial state; คงสถานะ source risk.

## เครดิตและนโยบายที่ต้องยืนยัน

การทดสอบนี้ยืนยันเฉพาะว่าแก้ catalog QA-A จาก 3 เป็น 4 แล้วค่าทั้งสอง database paths ตรงกัน. **ไม่ได้**ยืนยันยอดหน่วยกิตรวมทุกหน้า หรือการแก้แผนเดิม, credits passed, GPA, report/PDF หรือ chatbot metadata.

ต้องให้เจ้าของระบบตัดสินก่อนสรุปผล:

- แก้ catalog credits แล้วแผน/ผลการเรียนเก่าควรคง snapshot หรือ sync ตาม catalog?
- ลบวิชาที่มีผลเรียนแล้วควร retire/inactivate หรือ hard delete?
- Staff มีสิทธิ์จัดการผู้ใช้หรือไม่? การตรวจนี้ยึด baseline ว่า Admin จัดการ users, Staff จัดการ courses.

กรณีขึ้นกับนโยบายเหล่านี้คงสถานะ **POLICY-PENDING**.

## การติดตามต่อ

1. แก้และทดสอบ rules ป้องกันผู้ใช้แก้ role/สิทธิ์ของตน; ตรวจการกำหนด role ตอน signup.
2. ออกแบบ parent read/list users ให้สอดคล้องกับสิทธิ์ Admin และทำให้ UI แยก permission error จาก empty state.
3. ตรวจผลลัพธ์ service ก่อน toast/optimistic success; validate Firebase key characters; ทดสอบ add/update/delete failures และ partial writes.
4. รัน U01–U10 ใน Emulator หลัง user-list permission ถูกกำหนด; ตรวจ Auth account, DB profile, login/session และ references แยกกัน.
5. รัน Staff UI CRUD, remaining C01–C09, credit matrix และ downstream pages เมื่อได้ fixtures/นโยบาย.
6. ตรวจ rules deploy จริงผ่านกระบวนการแยกและมี authorization; audit นี้ไม่ได้อ่าน/แก้ production.

**ข้อสรุป:** พบ bugs ที่มีหลักฐาน reproduce ใน local Emulator; ไม่ควรใช้ผลนี้อนุมานว่าระบบ production ปลอดภัยหรือผิดแบบเดียวกัน เพราะไม่ได้ยืนยัน deployed rules/config. Build ผ่านไม่ได้ลบล้างข้อพบ runtime เหล่านี้.
