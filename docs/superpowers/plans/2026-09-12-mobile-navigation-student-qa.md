# Mobile Navigation and Student QA Implementation Plan

> **Execution record (2026-09-13):** UI changes, selected viewport checks, Firebase Student account flows, README update, and build are complete. Remaining checks are intentionally unchecked; see `docs/audits/mobile-navigation-student-qa.md` for evidence and limits.

**Goal:** เปิดแอปเพื่อทดสอบด้วยบัญชี Student ที่ผู้ใช้ระบุ และทำให้เมนูนำทางกับหน้าหลักของเว็บใช้งานได้บนมือถือโดยรักษา CI เดิม

**Architecture:** แยกงานบัญชีทดสอบออกจากงาน responsive เพื่อให้ตรวจรับแต่ละส่วนได้อิสระ. ใช้ Header ส่วนกลางและ Radix Sheet ที่มีอยู่ เพิ่ม mobile navigation โดยใช้ข้อมูลลิงก์ร่วมกับ desktop. แก้ layout เฉพาะจุดที่ทำให้ใช้งานไม่ได้ และตรวจผ่าน browser จริงทั้ง Guest และ Student.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3.4, React Router 6, Radix Dialog/Sheet, Firebase Auth + Realtime Database.

## Global Constraints

- แผนนี้ถูกนำมาดำเนินการตามคำขอต่อมา; ผลและข้อจำกัดบันทึกไว้ใน QA report.
- รักษาสี navy/blue/white, typography, logo และ theme tokens เดิม; ไม่เพิ่ม UI library หรือเปลี่ยน framework.
- ผู้ใช้ยืนยันสองบัญชี `iti66@kmutnb.ac.th` และ `itt67@kmutnb.ac.th`, role `student` ทั้งคู่; ใช้รหัสผ่านที่ผู้ใช้ให้ในบทสนทนาโดยไม่บันทึกลงไฟล์หรือ Git.
- ผู้ใช้ยืนยันปลายทาง Firebase ของเว็บจริง; เปิดแอป local ด้วย config ของ project จริงและสร้างเฉพาะสองบัญชีนี้เมื่อเริ่มทำตามแผน.
- ไม่อนุมานรหัสนักศึกษา หลักสูตร หรือปีหลักสูตรจากชื่ออีเมล; ตั้งชื่อแสดงผลเป็น `Student ITI66` และ `Student ITT67`, เว้นข้อมูลการศึกษาที่ไม่ทราบไว้หากฟอร์มอนุญาต.
- ถ้าบัญชีมีอยู่แล้ว ให้ทดสอบ login ด้วยข้อมูลที่ให้ ไม่เปลี่ยน password/role หรือเขียนทับ profile ของบัญชีเดิม.
- คงสิทธิ์เดิม: เมนู dashboard ชี้ตาม role ที่ล็อกอิน; การทำ mobile menu ไม่เพิ่มสิทธิ์หรือเปลี่ยน rules.
- ยืนยัน role จาก profile หลังสมัคร: current source ใช้ `getRoleFromEmail`; อีเมล `iti66` ตก fallback Student. การปรับนโยบาย role ทั้งระบบเป็นอีกงานหนึ่ง.
- อ้างอิง repository baseline `f2f8884` (working tree สะอาดตอนเริ่มวางแผน); ตรวจใหม่ก่อนเริ่มทำจริง.
- ไม่ commit/push/deploy โดยอัตโนมัติ.

## ข้อพบจาก source

