import React, { useMemo, useState, useCallback } from 'react';
import type { StudyPlanView, DisplayCourse, SemesterGroup } from './studyPlanViewModel';
import { courseDatabase } from '@/services/completeCurriculumData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Info, Eye, EyeOff } from 'lucide-react';

interface StudentPlanTimelineProps {
  view: StudyPlanView;
  program?: string;
  curriculumYear?: string;
}

interface ConnectionPort {
  x: number;
  y: number;
}

interface CourseRect {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  leftCenter: ConnectionPort;
  leftUpper: ConnectionPort;
  leftLower: ConnectionPort;
  rightCenter: ConnectionPort;
  topCenter: ConnectionPort;
  bottomCenter: ConnectionPort;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface PrerequisiteEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceCourse: DisplayCourse;
  targetCourse: DisplayCourse;
  startSemIndex: number;
  startCourseIndex: number;
  endSemIndex: number;
  endCourseIndex: number;
  relationship: 'forward' | 'same_semester' | 'backward';
  pathString: string;
  isSpecial?: boolean;
}

const COURSE_WIDTH = 144;
const COURSE_HEIGHT = 88;
const GUTTER_WIDTH = 34;
const GUTTER_HEIGHT = 22;
const TOP_OFFSET = 50;
const CORNER_RADIUS = 7;

// Helper: Remove department prefix (INE-, INET-, IT-, ITI-, ITT-)
export const removeCodePrefix = (code: string): string => {
  if (!code) return '';
  return code.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '').trim();
};

// Helper: Extract normalized digits or cleaned code for matching
export const cleanCode = (code: string): string => {
  if (!code) return '';
  const match = code.match(/\d{6,9}/);
  if (match) return match[0];
  return code.replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*$/, '').trim();
};

export const extractCodeToken = (text: string): string => {
  if (!text) return '';
  const match = text.match(/\d{6,9}/);
  if (match) return match[0];
  return text.split(' ')[0].replace(/^(ITT|ITI|INET|INE|IT)-/i, '').replace(/\*$/, '').trim();
};

/**
 * Converts a sequence of orthogonal points to a smooth SVG path with fillet arcs (radius r).
 */
export function pointsToRoundedSvgPath(points: { x: number; y: number }[], radius: number = 7): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  // Deduplicate consecutive identical points
  const pts: { x: number; y: number }[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = pts[pts.length - 1];
    if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
      pts.push(points[i]);
    }
  }

  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const pPrev = pts[i - 1];
    const pCurr = pts[i];
    const pNext = pts[i + 1];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 < 1 || len2 < 1) {
      d += ` L ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}`;
      continue;
    }

    const r = Math.min(radius, len1 / 2, len2 / 2);
    const startX = pCurr.x - (dx1 / len1) * r;
    const startY = pCurr.y - (dy1 / len1) * r;
    const endX = pCurr.x + (dx2 / len2) * r;
    const endY = pCurr.y + (dy2 / len2) * r;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  d += ` L ${pts[pts.length - 1].x.toFixed(1)} ${pts[pts.length - 1].y.toFixed(1)}`;
  return d;
}

function semesterTitle(year: number, semester: number): string {
  if (year === 0) return 'ยังไม่ได้จัดตาราง';
  if (semester === 3) return `ปีที่ ${year} ฝึกงาน`;
  return `ปีที่ ${year} เทอมที่ ${semester}`;
}

