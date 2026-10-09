# Modern Academic Web Redesign

## ข้อสรุปจากผู้ใช้

- ต้องการเว็บที่ดูมืออาชีพ modern และไม่ดูเป็น AI template
- ยืนยันแนว **มหาวิทยาลัยร่วมสมัย**: ขาว กรมท่า น้ำเงิน อ่านไทยง่าย ลด gradient และการ์ดซ้ำ
- ยืนยันขอบเขต **ทั้งเว็บ แบ่งเป็นระยะ** รวม Student, Admin, Staff, Instructor และ Chatbot
- ฟีเจอร์และการทำงานเดิมต้องคงอยู่
- รอบนี้ส่งมอบแผนสำหรับตรวจทาน

Design read: ปรับเว็บบริการการศึกษาสำหรับนักศึกษาและบุคลากรให้เชื่อถือได้ อ่านง่าย และใช้ทำงานประจำวันสะดวก ด้วยระบบ UI เดิมของโครงการ

โหมด: Redesign - Preserve. หน้า public ใช้ DESIGN_VARIANCE=4, MOTION_INTENSITY=2, VISUAL_DENSITY=4; หน้าทำงานเน้นความหนาแน่นของข้อมูลตามงานจริง ไม่ใช้เกณฑ์หน้าโฆษณามาตัดทอนตาราง

## หลักฐานและขอบเขตความมั่นใจ

Baseline: `2d593e4` บน `Kainapat-manage-course`. สำรวจ source, theme, route, assets, domain docs และรายงาน QA เดิม. รอบวางแผนนี้ลองเปิด localhost:8080 แล้วพบ connection refused จึงไม่ได้อ้างว่ามีผล visual/runtime audit รอบใหม่. Implementation ต้องเก็บภาพก่อนแก้อีกครั้ง

ระหว่างวางแผนมีงานเอกสารจากอีกงานเข้ามาถึง commit `92a58c4` รวม README/CONTEXT/diagrams; source UI ที่ใช้วางแผนยังตรงกับ baseline เดิม. ไม่รวมการแก้ README ที่กำลังดำเนินอยู่จากงานนั้นในขอบเขตรอบนี้

| จุดที่พบ | หลักฐาน | ผลต่อแผน |
| --- | --- | --- |
| Gradient น้ำเงินม่วงและเงาหลายระดับ | `src/index.css` | ลดเฉพาะพื้นผิวที่ redesign ผ่าน styles ที่ตั้งชื่อชัดเจน |
| Hero เป็นกล่อง Bot ขนาดคงที่ 384px และข้อความ AI/24/7 | `src/pages/Home.tsx` | เปลี่ยนเป็นภาพหน้าจอผลิตภัณฑ์จริงจากข้อมูลทดสอบ ไม่สร้างตัวเลขหรือ UI ปลอม |
| แถว feature และ role เป็นการ์ดตกแต่งซ้ำ | `src/pages/Home.tsx` | จัดลำดับหัวข้อใหม่ด้วยระยะห่างและกลุ่มข้อมูล คงข้อมูลความสามารถและบทบาท |
| หน้าสมัคร/เข้าสู่ระบบมี gradient และกรอบซ้อน | `src/pages/Login.tsx`, `src/pages/Register.tsx` | ฟอร์มพื้นขาวบนพื้นเทาอ่อน คงลำดับช่องและ handlers |
| Font rules หลายชั้น | `src/index.css`, `tailwind.config.ts` | ใช้ Sukhumvit Set ที่มีอยู่ ไม่รื้อ global font cascade ในงานนี้ |
| Admin tabs 6 คอลัมน์ตลอด, Staff tabs 3 คอลัมน์ตลอด | `AdminDashboard.tsx`, `StaffDashboard.tsx` | จัด tabs ให้เลื่อนภายในบนจอแคบและอ่านชื่อได้ครบ |
| Student tabs แก้ responsive แล้ว | `StudentDashboard.tsx` | คง 2 คอลัมน์มือถือ / 4 คอลัมน์ desktop |
| แผนผังใช้พิกัดและความกว้างคำนวณ | `CurriculumTimelineFlowchart.tsx`, `StudyPlanProgress.tsx` | ปรับกรอบและ toolbar ก่อน คงขนาด node/เส้นและการเลื่อนแผนผัง |
| Chat มี Modern Academic styling แล้ว | `ChatBot.css`, spec วันที่ 2026-09-12 | ปรับให้เข้าชุดและตรวจ selector จริง ไม่สร้าง chat provider ใหม่ |
| Export PDF ใช้ html2canvas clone | `src/utils/exportPdf.ts` | CSS สำหรับ screen ก็อาจกระทบ PDF ต้องตรวจ PDF แยกจาก browser print |
| Timeline เรียก cleanup ฐานข้อมูลเมื่อ mount | `CurriculumTimelineFlowchart.tsx:33` | baseline และ regression ของหน้าหลักสูตร/role ใช้ Emulator เท่านั้น |

