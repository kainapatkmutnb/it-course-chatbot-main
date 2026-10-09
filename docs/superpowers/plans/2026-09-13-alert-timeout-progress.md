# Alert Timeout Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มแถบเวลาคงเหลือให้ทุกข้อความแจ้งเตือนที่ปิดอัตโนมัติในแอป โดยแถบหมดตรงกับเวลาปิด

**Architecture:** ใช้ hook กลางนับเวลาจาก deadline เดียวกันสำหรับแถบและการปิด พร้อม component แถบที่ใช้ซ้ำได้ ให้ตัวจับเวลากลางเป็นเจ้าของการปิดแทน timer ซ้อนของ toast เดิม ผูก timer เข้ากับอายุของข้อความที่แสดงจริง

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Radix Toast; ไม่เพิ่ม dependency

## Global Constraints

- ผู้ใช้ยืนยันวันที่ 2026-09-13: เวลายังเดินต่อเมื่อวางเมาส์บน alert หรือสลับแท็บ
- แถบบาง 3px ที่ขอบล่าง เริ่มเต็มแล้วหดจากด้านขวาเข้าหาด้านซ้าย สีตามประเภทข้อความ
- คงระยะเวลาเดิม: toast default 5000ms, error ใน Login/Register 5000ms, feedback thank-you 1500ms
- toast กำหนด duration เองได้; Infinity และ duration <= 0 เป็นข้อความค้าง ไม่มีแถบ; undefined หรือ NaN ใช้ default 5000ms
- คงข้อความ ไอคอน สี ตำแหน่งบนขวา ปุ่มปิด swipe และจำนวน toast สูงสุด 1 รายการ
- เวลาลบ toast ออกจาก store หลังปิด 1000ms เป็น exit cleanup ไม่ใช่เวลานับถอยหลัง
- ใช้เวลาที่ผ่านไปจริง ไม่หักเวลาทีละ tick; browser อาจพัก JavaScript ในแท็บพื้นหลัง จึงตรวจ deadline อีกครั้งเมื่อกลับมา และปิดทันทีหากหมดเวลาแล้ว ไม่รับประกัน callback ในแท็บที่ถูก browser suspend
- รองรับ reduced motion ด้วยการอัปเดตเป็นขั้น ไม่ซ่อนข้อมูลเวลาหรือหยุด timeout
- งานนี้เป็นแผนเท่านั้น ยังไม่แก้ application code

## ขอบเขตและหลักฐาน

| พื้นผิว | จุดแก้ | พฤติกรรมเดิม / สิ่งที่จะทำ |
|---|---|---|
| Toast ทุก call site | `src/components/ui/toaster.tsx`, `src/hooks/use-toast.ts` | Provider/Root 5000ms และ fallback timer ซ้อน; ย้ายการปิดไป timer กลาง |
| Login error | `src/pages/Login.tsx` | effect ล้าง error หลัง 5000ms; ใช้ hook กลางและเพิ่มแถบ |
| Register error | `src/pages/Register.tsx` | effect ล้าง error หลัง 5000ms; ใช้ hook กลางและเพิ่มแถบ |
| Feedback thank-you | `src/components/chat/FeedbackBanner.tsx` | หลัง save สำเร็จเรียก onDismiss ใน 1500ms; ใช้ hook กลางและเพิ่มแถบเฉพาะสถานะสำเร็จ |
| Sonner | `src/components/ui/sonner.tsx`, `src/App.tsx` | mount อยู่แต่ไม่มี app call site; ไม่สร้าง timer สำหรับระบบที่ยังไม่ได้ใช้ |
| Static alert / native alert / confirmation dialog | StaffDashboard, StudyPlanManager, alert-dialog | ไม่มี auto-dismiss จึงไม่มีแถบ |

ตรวจซ้ำตอนเริ่ม implementation ด้วย `rg -n 'sonner|setTimeout|duration\s*:|<Alert' src` เพื่อจับ call site ที่อาจเพิ่มหลังเขียนแผน หากมี Sonner ที่ใช้งานจริงใหม่ ต้องเพิ่มใน coverage ก่อนถือว่างานจบ