export function StudentPlanTimeline({ view, program, curriculumYear }: StudentPlanTimelineProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [isFocusOnly, setIsFocusOnly] = useState<boolean>(false);

  // Build master curriculum prerequisite lookup & slot ordering map
  const catalogLookup = useMemo(() => {
    const orderMap = new Map<string, number>();
    const prereqMap = new Map<string, string[]>();

    if (courseDatabase) {
      for (const p in courseDatabase) {
        for (const y in courseDatabase[p]) {
          for (const sem in courseDatabase[p][y]) {
            const list = courseDatabase[p][y][sem];
            list.forEach((c: any, idx: number) => {
              const cleaned = cleanCode(c.code);
              const isTargetScope = (!program || p === program) && (!curriculumYear || y === curriculumYear);

              if (isTargetScope) {
                orderMap.set(`${sem}_${cleaned}`, idx);
                if (!orderMap.has(cleaned)) orderMap.set(cleaned, idx);
                if (c.prerequisites && c.prerequisites.length > 0) {
                  prereqMap.set(`${p}_${y}_${cleaned}`, c.prerequisites);
                  prereqMap.set(cleaned, c.prerequisites);
                }
              } else {
                if (!orderMap.has(cleaned)) orderMap.set(cleaned, idx);
                if (c.prerequisites && c.prerequisites.length > 0 && !prereqMap.has(cleaned)) {
                  prereqMap.set(cleaned, c.prerequisites);
                }
              }
            });
          }
        }
      }
    }

    return { orderMap, prereqMap };
  }, [program, curriculumYear]);

  // Order courses within each semester column by official curriculum sequence
  const orderedGroups: SemesterGroup[] = useMemo(() => {
    return view.groups.map(group => {
      const semKey = `${group.year}-${group.semester}`;
      const sortedCourses = [...group.courses].sort((a, b) => {
        const orderA =
          catalogLookup.orderMap.get(`${semKey}_${cleanCode(a.code)}`) ??
          catalogLookup.orderMap.get(cleanCode(a.code)) ??
          999;
        const orderB =
          catalogLookup.orderMap.get(`${semKey}_${cleanCode(b.code)}`) ??
          catalogLookup.orderMap.get(cleanCode(b.code)) ??
          999;
        return orderA - orderB;
      });

      return {
        ...group,
        courses: sortedCourses,
      };
    });
  }, [view.groups, catalogLookup]);

  const totalColumns = orderedGroups.length;
  const maxCoursesInCol = useMemo(() => {
    if (orderedGroups.length === 0) return 0;
    return Math.max(...orderedGroups.map(g => g.courses.length), 1);
  }, [orderedGroups]);

  // Bottom bus channel location
  const bottomBusBaseY = maxCoursesInCol * (COURSE_HEIGHT + GUTTER_HEIGHT) + TOP_OFFSET + 8;

  // Calculate box geometry
  const getCourseRect = useCallback((semIndex: number, courseIndex: number): CourseRect => {
    const x = semIndex * (COURSE_WIDTH + GUTTER_WIDTH);
    const y = courseIndex * (COURSE_HEIGHT + GUTTER_HEIGHT) + TOP_OFFSET;
    const centerX = x + COURSE_WIDTH / 2;
    const centerY = y + COURSE_HEIGHT / 2;

    return {
      x,
      y,
      width: COURSE_WIDTH,
      height: COURSE_HEIGHT,
      centerX,
      centerY,
      left: x,
      right: x + COURSE_WIDTH,
      top: y,
      bottom: y + COURSE_HEIGHT,
      leftCenter: { x, y: centerY },
      leftUpper: { x, y: centerY - 12 },
      leftLower: { x, y: centerY + 12 },
      rightCenter: { x: x + COURSE_WIDTH, y: centerY },
      topCenter: { x: centerX, y },
      bottomCenter: { x: centerX, y: y + COURSE_HEIGHT },
    };
  }, []);

  // Map each course to its grid coordinates
  const courseIndexMap = useMemo(() => {
    const map = new Map<string, { semIndex: number; courseIndex: number; course: DisplayCourse }>();
    orderedGroups.forEach((group, semIndex) => {
      group.courses.forEach((course, courseIndex) => {
        map.set(course.id, { semIndex, courseIndex, course });
      });
    });
    return map;
  }, [orderedGroups]);

  // Fast code-to-course index for prerequisite resolution
  const codeLookup = useMemo(() => {
    const map = new Map<string, Array<{ semIndex: number; courseIndex: number; course: DisplayCourse }>>();
    orderedGroups.forEach((group, semIndex) => {
      group.courses.forEach((course, courseIndex) => {
        const tokens = [
          cleanCode(course.code),
          cleanCode(course.source.code),
          course.code.trim(),
          course.source.code.trim(),
        ];
        tokens.forEach(tok => {
          if (!tok) return;
          const list = map.get(tok) || [];
          list.push({ semIndex, courseIndex, course });
          map.set(tok, list);
        });
      });
    });
    return map;
  }, [orderedGroups]);

  const isSpecialBlueConnection = (prereqCode: string, targetCode: string) => {
    return cleanCode(prereqCode) === '060233112' && cleanCode(targetCode) === '060233501';
  };

  // Compute all prerequisite edges using Multi-Lane Conflict-Free Router
  const { edges, bottomBusTrackCount } = useMemo(() => {
    interface RawEdgeCandidate {
      id: string;
      sourceCourse: DisplayCourse;
      targetCourse: DisplayCourse;
      startSemIndex: number;
      startCourseIndex: number;
      endSemIndex: number;
      endCourseIndex: number;
      relationship: 'forward' | 'same_semester' | 'backward';
      isSpecial?: boolean;
    }

    const rawCandidates: RawEdgeCandidate[] = [];
    const seenEdges = new Set<string>();
    const isINET67 = (program || '').includes('INET') && (curriculumYear || '').includes('67');

    orderedGroups.forEach((group, semIndex) => {
      group.courses.forEach((course, courseIndex) => {
        // Skip circular artifact on INET 67 (matching official CurriculumTimelineFlowchart)
        if (isINET67 && cleanCode(course.code) === '060233214') return;

        // 1. Check course source prerequisites
        let rawPrereqs = (course.source.prerequisites || []).filter(p =>
          !p.includes('โดยความเห็นชอบ') &&
          !p.includes('ความเห็นชอบของภาควิชา') &&
          !p.includes('ตามความเห็นชอบ')
        );

        // 2. Authoritative catalog fallback if empty
        if (rawPrereqs.length === 0) {
          const catalogPrereqs =
            catalogLookup.prereqMap.get(`${program}_${curriculumYear}_${cleanCode(course.code)}`) ||
            catalogLookup.prereqMap.get(cleanCode(course.code)) ||
            [];
          rawPrereqs = catalogPrereqs.filter(p =>
            !p.includes('โดยความเห็นชอบ') &&
            !p.includes('ความเห็นชอบของภาควิชา') &&
            !p.includes('ตามความเห็นชอบ')
          );
        }

        rawPrereqs.forEach(prereqStr => {
          const token = extractCodeToken(prereqStr);
          if (!token) return;

          const candidates = codeLookup.get(token) || [];
          if (candidates.length === 0) return;

          // Prefer candidate in earlier semester
          let best = candidates.find(c => c.semIndex < semIndex && c.course.result === 'completed');
          if (!best) {
            best = candidates.filter(c => c.semIndex < semIndex).sort((a, b) => b.semIndex - a.semIndex)[0];
          }
          if (!best) {
            best = candidates.find(c => c.semIndex === semIndex);
          }
          if (!best) {
            best = candidates[0];
          }

          if (!best || best.course.id === course.id) return;

          const edgeKey = `${best.course.id}->${course.id}`;
          if (seenEdges.has(edgeKey)) return;
          seenEdges.add(edgeKey);

          let relationship: 'forward' | 'same_semester' | 'backward' = 'forward';
          if (best.semIndex === semIndex) relationship = 'same_semester';
          else if (best.semIndex > semIndex) relationship = 'backward';

          const isSpecial = isSpecialBlueConnection(best.course.code, course.code);

          rawCandidates.push({
            id: edgeKey,
            sourceCourse: best.course,
            targetCourse: course,
            startSemIndex: best.semIndex,
            startCourseIndex: best.courseIndex,
            endSemIndex: semIndex,
            endCourseIndex: courseIndex,
            relationship,
            isSpecial,
          });
        });
      });
    });

    // 1. Group outgoing and incoming for port spreading
    const outMap = new Map<string, RawEdgeCandidate[]>();
    const inMap = new Map<string, RawEdgeCandidate[]>();

    rawCandidates.forEach(e => {
      const o = outMap.get(e.sourceCourse.id) || [];
      o.push(e);
      outMap.set(e.sourceCourse.id, o);

      const i = inMap.get(e.targetCourse.id) || [];
      i.push(e);
      inMap.set(e.targetCourse.id, i);
    });

    outMap.forEach(list => {
      list.sort((a, b) => a.endSemIndex - b.endSemIndex || a.endCourseIndex - b.endCourseIndex);
    });
    inMap.forEach(list => {
      list.sort((a, b) => a.startSemIndex - b.startSemIndex || a.startCourseIndex - b.startCourseIndex);
    });

    // 2. Track lane allocators
    const vertGutterTracks = new Map<number, number>();
    const horizGutterTracks = new Map<number, number>();
    let busCounter = 0;

    const edgeList: PrerequisiteEdge[] = rawCandidates.map(e => {
      const outs = outMap.get(e.sourceCourse.id) || [e];
      const ins = inMap.get(e.targetCourse.id) || [e];
      const outIdx = outs.indexOf(e);
      const inIdx = ins.indexOf(e);

      const startRect = getCourseRect(e.startSemIndex, e.startCourseIndex);
      const endRect = getCourseRect(e.endSemIndex, e.endCourseIndex);

      // Port spreading offsets
      const startYOffset = (outIdx - (outs.length - 1) / 2) * Math.min(8, 32 / outs.length);
      const endYOffset = (inIdx - (ins.length - 1) / 2) * Math.min(10, 32 / ins.length);

      const startPort = {
        x: startRect.right,
        y: startRect.centerY + startYOffset,
      };
      const endPort = {
        x: endRect.left,
        y: endRect.centerY + endYOffset,
      };

      const span = e.endSemIndex - e.startSemIndex;
      const rowDiff = e.endCourseIndex - e.startCourseIndex;

      let points: { x: number; y: number }[] = [];

      if (e.relationship === 'same_semester') {
        const loopX = startPort.x + 14 + (outIdx % 3) * 5;
        points = [
          startPort,
          { x: loopX, y: startPort.y },
          { x: loopX, y: endPort.y },
          endPort,
        ];
      } else if (e.relationship === 'backward') {
        const topY = TOP_OFFSET - 14 - (outIdx % 3) * 6;
        const loopStartX = startPort.x + 10;
        const loopEndX = endPort.x - 10;
        points = [
          startPort,
          { x: loopStartX, y: startPort.y },
          { x: loopStartX, y: topY },
          { x: loopEndX, y: topY },
          { x: loopEndX, y: endPort.y },
          endPort,
        ];
      } else if (span === 1 && Math.abs(rowDiff) === 0) {
        // Direct adjacent same row: perfectly straight horizontal
        points = [startPort, endPort];
      } else if (span >= 3) {
        // Long span: route cleanly through Bottom Bus
        const busIdx = busCounter++;
        const busY = bottomBusBaseY + (busIdx % 5) * 6;

        const vStartTrack = vertGutterTracks.get(e.startSemIndex) || 0;
        vertGutterTracks.set(e.startSemIndex, vStartTrack + 1);

        const vEndCol = e.endSemIndex - 1;
        const vEndTrack = vertGutterTracks.get(vEndCol) || 0;
        vertGutterTracks.set(vEndCol, vEndTrack + 1);

        const gutterStartX = startRect.right + GUTTER_WIDTH / 2 + ((vStartTrack % 3) - 1) * 6;
        const targetGutterX = endRect.left - GUTTER_WIDTH / 2 + ((vEndTrack % 3) - 1) * 6;

        points = [
          startPort,
          { x: gutterStartX, y: startPort.y },
          { x: gutterStartX, y: busY },
          { x: targetGutterX, y: busY },
          { x: targetGutterX, y: endPort.y },
          endPort,
        ];
      } else {
        // Local span (1 or 2 sems): route through row gutter
        const gutterRow = Math.min(e.startCourseIndex, e.endCourseIndex);
        const hTrack = horizGutterTracks.get(gutterRow) || 0;
        horizGutterTracks.set(gutterRow, hTrack + 1);

        const vStartTrack = vertGutterTracks.get(e.startSemIndex) || 0;
        vertGutterTracks.set(e.startSemIndex, vStartTrack + 1);

        const vEndCol = e.endSemIndex - 1;
        const vEndTrack = vertGutterTracks.get(vEndCol) || 0;
        vertGutterTracks.set(vEndCol, vEndTrack + 1);

        const gutterBaseY = (gutterRow + 1) * (COURSE_HEIGHT + GUTTER_HEIGHT) + TOP_OFFSET - GUTTER_HEIGHT / 2;
        const hY = gutterBaseY + ((hTrack % 3) - 1) * 5;

        const gutterStartX = startRect.right + GUTTER_WIDTH / 2 + ((vStartTrack % 3) - 1) * 6;
        const targetGutterX = endRect.left - GUTTER_WIDTH / 2 + ((vEndTrack % 3) - 1) * 6;

        points = [
          startPort,
          { x: gutterStartX, y: startPort.y },
          { x: gutterStartX, y: hY },
          { x: targetGutterX, y: hY },
          { x: targetGutterX, y: endPort.y },
          endPort,
        ];
      }

      const pathString = pointsToRoundedSvgPath(points, CORNER_RADIUS);

      return {
        id: e.id,
        sourceId: e.sourceCourse.id,
        targetId: e.targetCourse.id,
        sourceCourse: e.sourceCourse,
        targetCourse: e.targetCourse,
        startSemIndex: e.startSemIndex,
        startCourseIndex: e.startCourseIndex,
        endSemIndex: e.endSemIndex,
        endCourseIndex: e.endCourseIndex,
        relationship: e.relationship,
        pathString,
        isSpecial: e.isSpecial,
      };
    });

    return { edges: edgeList, bottomBusTrackCount: busCounter };
  }, [
    orderedGroups,
    program,
    curriculumYear,
    catalogLookup,
    codeLookup,
    getCourseRect,
    bottomBusBaseY,
  ]);

  // Layout bounds including Bottom Bus and Footer
  const canvasWidth = totalColumns * (COURSE_WIDTH + GUTTER_WIDTH);
  const busHeight = Math.max(bottomBusTrackCount * 6 + 10, 20);
  const summaryY = bottomBusBaseY + busHeight + 10;
  const canvasHeight = summaryY + 54;

  // Handle course click/selection for interactive tracing
  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(prev => (prev === courseId ? null : courseId));
  };

  // Connected courses for interactive inspection
  const selectedCourseData = useMemo(() => {
    if (!selectedCourseId) return null;
    const current = courseIndexMap.get(selectedCourseId)?.course;
    if (!current) return null;

    const incoming = edges.filter(e => e.targetId === selectedCourseId);
    const outgoing = edges.filter(e => e.sourceId === selectedCourseId);

    return {
      course: current,
      incoming,
      outgoing,
    };
  }, [selectedCourseId, courseIndexMap, edges]);

  // Hovered edge details for tooltip banner
  const hoveredEdgeData = useMemo(() => {
    if (!hoveredEdgeId) return null;
    return edges.find(e => e.id === hoveredEdgeId) || null;
  }, [hoveredEdgeId, edges]);

  // Card color styling matching reference flowchart
  const getCardStyle = (course: DisplayCourse) => {
    switch (course.result) {
      case 'completed':
        return {
          bg: '#f0fdf4',
          border: '#22c55e',
          text: '#14532d',
          statusText: course.grade ? `✓ เกรด ${course.grade}` : '✓ ผ่านแล้ว',
          statusColor: '#16a34a',
        };
      case 'failed':
        return {
          bg: '#fef2f2',
          border: '#ef4444',
          text: '#7f1d1d',
          statusText: course.grade ? `✗ เกรด ${course.grade}` : '✗ ไม่ผ่าน',
          statusColor: '#dc2626',
        };
      case 'incomplete':
        return {
          bg: '#fefce8',
          border: '#eab308',
          text: '#713f12',
          statusText: '! เกรด I',
          statusColor: '#ca8a04',
        };
      case 'in_progress':
        return {
          bg: '#eff6ff',
          border: '#3b82f6',
          text: '#1e3a8a',
          statusText: 'กำลังเรียน',
          statusColor: '#2563eb',
        };
      case 'withdrawn':
        return {
          bg: '#f8fafc',
          border: '#94a3b8',
          text: '#334155',
          statusText: 'ถอน (W)',
          statusColor: '#64748b',
        };
      case 'planned':
      default:
        return {
          bg: '#ffffff',
          border: '#000000',
          text: '#0f172a',
          statusText: `${course.credits} หน่วยกิต`,
          statusColor: '#475569',
        };
    }
  };

  if (view.groups.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>ไม่มีรายวิชาที่บันทึกไว้ในแผนการเรียน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-label="แผนการเรียนของฉัน">
      {/* Top Banner: Inspector or Guidance Legend */}
      {selectedCourseData ? (
        <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-3 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-blue-950 text-sm">
              วิชาที่เลือก: [{removeCodePrefix(selectedCourseData.course.code)}] {selectedCourseData.course.name}
            </span>
            <Badge variant="outline" className="bg-white">
              {selectedCourseData.course.credits} หน่วยกิต
              {selectedCourseData.course.grade ? ` · เกรด ${selectedCourseData.course.grade}` : ''}
            </Badge>

            {selectedCourseData.incoming.length > 0 && (
              <span className="flex items-center gap-1 text-blue-800 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                วิชาบังคับก่อน:
                {selectedCourseData.incoming.map(e => (
                  <Badge
                    key={e.id}
                    className={`text-[11px] py-0 px-1.5 ${
                      e.sourceCourse.result === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {removeCodePrefix(e.sourceCourse.code)} ({e.sourceCourse.grade || 'ยังไม่ผ่าน'})
                  </Badge>
                ))}
              </span>
            )}

            {selectedCourseData.outgoing.length > 0 && (
              <span className="flex items-center gap-1 text-purple-800 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                วิชาที่เรียนต่อได้:
                {selectedCourseData.outgoing.map(e => (
                  <Badge
                    key={e.id}
                    className="bg-purple-100 text-purple-800 border-purple-300 text-[11px] py-0 px-1.5"
                  >
                    {removeCodePrefix(e.targetCourse.code)}
                  </Badge>
                ))}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={isFocusOnly ? 'default' : 'outline'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setIsFocusOnly(prev => !prev)}
            >
              {isFocusOnly ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {isFocusOnly ? 'โหมดโฟกัส' : 'แสดงทั้งหมด'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedCourseId(null)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> ล้างการเลือก
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold">💡 เคล็ดลับ:</span>
            <span>คลิกที่กล่องรายวิชาเพื่อดูเส้นทางสายวิชา หรือชี้เมาส์ที่เส้นเพื่อดูคู่ความต่อเนื่อง</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-600 inline-block"></span> ผ่านแล้ว
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500 inline-block"></span> ติด F / ยังไม่ผ่าน
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> เส้นทางพิเศษ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-orange-500 inline-block"></span> เทอมเดียวกัน
            </span>
          </div>
        </div>
      )}

      {/* Hover Tooltip Banner */}
      {hoveredEdgeData && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in duration-150 shadow-2xs">
          <span className="font-semibold">🔗 เส้นวิชาต่อ:</span>
          <span>[{removeCodePrefix(hoveredEdgeData.sourceCourse.code)}] {hoveredEdgeData.sourceCourse.name}</span>
          <span className="font-bold text-emerald-600">➔</span>
          <span>[{removeCodePrefix(hoveredEdgeData.targetCourse.code)}] {hoveredEdgeData.targetCourse.name}</span>
        </div>
      )}

      {/* SVG Canvas & Course Grid */}
      <div className="academic-scroll-region bg-white overflow-x-auto border rounded-xl shadow-xs p-4">
        <div className="inline-block min-w-full">
          {/* Semester Column Headers */}
          <div
            className="relative mb-2"
            style={{
              height: `${TOP_OFFSET - 10}px`,
              width: `${canvasWidth}px`,
            }}
          >
            {orderedGroups.map((group, index) => (
              <div
                key={`hdr-${group.year}-${group.semester}`}
                className="absolute text-center"
                style={{
                  left: `${index * (COURSE_WIDTH + GUTTER_WIDTH)}px`,
                  width: `${COURSE_WIDTH}px`,
                  top: '4px',
                }}
              >
                <div className="font-bold text-sm text-slate-900 leading-tight">
                  {semesterTitle(group.year, group.semester)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {group.courses.length} วิชา
                </div>
              </div>
            ))}
          </div>

          {/* Flowchart Surface with overlaid SVG arrows */}
          <div
            className="relative"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
            }}
          >
            {/* SVG Lines Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
            >
              <defs>
                <marker id="student-arrow-green" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#16a34a" />
                </marker>
                <marker id="student-arrow-red" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#dc2626" />
                </marker>
                <marker id="student-arrow-slate" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#64748b" />
                </marker>
                <marker id="student-arrow-orange" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#ea580c" />
                </marker>
                <marker id="student-arrow-blue" markerWidth="6.5" markerHeight="5.5" refX="6" refY="2.75" orient="auto">
                  <polygon points="0 0, 6.5 2.75, 0 5.5" fill="#2563eb" />
                </marker>
                <marker id="student-arrow-special-blue" markerWidth="6.5" markerHeight="5.5" refX="6" refY="2.75" orient="auto">
                  <polygon points="0 0, 6.5 2.75, 0 5.5" fill="#1e40af" />
                </marker>
                <marker id="student-arrow-purple" markerWidth="6.5" markerHeight="5.5" refX="6" refY="2.75" orient="auto">
                  <polygon points="0 0, 6.5 2.75, 0 5.5" fill="#9333ea" />
                </marker>
                <marker id="student-arrow-dim" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#cbd5e1" />
                </marker>
                <marker id="student-arrow-hover" markerWidth="7" markerHeight="6" refX="6.5" refY="3" orient="auto">
                  <polygon points="0 0, 7 3, 0 6" fill="#0d9488" />
                </marker>
              </defs>

              {/* Render Arrows */}
              {edges.map(edge => {
                const isIncoming = selectedCourseId && edge.targetId === selectedCourseId;
                const isOutgoing = selectedCourseId && edge.sourceId === selectedCourseId;
                const isHovered = hoveredEdgeId === edge.id;
                const isDimmed = selectedCourseId && !isIncoming && !isOutgoing;

                // When in focusOnly mode, hide non-connected lines completely
                if (isFocusOnly && selectedCourseId && !isIncoming && !isOutgoing) {
                  return null;
                }

                let strokeColor = '#64748b';
                let markerUrl = 'url(#student-arrow-slate)';
                let strokeWidth = 1.75;
                let strokeDasharray = undefined;

                if (edge.isSpecial) {
                  strokeColor = '#1e40af';
                  markerUrl = 'url(#student-arrow-special-blue)';
                  strokeWidth = 2.4;
                }

                if (isHovered) {
                  strokeColor = '#0d9488';
                  markerUrl = 'url(#student-arrow-hover)';
                  strokeWidth = 3;
                } else if (isIncoming) {
                  strokeColor = '#2563eb';
                  markerUrl = 'url(#student-arrow-blue)';
                  strokeWidth = 2.8;
                } else if (isOutgoing) {
                  strokeColor = '#9333ea';
                  markerUrl = 'url(#student-arrow-purple)';
                  strokeWidth = 2.8;
                } else if (isDimmed) {
                  strokeColor = '#cbd5e1';
                  markerUrl = 'url(#student-arrow-dim)';
                  strokeWidth = 1.2;
                } else if (edge.relationship === 'same_semester') {
                  strokeColor = '#ea580c';
                  markerUrl = 'url(#student-arrow-orange)';
                  strokeDasharray = '4 3';
                } else if (edge.relationship === 'backward') {
                  strokeColor = '#dc2626';
                  markerUrl = 'url(#student-arrow-red)';
                  strokeDasharray = '4 3';
                } else if (!edge.isSpecial) {
                  if (edge.sourceCourse.result === 'completed') {
                    strokeColor = '#16a34a';
                    markerUrl = 'url(#student-arrow-green)';
                  } else if (edge.sourceCourse.result === 'failed') {
                    strokeColor = '#dc2626';
                    markerUrl = 'url(#student-arrow-red)';
                  }
                }

                return (
                  <path
                    key={edge.id}
                    d={edge.pathString}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={markerUrl}
                    opacity={isDimmed ? 0.18 : 1}
                    pointerEvents="auto"
                    cursor="pointer"
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                    className="transition-all duration-200 hover:opacity-100"
                  >
                    <title>{`[${removeCodePrefix(edge.sourceCourse.code)}] ${edge.sourceCourse.name} ➔ [${removeCodePrefix(edge.targetCourse.code)}] ${edge.targetCourse.name}`}</title>
                  </path>
                );
              })}
            </svg>

            {/* Course Boxes Layer */}
            {orderedGroups.map((group, semIndex) =>
              group.courses.map((course, courseIndex) => {
                const rect = getCourseRect(semIndex, courseIndex);
                const style = getCardStyle(course);

                const isSelected = selectedCourseId === course.id;
                const isIncomingPrereq = selectedCourseData?.incoming.some(e => e.sourceId === course.id);
                const isOutgoingDownstream = selectedCourseData?.outgoing.some(e => e.targetId === course.id);
                const isHoveredSource = hoveredEdgeData?.sourceId === course.id;
                const isHoveredTarget = hoveredEdgeData?.targetId === course.id;

                let ringClass = '';
                if (isSelected) {
                  ringClass = 'ring-3 ring-blue-500 shadow-md scale-[1.02] z-30';
                } else if (isHoveredSource) {
                  ringClass = 'ring-2 ring-emerald-500 shadow-xs z-25';
                } else if (isHoveredTarget) {
                  ringClass = 'ring-2 ring-teal-500 shadow-xs z-25';
                } else if (isIncomingPrereq) {
                  ringClass = 'ring-2 ring-blue-400 z-20';
                } else if (isOutgoingDownstream) {
                  ringClass = 'ring-2 ring-purple-400 z-20';
                }

                return (
                  <div
                    key={course.id}
                    id={`student-course-${course.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCourseClick(course.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCourseClick(course.id);
                      }
                    }}
                    className={`absolute p-2 text-xs flex flex-col justify-between shadow-2xs cursor-pointer select-none transition-all duration-200 rounded-sm ${ringClass}`}
                    style={{
                      left: `${rect.x}px`,
                      top: `${rect.y}px`,
                      width: `${COURSE_WIDTH}px`,
                      height: `${COURSE_HEIGHT}px`,
                      backgroundColor: style.bg,
                      border: `2px solid ${style.border}`,
                      borderWidth: course.result !== 'planned' ? '2.5px' : '2px',
                    }}
                    aria-label={`${course.code} ${course.name} ${style.statusText}`}
                  >
                    {/* Top: Course Code (without department prefix) */}
                    <div
                      className="font-bold text-center text-[12px] leading-tight px-1 truncate"
                      style={{ color: style.text }}
                    >
                      {removeCodePrefix(course.code)}
                    </div>

                    {/* Middle: Course Name */}
                    <div
                      className="text-center text-[11px] leading-snug line-clamp-2 px-1 text-slate-800"
                      title={course.name}
                    >
                      {course.name}
                    </div>

                    {/* Bottom: Grade badge or Credits */}
                    <div
                      className="text-center font-bold text-[10.5px] truncate"
                      style={{ color: style.statusColor }}
                    >
                      {style.statusText}
                    </div>
                  </div>
                );
              })
            )}

            {/* Semester Credits Summary Footer */}
            {orderedGroups.map((group, semIndex) => {
              const rectX = semIndex * (COURSE_WIDTH + GUTTER_WIDTH);

              return (
                <div
                  key={`footer-${group.year}-${group.semester}`}
                  className="absolute text-center border-t-2 border-slate-300 pt-2"
                  style={{
                    left: `${rectX}px`,
                    top: `${summaryY}px`,
                    width: `${COURSE_WIDTH}px`,
                  }}
                >
                  <span className="text-xs font-semibold text-slate-700">
                    {group.totalCredits} หน่วยกิต
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPlanTimeline;
