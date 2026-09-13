import React, { useMemo, useState, useCallback } from 'react';
import type { StudyPlanView, DisplayCourse, SemesterGroup } from './studyPlanViewModel';
import { courseDatabase } from '@/services/completeCurriculumData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Info } from 'lucide-react';

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

const COURSE_WIDTH = 140;
const COURSE_HEIGHT = 92;
const GUTTER_WIDTH = 22;
const GUTTER_HEIGHT = 16;
const TOP_OFFSET = 50;
const CLEARANCE = 6;

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

function semesterTitle(year: number, semester: number): string {
  if (year === 0) return 'ยังไม่ได้จัดตาราง';
  if (semester === 3) return `ปีที่ ${year} ฝึกงาน`;
  return `ปีที่ ${year} เทอมที่ ${semester}`;
}

export function StudentPlanTimeline({ view, program, curriculumYear }: StudentPlanTimelineProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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

  // Layout bounds
  const canvasWidth = totalColumns * (COURSE_WIDTH + GUTTER_WIDTH);
  const canvasHeight = maxCoursesInCol * (COURSE_HEIGHT + GUTTER_HEIGHT) + TOP_OFFSET + 70;

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

  // Check if there are blocking course boxes between start and end columns at horizontal line y
  const hasBlockingCourses = useCallback((
    startX: number,
    endX: number,
    y: number,
    startSemIndex: number,
    endSemIndex: number
  ): boolean => {
    for (let semIdx = startSemIndex + 1; semIdx < endSemIndex; semIdx++) {
      const group = orderedGroups[semIdx];
      if (!group) continue;
      for (let courseIdx = 0; courseIdx < group.courses.length; courseIdx++) {
        const courseRect = getCourseRect(semIdx, courseIdx);
        const linePassesThroughCourse = y >= courseRect.top - CLEARANCE && y <= courseRect.bottom + CLEARANCE;
        const lineIsInHorizontalRange = startX < courseRect.right && endX > courseRect.left;
        if (linePassesThroughCourse && lineIsInHorizontalRange) {
          return true;
        }
      }
    }
    return false;
  }, [orderedGroups, getCourseRect]);

  // Generate strict orthogonal path with collision avoidance
  const generateOrthogonalPath = useCallback((
    startRect: CourseRect,
    endRect: CourseRect,
    startSemIndex: number,
    endSemIndex: number,
    relationship: 'forward' | 'same_semester' | 'backward',
    endPortType: 'leftCenter' | 'leftUpper' | 'leftLower' = 'leftCenter'
  ): string => {
    const startPort = startRect.rightCenter;
    const endPort = endRect[endPortType];

    if (relationship === 'same_semester') {
      // Loop out to the right gutter and connect
      const loopX = startPort.x + 14;
      return `M ${startPort.x} ${startPort.y} L ${loopX} ${startPort.y} L ${loopX} ${endPort.y} L ${endPort.x} ${endPort.y}`;
    }

    if (relationship === 'backward') {
      // Reverse dependency loop over top or bottom
      const loopX = Math.min(startPort.x, endPort.x) - 14;
      const topY = Math.min(startRect.top, endRect.top) - GUTTER_HEIGHT / 2;
      return `M ${startPort.x} ${startPort.y} L ${loopX} ${startPort.y} L ${loopX} ${topY} L ${endPort.x + 14} ${topY} L ${endPort.x + 14} ${endPort.y} L ${endPort.x} ${endPort.y}`;
    }

    // Forward relationship across columns:
    const isDirectPathBlocked = hasBlockingCourses(startPort.x, endPort.x, startPort.y, startSemIndex, endSemIndex);
    const verticalDistance = endPort.y - startPort.y;
    const isApproximatelySameLevel = Math.abs(verticalDistance) < CLEARANCE;

    // Direct clean horizontal line if on same row level and unblocked
    if (isApproximatelySameLevel && !isDirectPathBlocked) {
      return `M ${startPort.x} ${startPort.y} L ${endPort.x} ${endPort.y}`;
    }

    // Unblocked path between different vertical levels
    if (!isDirectPathBlocked) {
      const gutterStartX = startPort.x + GUTTER_WIDTH / 2;
      const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
      return `M ${startPort.x} ${startPort.y} L ${gutterStartX} ${startPort.y} L ${targetGutterX} ${startPort.y} L ${targetGutterX} ${endPort.y} L ${endPort.x} ${endPort.y}`;
    }

    // Blocked path: route through safe gutter channel above or below course boxes
    const gutterStartX = startPort.x + GUTTER_WIDTH / 2;
    const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
    const aboveY = Math.min(startRect.top, endRect.top) - GUTTER_HEIGHT / 2 - 3;
    const belowY = Math.max(startRect.bottom, endRect.bottom) + GUTTER_HEIGHT / 2 + 3;

    let routingY = endPort.y;
    if (endPortType === 'leftUpper') {
      routingY = aboveY;
    } else if (endPortType === 'leftLower') {
      routingY = belowY;
    } else {
      routingY = Math.abs(aboveY - startPort.y) <= Math.abs(belowY - startPort.y) ? aboveY : belowY;
    }
    routingY = Math.max(routingY, 45);

    let path = `M ${startPort.x} ${startPort.y} L ${gutterStartX} ${startPort.y} L ${gutterStartX} ${routingY} L ${targetGutterX} ${routingY}`;
    if (Math.abs(routingY - endPort.y) > CLEARANCE) {
      path += ` L ${targetGutterX} ${endPort.y}`;
    }
    path += ` L ${endPort.x} ${endPort.y}`;
    return path;
  }, [hasBlockingCourses]);

  const isSpecialBlueConnection = (prereqCode: string, targetCode: string) => {
    return cleanCode(prereqCode) === '060233112' && cleanCode(targetCode) === '060233501';
  };

  // Compute all prerequisite edges
  const edges = useMemo((): PrerequisiteEdge[] => {
    const edgeList: PrerequisiteEdge[] = [];
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

        rawPrereqs.forEach((prereqStr, pIdx) => {
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

          const startRect = getCourseRect(best.semIndex, best.courseIndex);
          const endRect = getCourseRect(semIndex, courseIndex);

          let portType: 'leftCenter' | 'leftUpper' | 'leftLower' = 'leftCenter';
          if (rawPrereqs.length > 1) {
            portType = pIdx === 0 ? 'leftUpper' : 'leftLower';
          }

          const pathString = generateOrthogonalPath(
            startRect,
            endRect,
            best.semIndex,
            semIndex,
            relationship,
            portType
          );
          const isSpecial = isSpecialBlueConnection(best.course.code, course.code);

          edgeList.push({
            id: edgeKey,
            sourceId: best.course.id,
            targetId: course.id,
            sourceCourse: best.course,
            targetCourse: course,
            startSemIndex: best.semIndex,
            startCourseIndex: best.courseIndex,
            endSemIndex: semIndex,
            endCourseIndex: courseIndex,
            relationship,
            pathString,
            isSpecial,
          });
        });
      });
    });

    return edgeList;
  }, [
    orderedGroups,
    program,
    curriculumYear,
    catalogLookup,
    codeLookup,
    getCourseRect,
    generateOrthogonalPath,
  ]);

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
          statusText: course.grade ? `✗ ${course.grade}` : '✗ ไม่ผ่าน',
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
      default:
        return {
          bg: '#ffffff',
          border: '#000000',
          text: '#0f172a',
          statusText: `${course.credits}(${course.credits}-0-${course.credits * 2})`,
          statusColor: '#475569',
        };
    }
  };

  if (orderedGroups.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>ไม่มีรายวิชาที่บันทึกไว้ในแผนการเรียน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interactive Inspector Header */}
      {selectedCourseData ? (
        <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
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

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setSelectedCourseId(null)}
          >
            <X className="w-3.5 h-3.5 mr-1" /> ล้างการเลือก
          </Button>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold">💡 เคล็ดลับ:</span>
            <span>คลิกที่กล่องรายวิชาเพื่อไฮไลต์เส้นทางวิชาบังคับก่อน (Prerequisites) และวิชาที่สามารถลงเรียนต่อได้</span>
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
              </defs>

              {/* Render Arrows */}
              {edges.map(edge => {
                const isIncoming = selectedCourseId && edge.targetId === selectedCourseId;
                const isOutgoing = selectedCourseId && edge.sourceId === selectedCourseId;
                const isDimmed = selectedCourseId && !isIncoming && !isOutgoing;

                let strokeColor = '#64748b';
                let markerUrl = 'url(#student-arrow-slate)';
                let strokeWidth = 2;
                let strokeDasharray = undefined;

                if (edge.isSpecial) {
                  strokeColor = '#1e40af';
                  markerUrl = 'url(#student-arrow-special-blue)';
                  strokeWidth = 2.5;
                }

                if (isIncoming) {
                  strokeColor = '#2563eb';
                  markerUrl = 'url(#student-arrow-blue)';
                  strokeWidth = 3;
                } else if (isOutgoing) {
                  strokeColor = '#9333ea';
                  markerUrl = 'url(#student-arrow-purple)';
                  strokeWidth = 3;
                } else if (isDimmed) {
                  strokeColor = '#cbd5e1';
                  markerUrl = 'url(#student-arrow-dim)';
                  strokeWidth = 1.5;
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
                    opacity={isDimmed ? 0.2 : 1}
                    className="transition-all duration-200"
                  />
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

                let ringClass = '';
                if (isSelected) {
                  ringClass = 'ring-3 ring-blue-500 shadow-md scale-[1.02] z-30';
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
                      className="text-center leading-snug flex-1 flex items-center justify-center px-0.5 line-clamp-2 overflow-hidden"
                      style={{ fontSize: '10px', color: style.text }}
                      title={course.name}
                    >
                      <span>{course.name}</span>
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
              const summaryY = maxCoursesInCol * (COURSE_HEIGHT + GUTTER_HEIGHT) + TOP_OFFSET + 10;
              const rectX = semIndex * (COURSE_WIDTH + GUTTER_WIDTH);

              return (
                <div
                  key={`sem-sum-${semIndex}`}
                  className="absolute text-center text-xs font-bold border-t-2 border-slate-900 pt-2 bg-white"
                  style={{
                    left: `${rectX}px`,
                    top: `${summaryY}px`,
                    width: `${COURSE_WIDTH}px`,
                  }}
                >
                  {group.totalCredits} หน่วยกิต
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