อ้างอิงรูปแบบเดิม: `docs/adr/ADR-004-toast-alert-redesign-and-positioning.md` และ System Notification Domain ใน `CONTEXT.md` คำว่า alert ในงานนี้ครอบคลุม toast, inline error และ timed status banner ไม่รวมข้อความถาวร ไม่เพิ่ม glossary สำหรับ timeout เพราะเป็นศัพท์โปรแกรมทั่วไป และไม่เพิ่ม ADR เพราะการเพิ่มแถบเป็นการตัดสินใจที่ย้อนกลับง่าย

ใช้ wayfinder ประเมินขอบเขตแล้ว งานมีเส้นทางชัดและจบในหนึ่งแผน จึงไม่สร้าง map/tickets เพิ่ม

## File responsibilities

- Create `src/hooks/use-alert-countdown.ts`: deadline, lifecycle cleanup, expiry callback และ remaining fraction
- Create `src/components/ui/alert-timeout-progress.tsx`: แสดงแถบโดยไม่จับเวลาเอง
- Modify `src/components/ui/toaster.tsx`: child component ต่อ toast เพื่อเรียก hook ถูก Rules of Hooks
- Modify `src/hooks/use-toast.ts`: ถอน fallback timer ที่ซ้อน; คง store, dismiss และ exit cleanup
- Modify `src/pages/Login.tsx`, `src/pages/Register.tsx`: ใช้ hook แทน effect จับเวลาเดิม
- Modify `src/components/chat/FeedbackBanner.tsx`: ใช้ hook แทน timeout หลัง submit
- Create `docs/audits/alert-timeout-progress-qa.md` ตอนลงมือ: บันทึกผลทดสอบจริง

## Task 1: แถบและตัวจับเวลาที่ใช้ร่วมกัน พร้อมเชื่อมต่อ toast

**Interfaces:** `useAlertCountdown({ active, duration, resetKey, onExpire }): number | null` คืนสัดส่วน 0..1 หรือ null เมื่อไม่มี timeout; `AlertTimeoutProgress({ remaining, className })` ไม่มี side effects

- [ ] **Step 1: เก็บ baseline**

รัน `npm run build` และ `npm run lint` บันทึกข้อผิดพลาดเดิมแยกจากงานนี้ ตรวจ logout toast ใน browser: ยังไม่มีแถบ; วางเมาส์ไว้แล้วข้อความยังปิดจาก fallback timer ห้ามใช้การลบข้อมูลจริงเพื่อทดสอบ

- [ ] **Step 2: สร้าง `src/hooks/use-alert-countdown.ts` ด้วยโค้ดนี้**

```tsx
import { useEffect, useRef, useState } from 'react';

type CountdownOptions = {
  active: boolean;
  duration: number;
  resetKey: string;
  onExpire: () => void;
};

export function useAlertCountdown({
  active, duration, resetKey, onExpire,
}: CountdownOptions): number | null {
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  const timed = active && Number.isFinite(duration) && duration > 0;
  const [snapshot, setSnapshot] = useState({ resetKey, duration, remaining: 1 });

  useEffect(() => {
    if (!timed) return;
    const deadline = Date.now() + duration;
    let finished = false;
    let frame = 0;
    let lastPaint = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setSnapshot({ resetKey, duration, remaining: 1 });

    const refresh = () => {
      if (finished) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.min(1, (deadline - now) / duration));
      if (remaining === 0 || !reduced || now - lastPaint >= 250) {
        lastPaint = now;
        setSnapshot({ resetKey, duration, remaining });
      }
      if (remaining === 0) {
        finished = true;
        onExpireRef.current();
      }
    };
    const paint = () => {
      refresh();
      if (!finished) frame = requestAnimationFrame(paint);
    };
    const timeout = window.setTimeout(refresh, duration);
    frame = requestAnimationFrame(paint);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      finished = true;
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [timed, duration, resetKey]);

  if (!timed) return null;
  return snapshot.resetKey === resetKey && snapshot.duration === duration
    ? snapshot.remaining : 1;
}
```

Callback identity เปลี่ยนไม่ควรเริ่มเวลาใหม่; เปลี่ยนข้อความ inline หรือ toast id จึง reset ผ่าน resetKey; เปลี่ยน duration เริ่มรอบใหม่ตาม duration ใหม่; update title/description ของ toast id เดิมไม่ reset การใช้ requestAnimationFrame อัปเดตเฉพาะ component ที่ถือ hook ไม่อัปเดต global toast store ทุกเฟรม