## ระบบภาพ

| องค์ประกอบ | ข้อกำหนด |
| --- | --- |
| สี | พื้นหน้า `#f8fafc`, พื้นเนื้อหา `#ffffff`, ตัวอักษรกรมท่า `#0b1637`, ข้อความรอง `#475569`, action blue จาก primary เดิม `#2563eb` |
| สีสถานะ | คง success/warning/error และความหมายของเกรด/สถานะวิชา; ไม่เปลี่ยนทุกสถานะเป็นน้ำเงิน |
| ตัวอักษร | Sukhumvit Set เดิม; body 16px line-height 1.65, label 14px, heading หน้า 28-36px, hero 32-48px; ไม่ใช้ negative tracking กับข้อความไทยยาว |
| ตัวเลข | tabular numerals เฉพาะตัวเลขหน่วยกิต/GPA/สถิติที่มีอยู่; คงทศนิยมและสูตรเดิม |
| ระยะ | 8/12/16/24/32/48/64px; หน้าทำงาน padding 16px บนมือถือ, 24-32px บน desktop |
| มุม | controls 8px, panels 12px, modal/chat 16px; badge ที่สื่อสถานะใช้รูปเดิมได้ |
| เงา | กรอบเนื้อหาทั่วไปไม่มีเงาหนัก; เงาเฉพาะ overlay/popover/chat ที่ต้องแยกชั้น |
| Motion | สี/เส้นขอบ 150-180ms; ไม่มีการลอย/pulse/scroll hijack ในเนื้อหา; loading ที่สื่อการทำงานจริงยังคงอยู่ |
| Icons | ใช้ Lucide ที่ติดตั้งอยู่ให้สม่ำเสมอ; ไม่เพิ่มไลบรารีเพื่อเปลี่ยนหน้าตาอย่างเดียว |
| Theme | รักษาหน้า light เดิมเป็นหลักและรองรับ `.dark` ที่มีอยู่; ไม่เพิ่ม toggle หรือเปลี่ยน preference ผู้ใช้ |
| รูปภาพ | ภาพหน้าจอของเว็บจริงจาก Emulator พร้อมคำว่า “ตัวอย่างหน้าจอ”; ไม่ใช้ภาพนักศึกษาหรือสถานที่ที่สร้างขึ้นมาอ้างว่าเป็นมหาวิทยาลัยจริง |

## รูปแบบแต่ละพื้นที่

### หน้าแรก

Desktop: ข้อความซ้าย 5 ส่วน + ภาพหน้าจอจริงขวา 7 ส่วนใน grid 12 ส่วน. บนมือถือเรียงข้อความ ปุ่ม แล้วภาพ. Hero ไม่มีความสูงบังคับเต็มจอ; ปุ่มสำคัญเข้าถึงได้โดยไม่ต้องผ่านเนื้อหาตกแต่งยาว

คงชื่อ IT Assistant, tagline และข้อความอธิบายเดิมในรอบ styling. CTA เดิมไปสมัคร/เข้าสู่ระบบสำหรับ Guest และ dashboard ตาม role สำหรับผู้เข้าสู่ระบบ. ใช้ปุ่มหลักทึบเพียงปุ่มเดียวต่อกลุ่ม อีกปุ่มเป็น outline. ส่วน features คงครบสี่รายการ จัดเป็นกลุ่มสองคอลัมน์แบบเรียบ. ส่วน roles คงสี่บทบาทและรายการความสามารถ แต่ลดการ์ดซ้อนและไอคอนตกแต่งซ้ำ

ภาพแสดงหลักสูตรที่ระบบแสดงจริงบน Emulator; ไม่แสดงชื่อ/อีเมลผู้ใช้หรือข้อมูลจริง. เก็บเนื้อหาอธิบายที่เคยอยู่ในภาพประกอบเดิมในบริบท supporting copy หากจำเป็น ไม่สร้างข้ออ้างด้านความแม่นยำหรือ uptime ใหม่

### Navigation / footer

คง logo/wordmark, route, ชื่อเมนู, active link, avatar, logout และ mobile Sheet. ปรับพื้น header ให้ทึบและอ่านชัด ลด backdrop/เงา. Footer คงข้อมูลติดต่อ ลิงก์ และตำแหน่ง Chatbot. ไม่ย้าย mount ของ ChatBot ตาม route เพราะอาจรีเซ็ต session

### Auth

ฟอร์มหนึ่งคอลัมน์กว้างไม่เกิน 448px, labels ชัด, input อย่างน้อย 44px, errors อ่านได้. คง Google sign-in, email sign-in, conditional studentId, password confirmation, disabled/loading และ redirect เดิมทุกจุด

### หลักสูตร / Student