1. `src/components/layout/Header.tsx`: `<nav className="hidden md:flex ...">` ซ่อนเมนูใต้ 768px แต่ไม่มี mobile replacement. นี่คือข้อพบจาก source; ต้อง reproduce ใน browser ก่อนแก้.
2. Header ใช้ padding แนวนอน 24px, logo + subtitle และสองปุ่ม Guest อยู่แถวเดียวกัน; มีความเสี่ยงล้นบน 320px.
3. Profile dropdown กว้าง `w-80` และ email ไม่มี wrapping จึงต้องตรวจขอบจอเล็ก.
4. `src/components/dashboard/StudentDashboard.tsx`: TabsList สี่คอลัมน์ตลอดทุก viewport; แถว email/role ใช้ flex ที่ไม่ wrap.
5. `src/pages/Courses.tsx`: สรุปสถิติห้าคอลัมน์ตลอดทุก viewport.
6. มี `src/components/ui/sheet.tsx` อยู่แล้ว พร้อม Dialog focus management, overlay และ Escape close.
7. Header fallback เรียก `<User />` แต่ยังไม่ import; เพิ่ม import เมื่อแก้ Header.

## รูปแบบที่เสนอ

- จอเล็กกว่า 768px: logo แบบกระชับซ้าย, ปุ่มเมนูขนาด 44×44px ขวา; ผู้ล็อกอินมี avatar อยู่ข้างปุ่มเมนู.
- ปุ่มเมนูเปิด Sheet ด้านขวา กว้างไม่เกินจอ มีหัวข้อ “เมนูหลัก”, ลิงก์หลัก, สถานะหน้าปัจจุบัน และปุ่มบัญชี.
- Guest เห็น หน้าหลัก/หลักสูตร/เข้าสู่ระบบ/สมัครสมาชิก; ผู้ล็อกอินเห็น หน้าหลัก/หลักสูตร/แดชบอร์ด/ออกจากระบบ.
- จอ 768px ขึ้นไปใช้ navigation แนวนอนเดิม แต่ลด spacing เพื่อให้ 768px ไม่เบียดกัน.
- Sheet ปิดเมื่อเลือกลิงก์, เปลี่ยน route, กด Escape, แตะ overlay หรือขยายหน้าจอเข้าสู่ desktop; focus กลับปุ่มเปิดเมื่อปุ่มยังมองเห็น.
- รักษาเนื้อหาและ CI; ไม่ใช้การซ่อน overflow ทั้งหน้าเพื่อกลบปัญหา.

## File map

| File | งาน |
| --- | --- |
| `src/components/layout/Header.tsx` | shared links, mobile Sheet, compact brand/auth controls, dropdown width |
| `src/components/dashboard/StudentDashboard.tsx` | wrap profile row, responsive tabs |
| `src/pages/Courses.tsx` | responsive summary grid |
| `src/components/ui/sheet.tsx` | reuse; แก้เฉพาะเมื่อ browser พบปัญหาที่แก้ผ่าน props ไม่ได้ |
| `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/CurriculumDashboard.tsx`, `src/components/study-plan/StudyPlanManager.tsx`, `src/components/layout/Footer.tsx`, `src/components/chat/ChatBot.tsx` | ตรวจ responsive; เปลี่ยนเฉพาะจุดที่ reproduce ได้และบันทึกก่อน/หลัง |
| `docs/audits/mobile-navigation-student-qa.md` | ผลทดสอบ viewport/role, รายการบัญชีที่สร้างจริงโดยไม่เก็บ credentials, ข้อจำกัด |

## Task 1: Reproduce และเตรียมบัญชี Student

**Interfaces:** ใช้ Register UI → Firebase Auth Account + User Profile → logout/login → Student dashboard. ผลส่งต่อคือสองบัญชี Student ที่ role ยืนยันแล้ว และ session สำหรับ browser QA.

- [x] ตรวจ `git status --short`, baseline commit และ Firebase project config โดยไม่พิมพ์ secret; บันทึก environment/port ใน QA report.
- [x] เปิดแอป local เชื่อม Firebase ของเว็บจริงตามที่ผู้ใช้ยืนยัน:

```powershell
# ใช้ Firebase ที่ตั้งค่าไว้: ตรวจ project ก่อนสร้างบัญชี
npm run dev -- --host 127.0.0.1
```