- [ ] **Step 3: สร้าง `src/components/ui/alert-timeout-progress.tsx`**

```tsx
import { cn } from '@/lib/utils';

export function AlertTimeoutProgress({ remaining, className }: {
  remaining: number | null;
  className?: string;
}) {
  if (remaining === null) return null;
  return (
    <span aria-hidden="true" data-alert-timeout-progress=""
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 block h-[3px] overflow-hidden', className)}>
      <span className="absolute inset-0 bg-current opacity-15" />
      <span className="absolute inset-0 origin-left bg-current"
        style={{ transform: `scaleX(${Math.max(0, Math.min(1, remaining))})` }} />
    </span>
  );
}
```

ใช้ span เพื่อไม่ชน selector `[&>svg+div]` ของ inline Alert; แถบเป็นภาพประกอบ aria-hidden เพื่อไม่ให้ screen reader ประกาศทุกเฟรม ไม่ใส่ CSS transition หรือ hover pause ที่ทำให้ภาพช้ากว่า deadline

- [ ] **Step 4: ใน `src/components/ui/toaster.tsx` เพิ่ม imports และ child component ก่อน `Toaster`**

```tsx
import { useAlertCountdown } from '@/hooks/use-alert-countdown';
import { AlertTimeoutProgress } from '@/components/ui/alert-timeout-progress';

type ToastItem = ReturnType<typeof useToast>['toasts'][number];
const progressColors = {
  default: 'text-blue-500 dark:text-blue-400',
  info: 'text-blue-500 dark:text-blue-400',
  success: 'text-emerald-500 dark:text-emerald-400',
  destructive: 'text-rose-500 dark:text-rose-400',
  warning: 'text-amber-500 dark:text-amber-400',
};

function TimedToast({ item, dismiss }: {
  item: ToastItem;
  dismiss: (id: string) => void;
}) {
  const { id, title, description, action, variant, duration, ...props } = item;
  const resolvedDuration = typeof duration === 'number' && !Number.isNaN(duration)
    ? duration : 5000;
  const remaining = useAlertCountdown({
    active: item.open !== false,
    duration: resolvedDuration,
    resetKey: id,
    onExpire: () => dismiss(id),
  });
  const { resolvedVariant, icon } = getToastMeta(variant, title, description);
  return (
    <Toast {...props} variant={resolvedVariant} duration={Infinity}>
      <div className="flex items-start gap-3 w-full pr-3">
        {icon}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && <ToastTitle className="text-[14.5px] font-semibold leading-tight tracking-tight">{title}</ToastTitle>}
          {description && <ToastDescription className="text-[13px] leading-relaxed mt-1 opacity-90">{description}</ToastDescription>}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
      <ToastClose />
      <AlertTimeoutProgress remaining={remaining} className={progressColors[resolvedVariant]} />
    </Toast>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <ToastProvider duration={Infinity}>
      {toasts.map(item => <TimedToast key={item.id} item={item} dismiss={dismiss} />)}
      <ToastViewport />
    </ToastProvider>
  );
}
```

แทนที่ `Toaster` เดิมด้วยเวอร์ชันนี้ โดยคง getToastMeta เดิม ไม่เพิ่ม export Toaster ซ้ำ Root duration ต้องอยู่หลัง props เพื่อป้องกันการ override กลับมาเปิด timer ของ Radix

- [ ] **Step 5: ถอน fallback timer ใน `src/hooks/use-toast.ts`**

ลบบล็อกตั้งแต่ comment `Guaranteed timeout fallback` ถึงจบ `if (duration > 0 && duration !== Infinity)` ให้ส่วนท้าย `toast()` หลัง `dispatch` เหลือ:

```tsx
  return {
    id: id,
    dismiss,
    update,
  }
}
```

คง addToRemoveQueue และ TOAST_REMOVE_DELAY 1000ms ไว้ Timer ใหม่ cleanup เมื่อ unmount หรือ open=false; toast ใหม่แทน toast เก่าจะไม่รับ callback ค้างจากรายการเดิม

- [ ] **Step 6: ตรวจ toast ก่อน commit**

