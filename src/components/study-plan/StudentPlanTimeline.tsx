import React from 'react';
import type { StudyPlanView } from './studyPlanViewModel';
import type { ResultStatus } from './studyPlanViewModel';

const RESULT_CONFIG: Record<ResultStatus, { label: string; colorClass: string }> = {
  completed: { label: 'ผ่าน', colorClass: 'border-green-500 bg-green-50 text-green-900' },
  failed:    { label: 'ไม่ผ่าน', colorClass: 'border-red-500 bg-red-50 text-red-900' },
  incomplete:{ label: 'ยังไม่สมบูรณ์ (I)', colorClass: 'border-yellow-400 bg-yellow-50 text-yellow-900' },
  withdrawn: { label: 'ถอน (W)', colorClass: 'border-slate-400 bg-slate-50 text-slate-700' },
  in_progress:{ label: 'กำลังเรียน', colorClass: 'border-blue-400 bg-blue-50 text-blue-900' },
  planned:   { label: 'วางแผน', colorClass: 'border-slate-300 bg-white text-slate-700' },
  unknown:   { label: 'ไม่ทราบผล', colorClass: 'border-orange-300 bg-orange-50 text-orange-800' },
};

function semesterLabel(year: number, semester: number): string {
  if (year === 0) return 'ยังไม่ได้จัดตาราง';
  if (semester === 3) return `ปีที่ ${year} — ภาคฤดูร้อน`;
  return `ปีที่ ${year} — ภาคเรียนที่ ${semester}`;
}

export function StudentPlanTimeline({ view }: { view: StudyPlanView }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" aria-label="แผนการเรียนของฉัน">
      {view.groups.map(group => (
        <section
          key={`${group.year}-${group.semester}`}
          className="w-64 shrink-0"
          aria-label={semesterLabel(group.year, group.semester)}
        >
          <h3 className="font-bold text-sm mb-1 px-1">
            {semesterLabel(group.year, group.semester)}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 px-1">
            {group.courses.length} วิชา · {group.totalCredits} หน่วยกิต
          </p>
          {group.courses.map(course => {
            const cfg = RESULT_CONFIG[course.result];
            return (
              <article
                key={course.id}
                data-course-id={course.id}
                tabIndex={0}
                className={`my-2 rounded-lg border-2 p-3 text-xs focus:outline-2 focus:outline-blue-500 ${cfg.colorClass}`}
                aria-label={`${course.code} ${course.name}`}
              >
                <p className="font-bold leading-tight">{course.code}</p>
                <p className="leading-snug mt-0.5">{course.name}</p>
                <p className="mt-1">
                  {course.credits} หน่วยกิต
                  {course.grade ? ` · เกรด ${course.grade}` : ' · ยังไม่มีเกรด'}
                </p>
                <p className="mt-0.5 font-medium text-[11px]">{cfg.label}</p>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
