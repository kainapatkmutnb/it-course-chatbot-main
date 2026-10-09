# Modern Academic Web Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task, or subagent-driven-development when the user selects delegated execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับทั้งเว็บเป็นแนวมหาวิทยาลัยร่วมสมัยที่ดูมืออาชีพ อ่านไทยง่าย และรักษาฟีเจอร์เดิมของทุก role

**Architecture:** ใช้ React/Tailwind/shadcn เดิมและเพิ่ม stylesheet แบบ opt-in ผ่าน semantic classes เฉพาะชิ้นที่ redesign. ทยอยปรับ public pages, academic workspace, staff workspace และ chat โดยคง handlers, state, data services และ report DOM. แยก visual verification จาก behavioral verification ด้วย baseline ใน Emulator

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui + Radix, Lucide, Firebase Auth/Realtime Database Emulator, @n8n/chat, html2canvas/jsPDF

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-13-modern-academic-web-redesign.md`; ผู้ใช้ยืนยันแนวมหาวิทยาลัยร่วมสมัยและทั้งเว็บแบ่งเป็นระยะ
- Baseline ที่สำรวจคือ `2d593e4` บน `Kainapat-manage-course`; ตรวจสถานะจริงเมื่อเริ่ม execution
- คง navy/blue/white CI, logo/wordmark และ Sukhumvit Set ที่มีอยู่
- คง routes, navigation labels, form field order/IDs, refs, component keys, event handlers, validation และ role visibility
- ไม่แก้ `src/services/`, `src/hooks/`, `src/contexts/`, `src/types/`, `src/config/`, database rules หรือ n8n metadata เพื่อทำงานภาพ
- ไม่ upgrade packages/framework และไม่เพิ่ม UI/animation library
- ไม่เปลี่ยน global primitives ทุกจุดพร้อมกัน; `button.tsx`, `card.tsx`, `input.tsx`, `tabs.tsx` คง API และ default classes เดิม ใช้ opt-in class ใน consumer
- ไม่เพิ่ม global `overflow-x:hidden` เพื่อซ่อน layout ที่ล้น
- ไม่เปลี่ยน subtree ของ `reportRef`, `.pdf-section`, `.semester-card`, `.signature-section` หรือ `src/utils/exportPdf.ts`
- CSS แบบ `@media screen` ยังมีผลต่อ html2canvas จึงต้องตรวจ PDF ที่สร้างจริงด้วย ไม่ใช้ print preview แทน
- ทดสอบ role/curriculum ใน Emulator: timeline mount เรียก `cleanupInvalidCurriculumEntries()` อยู่แล้ว; ไม่โหลด production เพื่อเก็บภาพ baseline
- เก็บทุกฟีเจอร์เดิม แม้ไม่เห็นในหน้าแรก เช่นปี 5-8, summer, custom elective names, import/export และ feedback
- สถานะเดิมที่ทำงานไม่ผ่านให้บันทึก baseline; redesign ห้ามอ้างว่าแก้แล้วเพียงเพราะปุ่มดูดีขึ้น
- รอบเขียนแผนไม่เปลี่ยน source UI, Firebase, commit หรือ push; commit messages ด้านล่างเป็นจุดตรวจตอนลงมือ

## File map / การแบ่งระยะ

| ระยะ | Files | ความรับผิดชอบ |
| --- | --- | --- |
| 1 | Create `src/styles/academic-ui.css`; modify `src/main.tsx`, `src/App.tsx` | styles ใหม่และ root scope เท่านั้น |
| 2 | `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx` | shared navigation/footer |
| 2 | `src/pages/Home.tsx`; create `src/components/home/HomeOverview.tsx`, `public/images/academic-course-preview.webp` | หน้าแรกและภาพจากแอปจริง |
| 2 | `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/NotFound.tsx` | public form shells / 404 |
| 3 | `src/pages/Courses.tsx`, `src/pages/CurriculumDashboard.tsx`, `src/components/curriculum/CurriculumFlowchart.tsx`, `src/components/curriculum/CurriculumTimelineFlowchart.tsx` | filter/header/กรอบแผนผัง |
| 3 | `src/components/dashboard/StudentDashboard.tsx`, `src/components/study-plan/StudyPlanManager.tsx`, `src/components/study-plan/StudyPlanProgress.tsx` | academic workspace; ไม่แตะ report markup |
| 4 | `src/components/dashboard/AdminDashboard.tsx`, `src/components/dashboard/StaffDashboard.tsx`, `src/components/dashboard/CourseManagement.tsx` | admin/staff tabs, forms, panels |
| 4 | `src/components/dashboard/InstructorDashboard.tsx`, `src/components/dashboard/StudentDetailView.tsx`, `src/components/dashboard/ChatAnalyticsDashboard.tsx` | advisee lists/detail/analytics |
| 5 | `src/components/chat/ChatBot.css` | styles ของ widget ที่มีอยู่; ไม่มี provider rewrite |
| ทุกระยะ | Create `docs/audits/modern-academic-web-redesign-qa.md` | evidence, PASS/FAIL/BLOCKED และ baseline differences |
| ปิดงาน | `README.md` | ลิงก์แผนและผลทดสอบจริง |

โครงสร้าง task ด้านล่างเป็นลำดับเดียว ไม่ให้สองคนแก้ `academic-ui.css` พร้อมกัน. แต่ละ task มีผลส่งมอบที่ตรวจแยกได้ ไม่ย้าย logic ของไฟล์ใหญ่เพียงเพื่อทำให้ไฟล์เล็กลง

## Task 1: Baseline ที่เปรียบเทียบซ้ำได้

**Files:** Read `package.json`, `firebase.json`, `src/config/firebase.ts`, `src/App.tsx`, `CONTEXT.md`, ADR-001 ถึง ADR-006; create `docs/audits/modern-academic-web-redesign-qa.md`

**Interfaces:** Consumes repository baseline and existing UI; produces before screenshots, behavior results and test dataset IDs. ไม่มี production mutation

- [ ] ตรวจ source version และ working tree:

```powershell
git status --short --branch
git rev-parse HEAD
npm run build
git diff --check
```

Expected: build สำเร็จ; บันทึกคำเตือนและไฟล์ที่มีการแก้อยู่แล้ว. Repository ไม่มี npm test script ใน baseline นี้

- [ ] เตรียม `.env.test.local` เฉพาะเครื่องด้วยค่าต่อไปนี้; ไฟล์นี้ถูก ignore อยู่แล้ว. ถ้ามีไฟล์เดิมให้ตรวจ/รวมค่า ไม่เขียนทับโดยไม่อ่าน

```dotenv
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_API_KEY=demo-redesign-key
VITE_FIREBASE_AUTH_DOMAIN=demo-it-course-chatbot.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-it-course-chatbot
VITE_FIREBASE_STORAGE_BUCKET=demo-it-course-chatbot.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:redesign
VITE_N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/redesign-qa/chat
VITE_N8N_SUMMARY_WEBHOOK_URL=http://127.0.0.1:5678/webhook/redesign-qa/summary
```

ใช้ n8n workflow ทดสอบบนเครื่องเมื่อพร้อม; URL นี้ไม่ถือว่ามี server อยู่แล้ว. ถ้าไม่มีให้ตรวจ error state และทำเครื่องหมาย successful-chat/feedback integration เป็น BLOCKED จนมี local test endpoint ที่ทำงานได้. ไม่ fallback ไป production

- [ ] เปิด Emulator และ frontend คนละ terminal:

```powershell
npm run firebase:emulators
npm run dev:emulator -- --host 127.0.0.1 --port 8081 --strictPort
```

Expected: Auth 9099, Database 9000 และ app 8081; test-mode guard ยอมรับ demo project. ตรวจ requests ว่าชี้ localhost จริงก่อนทำรายการ. Emulator UI ถูกปิดใน `firebase.json`; ไม่สมมติว่ามี UI ที่ port 4000

- [ ] สร้างผู้ใช้ทดสอบทั้งสี่ role เฉพาะ Emulator ด้วย REST และ profile ที่จับคู่ UID. รันใน PowerShell สำหรับ fixture session นี้:

```powershell
$qaPassword = [guid]::NewGuid().ToString('N')
$qaRoles = @('student', 'instructor', 'staff', 'admin')
foreach ($qaRole in $qaRoles) {
  $qaEmail = "redesign.$qaRole@kmutnb.ac.th"
  $qaBody = @{ email = $qaEmail; password = $qaPassword; returnSecureToken = $true } | ConvertTo-Json
  $qaAuth = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-redesign-key' -ContentType 'application/json' -Body $qaBody
  $qaProfile = @{ id = $qaAuth.localId; email = $qaEmail; name = "Redesign QA $qaRole"; role = $qaRole; isActive = $true; createdAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json
  $qaUri = "http://127.0.0.1:9000/users/$($qaAuth.localId).json?ns=demo-it-course-chatbot-default-rtdb"
  Invoke-RestMethod -Method Put -Uri $qaUri -Headers @{ Authorization = 'Bearer owner' } -ContentType 'application/json' -Body $qaProfile | Out-Null
}
```

เก็บ `$qaPassword` ใน session สำหรับ login เท่านั้น ไม่ใส่ในรายงาน/Git. หากพบ EMAIL_EXISTS หยุด seed และใช้ fixture เดิม หรือเริ่ม Emulator instance ที่ว่างด้วยการตกลงขอบเขตข้อมูลทดสอบให้ชัด; ไม่ลบข้อมูลชุดอื่นเพื่อให้คำสั่งผ่าน

- [ ] ผ่าน UI ของ Emulator เตรียมหลักสูตร/วิชาตัวอย่างและ Student plan เดียวสำหรับ before/after: A 3 หน่วยกิต, B 3, S 2, F 3. A/B/S เป็น completed, F เป็น failed. บันทึกค่าแสดงผลเดิมทุกจุด; ทางคณิตศาสตร์คาดว่า completed 8 และ GPA 21/9 ≈2.33 ถ้า baseline ต่างให้บันทึกความต่าง ไม่แก้สูตรระหว่าง redesign
- [ ] เพิ่มกรณีปี 8, ภาคฤดูร้อน, วิชาเลือก custom code/name และ prerequisite/corequisite ที่เชื่อมสองวิชา. จด ID ของ fixture จริงที่ UI สร้างในรายงาน
- [ ] รัน matrix ท้ายแผนก่อนแก้และบันทึกแต่ละกรณี. เก็บภาพ Guest + Student + privileged roles จากข้อมูลทดสอบที่ 375 และ 1440px; เก็บ PDF/print baseline จาก plan เดียวกัน
- [ ] รัน lint baseline ของไฟล์ที่จะเปลี่ยนและบันทึก error เดิม ไม่ใช้ `eslint-disable` ซ่อนปัญหา:

```powershell
npx eslint src/main.tsx src/App.tsx src/pages/Home.tsx src/pages/Login.tsx src/pages/Register.tsx src/pages/NotFound.tsx src/pages/Courses.tsx src/pages/CurriculumDashboard.tsx src/components/layout src/components/dashboard src/components/study-plan src/components/curriculum
```

**Gate:** environment ใช้งานได้, fixture ชี้ Emulator, baseline ของพื้นที่ที่จะเริ่มมีหลักฐาน. พื้นที่ที่ทดสอบไม่ได้คงสถานะ BLOCKED และไม่ถูกนับว่าตรวจรับครบ

## Task 2: Styles แบบ opt-in และ shared shell

**Files:** Create `src/styles/academic-ui.css`; modify `src/main.tsx`, `src/App.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

**Interfaces:** Consumes existing theme/markup; produces `.academic-shell` scope and classes defined below. ไม่เปลี่ยน props/API ของ UI primitives

- [ ] เพิ่ม import หลัง `import "./index.css";` ใน `src/main.tsx`:

```tsx
import "./styles/academic-ui.css";
```

- [ ] เติม class ที่ root div เดิมใน App โดยไม่เปลี่ยน provider/Routes:

```tsx
<div className="academic-shell min-h-screen bg-background flex flex-col">
```

- [ ] สร้าง stylesheet นี้. ทุก selector เปลี่ยนเฉพาะส่วนที่ติด class ใหม่; ไม่เพิ่ม typography/color ที่สืบทอดทั้ง app หรือแก้ token ของ report

```css
@media screen {
  .academic-shell {
    --academic-page: #f8fafc;
    --academic-surface: #ffffff;
    --academic-ink: #0b1637;
    --academic-copy: #475569;
    --academic-line: #cbd5e1;
    --academic-action: hsl(var(--primary));
  }
  .dark .academic-shell {
    --academic-page: #0f172a;
    --academic-surface: #172033;
    --academic-ink: #f1f5f9;
    --academic-copy: #cbd5e1;
    --academic-line: #475569;
  }
  .academic-shell .academic-header {
    background: var(--academic-surface);
    backdrop-filter: none;
    box-shadow: none;
    border-bottom: 1px solid var(--academic-line);
  }
  .academic-shell .academic-footer {
    background: var(--academic-page);
    border-top: 1px solid var(--academic-line);
  }
  .academic-shell .academic-page {
    background: var(--academic-page);
    padding: 1.5rem 1rem 3rem;
  }
  .academic-shell .academic-title {
    color: var(--academic-ink);
    font-size: clamp(1.75rem, 1.3rem + 1vw, 2.25rem);
    line-height: 1.4;
    letter-spacing: normal;
    font-weight: 700;
  }
  .academic-shell .academic-copy {
    color: var(--academic-copy);
    font-size: 1rem;
    line-height: 1.65;
    max-width: 65ch;
  }
  .academic-shell .academic-panel {
    background: var(--academic-surface);
    border: 1px solid var(--academic-line);
    border-radius: 0.75rem;
    box-shadow: none;
  }
  .academic-shell .academic-welcome {
    background: transparent;
    border: 0;
    box-shadow: none;
  }
  .academic-shell .academic-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .academic-shell .academic-control,
  .academic-dialog .academic-control {
    min-height: 2.75rem;
    border-radius: 0.5rem;
    transition: background-color 160ms ease, border-color 160ms ease;
  }
  .academic-shell .academic-control:focus-visible,
  .academic-dialog .academic-control:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 3px;
  }
  .academic-shell .academic-number { font-variant-numeric: tabular-nums; }
  .academic-shell .academic-tabs-scroll {
    display: flex;
    justify-content: flex-start;
    height: auto;
    max-width: 100%;
    overflow-x: auto;
    padding: 0.375rem;
    gap: 0.375rem;
    scroll-padding-inline: 0.375rem;
  }
  .academic-shell .academic-tabs-scroll > [role="tab"] {
    flex: 0 0 auto;
    min-height: 2.75rem;
    padding-inline: 1rem;
  }
  .academic-shell .academic-form-grid,
  .academic-dialog .academic-form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  .academic-shell .academic-form-grid > *,
  .academic-dialog .academic-form-grid > * { min-width: 0; }
  .academic-shell .academic-form-grid > .col-span-2,
  .academic-dialog .academic-form-grid > .col-span-2 { grid-column: 1 / -1; }
  .academic-dialog {
    max-width: min(42rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
  }
  .academic-shell .academic-scroll-region {
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    padding-block: 0.25rem;
  }
  .academic-shell .academic-auth {
    min-height: auto;
    background: var(--academic-page);
    padding: 2.5rem 1rem 4rem;
  }
  .academic-shell .academic-home-hero {
    background: var(--academic-surface);
    color: var(--academic-ink);
    padding: 3rem 1rem;
  }
  .academic-shell .academic-hero-title {
    color: var(--academic-ink);
    font-size: clamp(2rem, 1.25rem + 2vw, 3rem);
    line-height: 1.3;
    letter-spacing: normal;
  }
  .academic-shell .academic-hero-subtitle {
    color: var(--academic-copy);
    font-size: 1.125rem;
    line-height: 1.6;
    margin-top: 0.75rem;
  }
  .academic-shell .academic-home-section {
    background: var(--academic-page);
    color: var(--academic-ink);
    padding: 3rem 1rem;
  }
  .academic-shell .academic-feature {
    text-align: left;
    background: transparent;
    border: 0;
    box-shadow: none;
    transform: none;
  }
  .academic-shell .academic-feature:hover {
    box-shadow: none;
    transform: none;
  }
  .academic-shell .academic-home-cta {
    background: var(--academic-surface);
    color: var(--academic-ink);
    padding: 2.5rem 1rem;
    border-top: 1px solid var(--academic-line);
  }
  @media (min-width: 640px) {
    .academic-shell .academic-form-grid,
    .academic-dialog .academic-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 768px) {
    .academic-shell .academic-page { padding: 2rem 1.5rem 4rem; }
    .academic-shell .academic-home-hero { padding: 4rem 1.5rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .academic-shell .academic-control,
    .academic-dialog .academic-control { transition: none; }
  }
}
```

`.academic-dialog` ไม่มี ancestor scope เพราะ Radix portal อาจอยู่ใต้ body; ใช้ class นี้กับ DialogContent ที่แก้เท่านั้น. สี/typography ของ portal ยังคงใช้ theme เดิม

- [ ] ใน Header เติม `academic-header` ที่ `<header>`; ใน Footer เติม `academic-footer` ที่ `<footer>`. ไม่เปลี่ยน logo, navItems, `Sheet`, avatar, `logout`, breakpoint 768, active/focus states, `print:hidden` หรือ `<ChatBot />`
- [ ] เปิด Guest menu -> Courses -> back -> menu -> current route; ทดสอบ Escape/focus return, login/logout แล้วรายการถูก role, resize ขณะ Sheet เปิด. ตรวจ header/footer ที่ 320/768/1440 และ `.dark`
- [ ] ตรวจ diff ของ `App.tsx` มีเพียง class ใหม่ และ `main.tsx` มีเพียง style import. รัน build/diff check; commit checkpoint: `style: establish academic presentation styles`

## Task 3: หน้าแรกที่แสดงประโยชน์ของเว็บจริง

**Files:** `src/pages/Home.tsx`; create `src/components/home/HomeOverview.tsx`, `public/images/academic-course-preview.webp`; append styles only if needed to `src/styles/academic-ui.css`

**Interfaces:** `HomeOverview(): JSX.Element` เป็นรูปอย่างเดียว ไม่มี state/network request. Home ยังคงใช้ `isAuthenticated`/`user` และ Link เดิม

- [ ] เก็บ screenshot ส่วนหลักสูตรจาก Emulator ที่ 1440px crop เฉพาะเนื้อหาหลัก; ห้ามมีชื่อ/อีเมล/ข้อมูลจริง. Save เป็น WebP ที่ path ด้านบน กว้าง 1440 สูง 960 (จัดกรอบภาพให้ได้สัดส่วนก่อนบันทึก ไม่บิดรูป). Target ≤200KB และอ่านข้อความหัวข้อได้. ต้องมีภาพจริงก่อนเพิ่ม component; ไม่แทนด้วยกล่อง CSS ปลอม
- [ ] สร้าง component:

```tsx
const HomeOverview = () => (
  <figure className="m-0 min-w-0">
    <img
      src="/images/academic-course-preview.webp"
      alt="ตัวอย่างหน้าจอค้นหาและกรองรายวิชาในระบบ IT Assistant"
      width={1440}
      height={960}
      fetchPriority="high"
      className="h-auto w-full rounded-xl border border-border"
    />
    <figcaption className="mt-3 text-sm text-muted-foreground">
      ตัวอย่างหน้าจอหลักสูตรจากข้อมูลทดสอบ
    </figcaption>
  </figure>
);

export default HomeOverview;
```

- [ ] Import `HomeOverview` ใน Home. แทนเฉพาะ block `Hero Image/Illustration` เดิมด้วย `<HomeOverview />`. ลบ decorative overlay `<div className="absolute inset-0 bg-black/20" />` ที่ Hero และกล่อง MessageCircle ลอยที่เป็นส่วนของ illustration เดิม
- [ ] เปลี่ยน grid ของ Hero เป็น `grid items-center gap-8 lg:grid-cols-[5fr_7fr] lg:gap-12`. เติม `academic-home-hero` ที่ hero section, `academic-hero-title` ที่ h1, `academic-hero-subtitle` ที่ tagline span และ `academic-copy` ที่ย่อหน้าคำอธิบาย
- [ ] เปลี่ยน Button classes เฉพาะชุด hero/CTA: ปุ่มหลักใช้ `className="academic-control"`; ปุ่มรองใช้ `variant="outline" className="academic-control"`. เก็บ `size`, `asChild`, Link และ auth condition เดิม. เมื่อลบ `text-white` จากพื้น section ตรวจข้อความลูกที่เคยใช้ white/opacity แล้วใช้ `academic-copy` แทนเฉพาะข้อความอธิบาย
- [ ] ส่วน features: grid เป็น `grid gap-6 md:grid-cols-2`; Card แต่ละรายการเติม `academic-feature`; icon wrapper เปลี่ยนเป็น `mb-3 flex h-10 w-10 items-center justify-center text-primary`; inner div ที่ใช้ `className={feature.color}` เปลี่ยนเป็น `className="text-primary"`; คงรายการ features ครบสี่รายการและคำอธิบาย. ส่วน roles เติม `academic-panel` ให้ Card และใช้ `bg-primary/10 text-primary` แทน gradient ของกล่อง icon; คงทุก role/features
- [ ] กล่องผู้ใช้ที่ล็อกอินใน Hero เปลี่ยน class เป็น `flex min-w-0 items-center gap-3 rounded-lg bg-muted p-3 text-foreground`; avatar เดิมเปลี่ยน `bg-white/20` เป็น `bg-primary/10 text-primary` และแถว role เปลี่ยน `text-white/70` เป็น `text-muted-foreground`. คง expressions ชื่อ/role และเงื่อนไข `isAuthenticated`
- [ ] Section feature/role เติม `academic-home-section`; section CTA เติม `academic-home-cta`; heading block ของทั้งสองใช้ `mb-8 text-left` แทน `text-center mb-16`. ไม่แก้ label ของลิงก์หรือเพิ่ม callback ใหม่
- [ ] ตรวจ Guest CTA, authenticated role CTA, รูปโหลดได้, ไม่มีข้อมูลส่วนตัว, ไม่มีแนวนอนล้นที่ 320/375px, ไม่เกิด CLS จากรูปไม่มีขนาด และ CTA บน desktop อ่านจบในบรรทัดเดียว
- [ ] ลบ imports ที่ไม่ใช้งานหลังเอา illustration ออกเท่านั้น; รัน build/diff check/lint เฉพาะไฟล์; commit checkpoint: `style: modernize the academic home page`

## Task 4: Auth และหน้าไม่พบข้อมูล

**Files:** `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/NotFound.tsx`

**Interfaces:** คง `handleEmailLogin`, `handleGoogleLogin`, `handleEmailRegister`, `handleGoogleSignup`, `handleInputChange`, form state และ navigate เดิม

- [ ] ใน Login/Register เติม `academic-auth` ที่ root div, `academic-panel` ที่ Card หลัก, `academic-title` ที่ page heading. คง `max-w-md` และลำดับเนื้อหา
- [ ] Input เดิมที่มี `className="pl-10"` เปลี่ยนเฉพาะ class เป็น `className="academic-control pl-10"`. เพิ่ม `academic-control` ให้ Google และ submit buttons โดยคงทุก prop/disabled/loading branch. ปรับตำแหน่ง Mail/Lock icon จาก `top-3` เป็น `top-1/2 -translate-y-1/2` เพื่ออยู่กลาง input 44px
- [ ] 404 เติม `academic-auth` ที่ root, `academic-title` ที่ h1; คง `href="/"` และ error logging. ใช้คำไทย `ไม่พบหน้าที่คุณต้องการ` และ `กลับหน้าหลัก` แทนข้อความ 404 ภาษาอังกฤษในหน้านี้เท่านั้น
- [ ] ทดสอบ valid/invalid email login, Google button loading/error และ redirect ตาม baseline. Register ตรวจ password mismatch, สั้นเกินเงื่อนไขเดิม, studentId conditional, submit successful บน Emulator ด้วย disposable fixture เพิ่มหนึ่งบัญชี; ตรวจ Auth + User Profile แยกกัน
- [ ] ตรวจ keyboard Tab order, Enter submit, labels, error visibility และ software keyboard. ถ้าไม่มีอุปกรณ์จริงให้บันทึกส่วนที่จำลองและส่วนที่ยัง BLOCKED
- [ ] รัน build/diff/lint changed files; commit checkpoint: `style: refine account entry screens`

## Task 5: หลักสูตรและ Student workspace

**Files:** `src/pages/Courses.tsx`, `src/pages/CurriculumDashboard.tsx`, `src/components/dashboard/StudentDashboard.tsx`, `src/components/study-plan/StudyPlanManager.tsx`, `src/components/study-plan/StudyPlanProgress.tsx`, `src/components/curriculum/CurriculumFlowchart.tsx`, `src/components/curriculum/CurriculumTimelineFlowchart.tsx`

**Interfaces:** ใช้ filters, course IDs, useStudyPlan/useStudentGPAAndCredits และ diagram geometry เดิม. Outputs ยังคงเป็นค่าจาก services และ plan เดิม

- [ ] เติม classes โดยไม่เปลี่ยน expressions ใน JSX:

| Element ที่มีอยู่ | เพิ่ม class |
| --- | --- |
| Root content ของ Courses/CurriculumDashboard/StudentDashboard รวม loading/error roots | `academic-page` |
| Heading หน้า | `academic-title` |
| Filter Card, summary Card, profile Card | `academic-panel` |
| Welcome Card ของ Student | `academic-welcome` |
| Filter/semester toolbar ที่มี controls แถวเดียว | `academic-toolbar` |
| ตัวเลข GPA/credits/count ที่แสดงค่า | `academic-number` |
| Buttons/inputs ของ filter/profile/save/cancel | `academic-control` |

ตัวอย่างรูปแบบการเพิ่ม class โดยเก็บ classes เดิม:

```tsx
<div className="academic-page min-h-screen p-6 gradient-subtle print:p-0 print:bg-white">
```

ใช้เฉพาะ opening tag เดิมของ StudentDashboard; children/closing tag เดิมไม่เปลี่ยน. ห้ามเติม `academic-panel` หรือ typography class ใน subtree `reportRef`

- [ ] คง Student TabsList เดิม `grid-cols-2 ... sm:grid-cols-4`, values ทั้งสี่และ content เดิม. ใน StudyPlanManager ปรับเฉพาะ Card ที่ล้อม toolbar/semester workspace ด้วย `academic-panel`; Buttons ที่แก้เติม `academic-control`. ไม่เปลี่ยนจำนวนปี/เทอม การเรียงวิชา props หรือ keys
- [ ] ใน flowcharts เติม `academic-scroll-region` ที่ outer scroll container เดิมเท่านั้น. ห้ามเปลี่ยน node width/height, SVG viewBox, coordinate constants, category colors หรือ element IDs; ก่อนแก้ต้องระบุ outer container ใน diff ให้ชัดว่าไม่ใช่ canvas ที่คำนวณเส้น
- [ ] ทดสอบ filters ของ program/curriculum/year/semester และ details ก่อน/หลัง; หน่วยกิต official versus computed ใช้ค่าประเภทเดิม. ตรวจ empty/loading/error ไม่ถูก CSS ซ่อน
- [ ] Student: เพิ่ม/ย้าย/เอาวิชาออก, แก้ grade/status, custom code/name, เปิดปี8/summer, profile save/cancel, refresh แล้วคงข้อมูล. เทียบ GPA/credits กับ baseline และตรวจ prerequisite cascade เดิม
- [ ] Export PDF จาก dataset baseline เดียว และ browser print. เทียบทุกหน้า: ชื่อ/รหัสวิชา custom, จำนวนรายการ, หน่วยกิต, GPA, page breaks และช่องลงนาม. ทั้ง print และ PDF ต้องผ่านแยกกัน
- [ ] รัน build/diff/lint เฉพาะไฟล์; commit checkpoint: `style: refine academic workspace surfaces`

## Task 6: Admin / Staff / Course management

**Files:** `src/components/dashboard/AdminDashboard.tsx`, `src/components/dashboard/StaffDashboard.tsx`, `src/components/dashboard/CourseManagement.tsx`

**Interfaces:** คง local state, service calls, tab values, permission guards, confirmations, parsing และ import/export เดิม

- [ ] เพิ่ม `academic-page` ที่ root Admin/Staff, `academic-welcome` ที่ welcome Card, `academic-panel` ที่ content Cards, `academic-title` ที่ h1 และ `academic-number` ที่ stats values. ไม่เปลี่ยนจำนวน stats หรือ calculations
- [ ] เติม `academic-tabs-scroll` ที่ TabsList ของ Admin (หกรายการ) และ Staff (สามรายการ). คง child TabsTrigger, value, label และ onValueChange ทั้งหมด; tab ที่ focus ต้องเลื่อนมาให้มองเห็นได้
- [ ] ใน CourseManagement add/edit dialogs เติม `academic-dialog` ที่ DialogContent เดิมและ `academic-form-grid` ที่ grid-cols-2 ภายในฟอร์มทั้งสองชุด. ถ้า child ใช้ col-span-2 CSS ใน Task2 จะคง full-row span บนจอเล็ก. ไม่ย้าย submit/confirm เข้า form ใหม่หรือเปลี่ยน button type
- [ ] เติม `academic-control` ให้ form inputs/select triggers/actions ที่ปรับ; use explicit class บน portal element ห้ามพึ่ง selector ที่ต้องมี `.academic-shell` เป็น ancestor เพื่อปรับขนาด DialogContent
- [ ] ใน Emulator รัน course create/edit/delete พร้อม cancel confirm, user create/edit/delete พร้อม cancel confirm, role change, prerequisite/corequisite edit, import JSON/CSV valid/invalid และ export JSON. เทียบ permission errors และขอบเขตข้อมูลกับ baseline; user delete ตรวจ Auth/RTDB แยกโดยไม่สมมติว่าต้องลบทั้งคู่ถ้า baseline ทำไม่ครบ
- [ ] บัญชี Staff ต้องไม่เห็น action Admin ใหม่เพราะการจัด layout. ตรวจรายการ role ทุกตัวตาม baseline ทั้ง UI และผล service เดิม
- [ ] ตรวจทุก tab ที่ 320/375/768/1440, keyboard arrows/Tab, form scroll ถึงปุ่มบันทึกและ error. รัน build/diff/lint; commit checkpoint: `style: improve staff management layouts`

## Task 7: Instructor / Student detail / Analytics

**Files:** `src/components/dashboard/InstructorDashboard.tsx`, `src/components/dashboard/StudentDetailView.tsx`, `src/components/dashboard/ChatAnalyticsDashboard.tsx`

**Interfaces:** คง `selectedStudentId`, `studentId`, `onBack`, advisee calls, search/time/status/intent/rating filters, pagination และ CSV/XLSX handlers

- [ ] Instructor root ที่ `className="space-y-6"` เติม `academic-page`; header ที่ `flex justify-between items-center` เติม `academic-toolbar`; h1 เติม `academic-title`; stats และ student Cards เติม `academic-panel`. ไม่เปลี่ยน child mapping หรือปุ่ม add/remove/view
- [ ] StudentDetailView เติม `academic-panel` เฉพาะ profile header ที่ `print:hidden`; toolbar/filter เติม `academic-toolbar`, controls เติม `academic-control`. ไม่ติด style class ในรายงานที่ render เป็น child
- [ ] Analytics เติม `academic-panel` ที่ chart/list Cards, `academic-toolbar` ที่ filter/action row และ `academic-number` ที่ metrics; เติม `academic-tabs-scroll` ที่ TabsList. ตารางยาวคงข้อมูลครบ เพิ่ม `academic-scroll-region` บน wrapper เดิมเท่านั้น
- [ ] ทดสอบ instructor add/remove advisee, เปิดรายละเอียด, back, filter year/semester, tab รายงานและ PDF. ทดสอบ analytics filter/pagination, refresh, CSV/XLSX export รวม feedback sheet และ empty/error states
- [ ] ห้ามกด generate sample logs หรือ delete feedback กับ production; กรณีนี้ทำบน disposable Emulator records และเปรียบเทียบกับ baseline เท่านั้น
- [ ] รัน build/diff/lint; commit checkpoint: `style: align advising and analytics screens`

## Task 8: Chatbot และ overlay เข้าชุด

**Files:** `src/components/chat/ChatBot.css`; read `ChatBot.tsx`, `FeedbackBanner.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/toast.tsx`

**Interfaces:** CSS ของ n8n ที่มีอยู่เท่านั้น. คง createChat lifecycle, session/storage, webhook, metadata และ feedback trigger

- [ ] เปิด chat บน local test environment ตรวจ DOM ที่แท้จริงก่อนแก้ CSS; จด selector ที่ match จริงสำหรับ window/header/messages/composer/send/toggle. ใช้ selectors เดิมที่ยืนยันแล้ว ไม่เพิ่ม wildcard `[class*="..."]` ใหม่
- [ ] ปรับ declaration ใน selector เดิมของ window จาก `border-radius: 24px !important;` เป็น `border-radius: 16px !important;` และคง width/max-height/overflow เดิม. ลดเงาเป็น:

```css
box-shadow: 0 12px 32px rgba(11, 22, 55, 0.18) !important;
```

- [ ] คง font Noto Sans Thai ใน chat ตาม spec เดิม, navy header, bubble differentiation และสี semantic; ไม่เพิ่ม font download ชุดใหม่. นำ progress/feedback loading เดิมมาทดสอบโดยไม่เปลี่ยนข้อความ PDPA
- [ ] ตรวจ Sheet/Dialog/Toast/Chatbot ซ้อนกันก่อนเปลี่ยน z-index. ถ้าทุก action กดได้ไม่ต้องเปลี่ยน layer scale. ถ้าพบชน ให้บันทึก exact selector และภาพในรายงานแล้วเขียน scoped patch เพิ่มใน task นี้ก่อนลงมือ
- [ ] ส่งข้อความผ่าน local test workflow, ทดสอบข้อความไทยยาว/link/scroll, ส่งครบห้าข้อความแล้ว feedback ปรากฏตาม baseline, กด dislike/neutral/like และ dismiss, ปิดเปิด chat และเปลี่ยน route/session. เปรียบเทียบ payload fields/session behavior กับ baseline ไม่ทดสอบความถูกต้องของ AI โดยเปลี่ยน prompt
- [ ] ถ้าไม่มี local n8n test workflow ให้รายงาน chat success/feedback integration เป็น BLOCKED; สามารถตรวจ CSS/error/welcome ได้ แต่ยังไม่ปิด task ว่าทดสอบฟีเจอร์ครบ
- [ ] ตรวจ 320px/landscape/software keyboard, composer ไม่ถูก feedback บัง, focus และ reduced-motion, print ซ่อน launcher. รัน build/diff; commit checkpoint: `style: harmonize academic chat surfaces`

## Task 9: ตรวจทั้งระบบและส่งมอบ

**Files:** `docs/audits/modern-academic-web-redesign-qa.md`, `README.md`; read-only review of implementation diff

**Interfaces:** Consumes baseline plus evidence of Tasks2-8; produces feature-parity report, screenshots and release-ready changes only when matrix passes

- [ ] รัน matrix นี้ด้วย fixture เดิมหลังแก้; เก็บผลแต่ละแถวแยกกัน ไม่ใช้ PASS เดียวแทนทุก role

| Case | Before/after ที่ต้องเทียบ |
| --- | --- |
| Guest | Home links, Courses filters/details, login/register/404, mobile nav และ chat |
| Auth | email/Google entry, validation, loading/error, refresh, logout, role redirect |
| Student | ทุก tab, plan create/reset, add/remove/move, grades/status, custom elective, year8/summer, profile save/cancel |
| Credits | dataset เดียวกัน: totals, completed credits, GPA, prerequisite warnings/cascade ทุกหน้าที่แสดงค่า |
| Course management | create/edit/delete/cancel, filters, relations, duplicate codes across curriculum slots, import/export |
| User management | create/edit/delete/cancel, role limits, Auth account versus User Profile result |
| Instructor | add/remove advisee, view/back, filters และ student details |
| Analytics | time/search/intent/status/rating, pagination, feedback data, CSV/XLSX including feedback sheet |
| Curriculum | program/year/semester, grid/timeline, arrows/category labels, internal scroll, detail dialog |
| Chat | welcome/send/reply/error, session metadata, scroll, feedback every five messages, composer visibility |
| PDF | generated PDF ทุกหน้าเทียบข้อมูล/page breaks/Thai text/signatures; browser print แยกต่างหาก |
| Responsive | แต่ละ role 320/375/390/768/1024/1440px, landscape640×375, no page overflow; diagram/table overflow อยู่ในกรอบ |
| Accessibility | Tab/Shift+Tab/Escape/focus return, 200% zoom, readable errors, control contrast, reduced motion, `.dark` |
| Devices | ระบุ browser emulation กับเครื่องจริงแยกกัน; virtual keyboard ไม่ถือว่าตรวจแล้วจาก viewport อย่างเดียว |

- [ ] ตรวจ diff: event handlers/state/service hooks ไม่ถูกเปลี่ยน; UI actions ไม่หาย; report subtree untouched. ตรวจ protected files จาก baseline ที่เก็บใน Task1:

```powershell
git diff 2d593e4 -- src/services src/hooks src/contexts src/types src/config database.rules.json src/utils/exportPdf.ts src/components/study-plan/StudyPlanReport.tsx
```

Expected: ไม่มี diff จาก redesign ใน paths นี้. ถ้า baseline ตอนเริ่ม execution เปลี่ยนแล้วใช้ commit ที่ Task1 เก็บ ไม่กล่าวโทษงานอื่นว่าเกิดจาก redesign

- [ ] รัน `npm run build`, `git diff --check` และ lint changed TSX. เปรียบเทียบ lint baseline; ไม่มี error ใหม่. บันทึก build warnings เดิมและขนาด bundle ก่อน/หลัง; ไม่เพิ่ม dependency เพื่อแก้ภาพ
- [ ] ตรวจภาพจริง desktop/mobile, ไทยไม่ถูกตัดสระ/วรรณยุกต์, สีและระยะสม่ำเสมอ, หน้าแรกไม่มี fake data/stock campus claims, dashboard ยังอ่านตารางได้ครบ. ตรวจ Lighthouse บน local build ก่อน/หลังด้วย conditions เดียวกันเพื่อหาการถดถอย ไม่ใช้คะแนนครั้งเดียวเป็นคำรับรอง production
- [ ] อัปเดตรายงานผลที่ทำจริงและเพิ่ม README links ไป spec/plan/report. ไม่บันทึก test passwords, tokens หรือข้อมูลผู้ใช้จริง
- [ ] ถ้ามี FAIL/BLOCKED ให้ระบุ case, สิ่งที่ทำแล้ว และสิ่งที่ยังต้องตรวจ; ห้ามปิดงานว่า feature parity ครบ. เมื่อทุก required case ผ่าน จึงส่งภาพ before/after และเสนอ commit/push ของงานนี้

## จุดตรวจรับและการย้อนกลับ

- แต่ละ task เริ่มจาก snapshot และจบด้วย code diff + browser behavior check ของพื้นที่นั้น
- Shared styles ใช้ class เฉพาะ จึงถอด class ของพื้นที่ที่มีปัญหาออกได้โดยไม่รื้อ services. Git checkpoints แยกแต่ละ task; ไม่ใช้ reset/force push เพื่อย้อนงานผู้อื่น
- เป้าหมายคือเปลี่ยน visual hierarchy ให้สม่ำเสมอโดยผ่าน behavior baseline ไม่ใช่รับรองล่วงหน้าว่า CSS ไม่มีทางกระทบ feature

## Self-review ของแผน

- ครอบคลุมหน้าแรก/auth/404, shared shell, หลักสูตร, Student, Admin/Staff, Instructor/detail, analytics และ chat
- คง primary CI, route/role contracts และฟีเจอร์เกรด/หน่วยกิต/ปี8/import-export
- แยก print ออกจาก html2canvas PDF และจำกัด report styling
- ระบุ Emulator เนื่องจาก mount cleanup; ไม่มีคำสั่ง mutation production ในแผน
- ใช้ code/class changes ที่เฉพาะเจาะจง; ไม่สั่งสร้าง feature เพิ่มเพื่อทำให้ UI ดูครบ
- แผนนี้พร้อมสำหรับตรวจทานและ execution เป็นระยะ; ยังไม่ได้ลงมือแก้ UI ในรอบเขียนแผน