เรียงหัวข้อ -> filters -> เนื้อหา -> summary ตามโครงสร้างเดิม. ใช้กรอบเบาและ type hierarchy สม่ำเสมอ. แท็บ แผนการเรียน เกรด ชื่อ/รหัสวิชา custom ภาคฤดูร้อน ปี 1-8 และสถานะวิชายังคงครบ. แผนผังเลื่อนได้ภายใน ไม่บีบตัวหนังสือเพื่อทำให้ทุกวิชาพอดีมือถือ

### Admin / Staff / Instructor / Analytics

หัวข้อและ action ของหน้านั้นชัดเจน. Stats ไม่แย่งสายตาจากงานหลัก. Tabs/filters ไม่ถูกซ่อนเมื่อจอแคบ. ตารางคงจำนวนรายการและทุก action; เลื่อนในกรอบได้. เปลี่ยนสองคอลัมน์ในฟอร์ม add/edit เป็นหนึ่งคอลัมน์บนมือถือ. แยกสิทธิ์ตาม component เดิม ไม่รวมหน้าของแต่ละ role ให้มี controls เกินสิทธิ์

### Chatbot / notifications

คง navy header, bubbles, composer, launcher, feedback และนโยบาย PDPA. ลดรายละเอียดตกแต่งที่ชนกับรูปแบบรวมอย่างระมัดระวัง. Toast อยู่ขวาบน, chatbot อยู่ขวาล่าง. ห้าม feedback หรือ overlay ทับ composer/ปุ่มปิด. Selector ของ n8n ต้องตรวจจาก DOM เวอร์ชันที่ติดตั้ง ไม่เดา class ใหม่

## ขอบเขตการเปลี่ยนที่อนุญาต

- CSS, className, presentational wrappers, การจัดวางและขนาดที่ไม่เปลี่ยนลำดับงาน
- ภาพจริงสำหรับหน้าแรก, alt text และคำอธิบายภาพ
- คง component type, ref, key, props, values, onClick/onSubmit/onChange, effect และ conditional rendering ของ controls
- คง route URLs, auth/permissions, database paths, data schema, Firebase rules, n8n payload, calculations, validation, import/export และ PDF DOM
- ไม่เปลี่ยน UI library/framework หรือเพิ่ม animation dependency
- ไม่เพิ่ม feature อย่าง forgot-password, bulk action, live uptime, chatbot suggestion ที่กดแล้วเกิดคำสั่งใหม่ในงาน redesign นี้

## วิธีพิสูจน์ว่า feature ไม่ถดถอย

เก็บ baseline ด้วยข้อมูลชุดเดิม -> ปรับหนึ่งพื้นที่ -> รันพฤติกรรมเดิมซ้ำ -> เปรียบเทียบค่าและสิทธิ์ -> ตรวจภาพทุกขนาด -> ตรวจ build/diff -> บันทึกผล. รูปที่ดูดีและ build ผ่านอย่างเดียวไม่ถือว่า feature parity ผ่าน

ครอบคลุม Guest และทั้งสี่ role, loading/empty/error/success, refresh/persistence, 320/375/390/768/1024/1440px, keyboard และ reduced motion, มือถือ landscape/software keyboard, browser print และ PDF export. เก็บสถานะ PASS/FAIL/BLOCKED แยกรายกรณี ไม่สรุปว่าผ่านเมื่อไม่มี environment สำหรับตรวจ

## การแบ่งระยะ

1. Baseline และระบบภาพแบบ opt-in: จำกัด CSS ให้ตรวจและย้อนกลับได้เป็นจุด
2. หน้า public: Header/Footer, Home, Login/Register/404
3. หน้าหลักสูตรและ Student: ตัวกรอง แผนการเรียน แผนผัง และขอบหน้ารายงาน
4. หน้าบุคลากร: Admin/Staff/Instructor, student detail และ analytics
5. Chatbot/overlay และตรวจทั้งระบบ: message/feedback, responsive, accessibility, persistence, export

แต่ละระยะต้องผ่านกรณีใช้งานของตัวเองก่อนเริ่มระยะถัดไป. แผนลงมืออยู่ใน `../plans/2026-09-13-modern-academic-web-redesign.md`

## เอกสารประกอบ

- `CONTEXT.md` และ ADR-001 ถึง ADR-006: ภาษาของระบบและเงื่อนไขการทำงานเดิม
- `docs/superpowers/specs/2026-09-12-modern-academic-chatbot-design.md`: แนว chat ที่ทำไว้แล้ว
- `docs/audits/mobile-navigation-student-qa.md`: ผลและช่องว่างการทดสอบ mobile เดิม

คำใน CONTEXT ที่บอก StudyPlan เป็น 4 ปีไม่ใช่เหตุให้ลบปี 5-8; ใช้พฤติกรรมปัจจุบันและ ADR-001 เป็น baseline. ข้อผิดพลาดเดิมนอกงานภาพให้บันทึกแยก ไม่แก้ logic ไปพร้อม redesign