ใช้ URL ที่ Vite แสดงจริง ไม่สมมติว่า port เดิมว่าง. ยืนยันว่า config ของ app ชี้ project จริงที่ผู้ใช้ใช้งาน; ไม่ใช้ `dev:emulator` สำหรับสร้างสองบัญชีนี้.

- [x] เปิดหน้าใน Guest และตรวจ mobile/desktop widths; ดู QA report สำหรับผล emulation.
- [x] ใช้ `/register` สร้างบัญชีแรกที่ระบุ; ตรวจผลจากหน้า Student dashboard.
- [ ] ตรวจ Auth UID ตรง key ของ User Profile โดยตรง; ยืนยัน role และ login ไป `/dashboard/student` ผ่าน UI สำเร็จ.
- [x] Logout บัญชีแรก; สร้างบัญชีที่สองตามที่ระบุ, login แยกบัญชีและตรวจ Student dashboard.
- [ ] ถ้า Auth สร้างแล้วแต่ profile ล้มเหลว บันทึก partial failure และตรวจบัญชีเดิมก่อน retry; ไม่สร้างซ้ำหรืออ้างว่าสำเร็จ. ไม่ลบบัญชี Firebase จริงเพื่อ cleanup; บัญชีเหล่านี้เป็นสิ่งส่งมอบที่ผู้ใช้ขอ.

**Acceptance:** เปิด app ได้; root cause ของเมนูหายมี browser evidence; ทั้งสองบัญชี login ได้และ role Student ตรวจได้บน Firebase จริง.

## Task 2: เพิ่ม mobile navigation ใน Header

**Interfaces:** ใช้ `useAuth()` เดิม; shared array `{to: string, label: string}[]`; ไม่สร้าง API หรือ auth state ชุดใหม่.

- [x] ใช้ regression case: mobile menu แสดงบนจอเล็กและ navigation ไปหน้าหลักสูตรได้.
- [x] เพิ่ม state, shared navigation, route/viewport close behavior และ Sheet ใน Header.

```tsx
const [mobileOpen, setMobileOpen] = useState(false);
const location = useLocation();
const navItems = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/courses', label: 'หลักสูตร' },
  ...(isAuthenticated && user
    ? [{ to: `/dashboard/${user.role}`, label: 'แดชบอร์ด' }]
    : []),
];

useEffect(() => { setMobileOpen(false); }, [location.pathname]);
useEffect(() => {
  const media = window.matchMedia('(min-width: 768px)');
  const closeOnDesktop = () => {
    if (media.matches) setMobileOpen(false);
  };
  media.addEventListener('change', closeOnDesktop);
  return () => media.removeEventListener('change', closeOnDesktop);
}, []);
```

- [x] Render desktop links จาก `navItems` ด้วย NavLink และ active state.

```tsx
<nav aria-label="เมนูหลัก" className="hidden md:flex items-center gap-4 lg:gap-8">
  {navItems.map(item => (
    <NavLink key={item.to} to={item.to} end={item.to === '/'}
      className={({ isActive }) =>
        `rounded-sm border-b-2 px-1 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isActive ? 'border-primary text-primary' : 'border-transparent text-foreground/80 hover:text-primary'
        }`}>
      {item.label}
    </NavLink>
  ))}
</nav>
```

- [x] วาง Sheet ใน auth/actions group ถัดจาก avatar/desktop guest controls:

