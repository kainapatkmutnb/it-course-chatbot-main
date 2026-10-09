# Mobile Navigation & Student QA

วันที่ตรวจ: 2026-09-13

Environment: local Vite (`http://localhost:8080/`) เชื่อม Firebase production project `it-chatbot-f663e` ตามที่ผู้ใช้ยืนยัน
สถานะ: build ผ่าน; browser responsive smoke tests ผ่านใน viewport emulation; ยังไม่ใช่การตรวจบนอุปกรณ์จริง

## สิ่งที่เปลี่ยน

- `src/components/layout/Header.tsx` เพิ่ม navigation Sheet สำหรับจอเล็ก ใช้รายการลิงก์เดียวกับ desktop, แสดงรายการตาม session/role, ปิดเมื่อเปลี่ยน route หรือขยายจอถึง desktop และปรับ header/profile ให้ย่อและตัดคำได้
- `src/components/dashboard/StudentDashboard.tsx` ให้ข้อมูลผู้ใช้ wrap ได้และแท็บแสดง 2 คอลัมน์บนจอแคบ
- `src/pages/Courses.tsx` ให้สรุปสถิติเปลี่ยนจำนวนคอลัมน์ตามความกว้าง
- `README.md` ปรับโครงสร้างและเนื้อหาให้อ่านง่ายและเป็นมืออาชีพขึ้น

## ผลทดสอบ

| กรณี | ผล |
| --- | --- |
| `/`, `/login`, `/register`, `/courses`, `/curriculum`, `/dashboard/student` ที่ความกว้างจำลอง 320, 375, 768 และ 1440 CSS px | ผ่าน: ไม่พบ horizontal page overflow; mobile menu แสดงใต้ 768px และ desktop navigation แสดงตั้งแต่ 768px |
| Dashboard ที่ 390px | ผ่าน: ไม่พบ horizontal overflow |
| Student dashboard ที่ 320px | ผ่าน: tabs เป็น 2 คอลัมน์; เปลี่ยน tab ได้และไม่มี overflow |
| Courses ที่ 320px / 375px | ผ่าน: summary grid ปรับเป็น 1 / 2 คอลัมน์ตามลำดับ ไม่มี page overflow |
| Mobile Sheet ที่ 640×375 | ผ่าน: เนื้อหาเมนูยาวกว่า viewport แต่เลื่อนภายใน Sheet ได้ |
| เปิด Sheet แล้วขยายเป็น desktop | ผ่าน: Sheet ปิดและ desktop navigation แสดงหลัง viewport เปลี่ยน |
| Student sign-up/login บน Firebase จริง | ผ่าน: สร้างบัญชี Student 2 บัญชีตามที่ร้องขอ, login แยกบัญชีและตรวจ dashboard แสดง role นักศึกษา; refresh แล้ว session/profile ยังคงถูกต้อง |
| `npm run build` | ผ่าน; มีคำเตือนเดิมเรื่อง static/dynamic import ปะปนและ bundle ใหญ่กว่า 500 kB |
| `git diff --check` | ผ่าน |
| ESLint เฉพาะไฟล์ที่เปลี่ยน | พบ error `no-explicit-any` ที่ `StudentDashboard.tsx:122` ซึ่งมีอยู่แล้วใน baseline; พบ warnings `react-hooks/exhaustive-deps` ที่ `Courses.tsx:66,76` ซึ่งอยู่นอกการแก้ครั้งนี้; ไม่แก้โค้ดนอกขอบเขตเพื่อกลบปัญหาเดิม |

## บัญชีทดสอบและข้อจำกัด

สร้างบัญชี Firebase จริง 2 บัญชีตามคำขอและเก็บไว้ใน project ดังกล่าว; ไม่บันทึกอีเมล/รหัสผ่านหรือ token ในรายงานนี้. ตรวจการสมัคร, logout/login และ role ผ่าน UI ของแอป; ไม่ได้ตรวจ Auth UID เทียบ document key โดยตรง เพราะไม่มีการอ่านข้อมูล Auth ด้วยสิทธิ์ admin.

การตรวจ responsive ใช้ browser viewport emulation ไม่ใช่มือถือจริง. ยังไม่ได้ยืนยันครบเรื่อง keyboard focus return/Tab trap, zoom 200%, software keyboard, reduced-motion หรือ role Admin/Staff/Instructor. รายการเหล่านี้ต้องตรวจเพิ่มเติมก่อนอ้างว่าผ่านครบตามแผน.

## เปิดแอป

จาก repository root รัน `npm run dev -- --host 127.0.0.1`; Vite dev server ยังคงเปิดใน session นี้ที่ `http://localhost:8080/`. บัญชี Firebase ที่สร้างเป็นข้อมูลจริงและไม่ได้ลบ. ผู้ใช้ควรเปลี่ยนรหัสผ่านที่ใช้ร่วมกัน/คาดเดาง่ายเป็นรหัสผ่านเฉพาะและแข็งแรง.