รัน `npm run build` และ `npx eslint src/hooks/use-alert-countdown.ts src/components/ui/alert-timeout-progress.tsx src/components/ui/toaster.tsx src/hooks/use-toast.ts` คาดหวัง build ผ่าน และไม่มี lint error ใหม่จากงานนี้ (แยก baseline warning เดิม)

ใน local UI ตรวจ default 5s, hover, keyboard focus, tab switch, ปุ่มปิด, swipe, toast ใหม่แทนเก่า และ duration 2000/0/Infinity ผ่าน React DevTools props หรือ dev-only harness ที่ไม่ commit ตรวจที่ 2.5s เหลือประมาณครึ่งหนึ่ง ยอมให้คลาดเคลื่อนการสังเกต 150ms

- [ ] **Step 7: Commit เฉพาะไฟล์ของงานนี้**

```bash
git add src/hooks/use-alert-countdown.ts src/components/ui/alert-timeout-progress.tsx src/components/ui/toaster.tsx src/hooks/use-toast.ts
git commit -m "feat: synchronize toast timeout progress and dismissal"
```

## Task 2: ครอบคลุม inline alerts และ feedback confirmation

**Interfaces:** ใช้ `useAlertCountdown` และ `AlertTimeoutProgress` จาก Task 1 โดยไม่เพิ่ม timer ซ้ำ

- [ ] **Step 1: ตรวจ baseline inline error และ feedback success**

ใช้ Register กรอกรหัสผ่านไม่ตรงกันเพื่อแสดง local validation โดยไม่สร้างบัญชี ตรวจ Login ด้วย error ในสภาพแวดล้อมทดสอบ และตรวจ feedback success โดย mock saveFeedback ใน local harness ไม่ส่ง feedback ปลอมขึ้นระบบจริง บันทึกว่าแถบยังไม่มี

- [ ] **Step 2: แก้ `src/pages/Login.tsx` และ `src/pages/Register.tsx` ทั้งสองไฟล์**

ถอด useEffect จาก React import หากไม่มีการใช้อื่น เพิ่ม imports:

```tsx
import { useAlertCountdown } from '@/hooks/use-alert-countdown';
import { AlertTimeoutProgress } from '@/components/ui/alert-timeout-progress';
```

แทนที่ effect `Auto-dismiss error alert after 5 seconds` ทั้งบล็อกด้วย:

```tsx
  const errorRemaining = useAlertCountdown({
    active: Boolean(error),
    duration: 5000,
    resetKey: error,
    onExpire: () => setError(''),
  });
```

แทนที่ JSX Alert ที่แสดง error ในทั้งสองไฟล์ด้วย:

```tsx
<Alert variant="destructive" className="overflow-hidden">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{error}</AlertDescription>
  <AlertTimeoutProgress remaining={errorRemaining}
    className="!pl-0 text-rose-500 dark:text-rose-400" />
</Alert>
```

`!pl-0` ล้าง sibling padding ที่ Alert ใส่ให้ทุก element หลัง svg เพื่อให้แถบเต็มความกว้าง คง semantic role และการล้าง error ระหว่างแก้ข้อมูลเดิม

- [ ] **Step 3: แก้ `src/components/chat/FeedbackBanner.tsx`**

เพิ่ม imports:

```tsx
import { useAlertCountdown } from '@/hooks/use-alert-countdown';
import { AlertTimeoutProgress } from '@/components/ui/alert-timeout-progress';
```

หลัง state declarations เพิ่ม:

```tsx
  const feedbackRemaining = useAlertCountdown({
    active: submittedFeedback !== null,
    duration: 1500,
    resetKey: submittedFeedback ?? '',
    onExpire: onDismiss,
  });
```

หลัง `await chatLogService.saveFeedback(...)` คง `setSubmittedFeedback(type);` และลบ setTimeout(onDismiss, 1500) เดิมเท่านั้น แทนที่ success JSX branch ด้วย:

```tsx
<div className="chat-feedback-thankyou relative overflow-hidden">
  <span className="text-emerald-600 font-medium">✨ ขอบคุณสำหรับข้อเสนอแนะเพื่อพัฒนาบริการครับ!</span>
  <AlertTimeoutProgress remaining={feedbackRemaining}
    className="text-emerald-500 dark:text-emerald-400" />
</div>
```