```tsx
<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 md:hidden"
      aria-label="เปิดเมนูหลัก">
      <Menu className="h-5 w-5" aria-hidden="true" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[min(20rem,100vw)] overflow-y-auto">
    <SheetHeader className="text-left">
      <SheetTitle>เมนูหลัก</SheetTitle>
      <SheetDescription>เลือกหน้าที่ต้องการใช้งาน</SheetDescription>
    </SheetHeader>
    <nav aria-label="เมนูหลักบนมือถือ" className="mt-6 flex flex-col gap-2">
      {navItems.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-lg px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
            }`}>
          {item.label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-6 grid gap-3 border-t pt-4">
      {isAuthenticated && user ? (
        <Button variant="outline" className="min-h-11"
          onClick={() => { setMobileOpen(false); handleLogout(); }}>
          ออกจากระบบ
        </Button>
      ) : (
        <>
          <Button variant="outline" asChild className="min-h-11">
            <Link to="/login" onClick={() => setMobileOpen(false)}>เข้าสู่ระบบ</Link>
          </Button>
          <Button asChild className="min-h-11">
            <Link to="/register" onClick={() => setMobileOpen(false)}>สมัครสมาชิก</Link>
          </Button>
        </>
      )}
    </div>
  </SheetContent>
</Sheet>
```

- [x] ใช้ responsive class substitutions เฉพาะองค์ประกอบที่ระบุ:

| Element | Classes |
| --- | --- |
| Header inner container | `container mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:px-6` |
| Brand Link | `flex min-w-0 items-center gap-2 hover:opacity-80 transition-opacity` |
| Logo icon wrapper | `shrink-0 p-2 sm:p-2.5 gradient-primary rounded-xl shadow-elegant` |
| Brand text wrapper | `flex min-w-0 flex-col` |
| Brand title | คงสีเดิม; แทน `text-xl` ด้วย `text-base sm:text-xl` และเพิ่ม `truncate` |
| Subtitle | เพิ่ม `hidden lg:block` กับ classes เดิม |
| Auth group | `flex shrink-0 items-center gap-1 sm:gap-3` |
| Guest desktop controls | `hidden md:flex items-center gap-2` |
| Profile dropdown | `w-80 max-w-[calc(100vw-2rem)]` |
| Profile name/email | เพิ่ม `break-words leading-snug` แทน `leading-none` |

- [ ] ตรวจ keyboard focus, Tab/Shift+Tab, Escape และ focus return ให้ครบ.
- [x] ตรวจ route change, logout/login session switch, refresh และ resize to desktop.
- [ ] ตรวจ chatbot/notifications layering ให้ครบทุก route.

**Acceptance:** ทุกเส้นทาง navigation ของ Guest/Student เข้าถึงได้ที่ 320–1440px; มี active state และ focus state; desktop ไม่มี menu ซ้ำ.

## Task 3: แก้ layout บนหน้าหลักที่เกี่ยวข้อง

**Interfaces:** JSX/CSS classes เท่านั้น; calculations, curriculum data, login และ study-plan persistence คง logic เดิม.

- [x] ที่ StudentDashboard เปลี่ยน TabsList เป็น responsive grid:

```tsx
<TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 print:hidden">
```

คง children เดิม; เพิ่ม `min-h-11 whitespace-normal text-center` ให้ TabsTrigger ทั้งสี่. เปลี่ยนแถวข้อมูล profile จาก `flex items-center space-x-4 text-sm text-muted-foreground` เป็น `flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground`; email span เพิ่ม `break-all`, icon เพิ่ม `shrink-0`.

- [x] ที่ Courses summary statistics เปลี่ยน grid ให้ responsive:

```tsx
<div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-5 gap-4">
```

คงจำนวนรายวิชา/หน่วยกิตและเนื้อหาการ์ดเดิม; เปรียบเทียบค่าก่อน/หลังเพื่อยืนยันว่าเป็น layout change.

- [x] ตรวจ `/`, `/login`, `/register`, `/courses`, `/curriculum`, `/dashboard/student` ที่ 320/375/768px และ dashboard ที่ 390px; ไม่พบ page overflow. ดู QA report.
- [ ] ถ้าพบอีกจุดนอก substitutions ข้างต้น ให้บันทึก exact file/element และเพิ่ม patch ของจุดนั้นในแผนก่อนแก้; ไม่อ้างว่าผ่านเมื่อเพียงซ่อน scrollbar ของ body.

**Acceptance:** ไม่มี horizontal overflow ทั้งหน้า; อ่านข้อความไทยได้; ปุ่ม/แท็บไม่ทับกัน; ฟอร์มสมัครและเข้าสู่ระบบเข้าถึงช่องกรอก/submit ได้เมื่อเปิด keyboard บนมือถือ.

## Task 4: ตรวจรับและส่งมอบ

- [x] รัน:

```powershell
npm run build
git diff --check
npx eslint src/components/layout/Header.tsx src/components/dashboard/StudentDashboard.tsx src/pages/Courses.tsx
```

Build และ diff check ต้องผ่าน; แยก lint ปัญหาเดิมกับที่เพิ่มมา ห้ามสรุปว่าผ่านถ้ายังมี error ใหม่. Repo ไม่มี test runner ที่ประกาศไว้ จึงใช้ browser behavior cases ต่อไปนี้เป็นเกณฑ์ และไม่เพิ่ม dependency เพียงเพื่อทดสอบ class names.

- [ ] ทำ responsive smoke matrix ให้ครบทุก combination ตามตาราง; ได้ทดสอบบาง viewport/routes ใน browser emulation แล้ว ดู QA report สำหรับผลที่มีและข้อจำกัด:

| Viewport | Session | สิ่งที่ต้องผ่าน |
| --- | --- | --- |
| 320×740, 375×812, 390×844 | Guest | logo/menu อยู่ครบ; เปิด navigation; login/register ได้; ไม่มี page overflow |
| 320×740, 375×812, 390×844 | Student | menu/dashboard/logout ครบ; profile ไม่ล้น; tabs เปลี่ยนเนื้อหา; Courses summary อ่านได้ |
| 768×1024 | Guest + Student | desktop nav ไม่เบียด logo/auth; เปิดจาก mobile แล้ว resize ปิด Sheet |
| 1024×768, 1440×900 | Guest + Student | desktop header/layout ไม่เสีย; active links ถูกต้อง |
| 812×375 | Student | landscape menu scroll ถึงรายการสุดท้ายและปุ่มปิดได้ |

- [ ] ทดสอบ keyboard navigation, focus return, route changes, refresh, zoom 200%, มือถือพร้อม software keyboard และ reduced-motion. หากไม่มีเครื่องจริงให้ระบุ simulated viewport กับ real-device coverage แยกกัน.
- [ ] Smoke test route ของ Admin/Staff/Instructor ด้วยบัญชีทดสอบที่มีอยู่และได้รับอนุญาตเมื่อพร้อม; ห้ามสร้างบัญชี privileged เพิ่มเพื่อทดสอบ responsive. ถ้าไม่พร้อม ระบุว่ายังไม่ได้ทดสอบ role นั้นโดยตรง.
- [x] เขียน `docs/audits/mobile-navigation-student-qa.md` พร้อมผลและข้อจำกัด; ไม่ใส่ credentials.
- [x] เปิดแอปที่ `http://localhost:8080/`; dev server ยังทำงานและบัญชี Firebase จริงคงไว้.

## เกณฑ์ส่งมอบและขอบเขต

งาน responsive ถือว่าเสร็จเมื่อ mobile navbar ใช้งานได้, student flows ผ่าน viewport matrix และ desktop ไม่ถดถอย. งานบัญชีถือว่าเสร็จเมื่อทั้ง `iti66@kmutnb.ac.th` และ `itt67@kmutnb.ac.th` มีบัญชีบน Firebase จริง พร้อมตรวจ login/role Student จริง. ถ้าเกิดข้อขัดข้องด้านบัญชีต้องรายงานผลแยกจากงาน UI ที่ทำเสร็จแล้ว.

แผนนี้ไม่ครอบคลุมการแก้ role escalation rules, user-list permission หรือ course CRUD audit เดิม; ไม่ deploy security rules ด้วยเหตุของการแก้ navbar.