ไม่มีแถบตอนกำลังถาม feedback หรือกำลัง submit; เริ่มหลังบันทึกสำเร็จเท่านั้น; คง catch/finally เดิม

- [ ] **Step 4: ตรวจผลและบันทึก QA**

รัน `npm run build` คาดหวังผ่าน และ `npm run lint` เปรียบเทียบ baseline จาก Task 1 หากมีปัญหาเดิมให้รายงานอย่างชัดเจน ไม่แก้ unrelated code

สร้าง `docs/audits/alert-timeout-progress-qa.md` พร้อม browser, วันที่, scenario, expected, actual และ pass/fail โดยกรอกผลหลังทดสอบจริงตามตารางนี้:

| Scenario | Expected |
|---|---|
| Success/error/warning/info/default toast | สีแถบตรง variant; 5s แล้วปิด |
| Custom 2000ms | ครึ่งแถบประมาณ 1s; ปิดประมาณ 2s |
| duration 0, -1, Infinity | ไม่ปิดเองและไม่มีแถบ |
| duration undefined / NaN | default 5s |
| Hover / keyboard focus | ไม่หยุดเวลาและปุ่ม action ยังใช้ได้ |
| กลับแท็บก่อน deadline | เหลือเวลาตามเวลาจริง |
| กลับแท็บหลัง deadline | ปิดทันทีเมื่อ browser ประมวลผลต่อ |
| ปิดด้วย X / swipe | ปิดทันที; timer ถูก cleanup |
| Toast ใหม่แทนเก่าที่วินาที 4 | ใหม่เริ่มเต็มและไม่ถูก timer เก่าปิด |
| update title id เดิม | เวลาไม่เริ่มใหม่ |
| update duration id เดิม | เริ่มรอบใหม่ตาม duration ใหม่ |
| Login/Register error เปลี่ยน | แถบและเวลาเริ่มรอบใหม่ 5s |
| Inline error ถูกล้างก่อนครบเวลา | แถบหายและไม่มี callback ค้าง |
| Feedback save สำเร็จ | แถบ 1.5s แล้วปิด |
| Feedback ยังไม่ส่ง / ส่งไม่สำเร็จ | ไม่มีแถบนับถอยหลังใหม่ |
| Static alert / dialog | ไม่มีแถบและไม่ปิดเอง |
| Mobile 375px + desktop + dark mode | แถบเต็มขอบล่าง ไม่มี overflow หรือบังข้อความ |
| Reduced motion | แถบเปลี่ยนเป็นขั้นทุกประมาณ 250ms; deadline เดิม |
| React StrictMode / unmount ก่อนครบเวลา | ไม่เกิด double dismissal หรือ callback ค้าง |

ไม่ติดตั้ง frontend test runner ใหม่เพื่องาน UI ขนาดนี้; build/lint และการทดสอบ timing/interaction ข้างต้นเป็น verification ที่ต้องทำ หาก repository มี test runner เพิ่มก่อนลงมือ ให้ย้าย scenario timer ownership ไป fake-timer component tests ในระบบนั้น

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx src/components/chat/FeedbackBanner.tsx docs/audits/alert-timeout-progress-qa.md
git commit -m "feat: show timeout progress on inline and feedback alerts"
```

## Completion criteria

ทุกพื้นผิวที่มี auto-dismiss ปัจจุบันมีแถบ; แถบและปิดใช้นาฬิกาเดียว; static messages ไม่มีแถบ; ไม่มี active timer ซ้อนใน Radix/hook เดิม; มีผล QA จริงและ build ผ่าน พร้อมรายงานข้อจำกัดหรือ baseline lint failures ที่ยังคงอยู่

## Plan self-review

- Coverage: toast ทั้งระบบ, Login, Register และ feedback thank-you ครบ; Sonner ไม่มี current call site
- Callback/timer ownership: centralized hook; ไม่ใช้ animationend ปิด; cleanup ทุก lifecycle
- Interfaces: type และ imports ตรงกันทั้งสอง tasks; ไม่มี dependency เพิ่ม
- แผนนี้ผ่านการตรวจความครบถ้วนเชิงเอกสาร ยังไม่ใช่ผลทดสอบ application
