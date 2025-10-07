import React, { useMemo, useState, useEffect } from 'react';
import { Course } from '@/types/course';
import { getHybridCurriculumData, HybridCourse } from '@/services/hybridCourseService';

interface CurriculumTimelineFlowchartProps {
  selectedDepartment: string;
  selectedCurriculum: string;
  departmentName: string;
}

export const CurriculumTimelineFlowchart: React.FC<CurriculumTimelineFlowchartProps> = ({ 
  selectedDepartment, 
  selectedCurriculum, 
  departmentName 
}) => {
  const [timelineData, setTimelineData] = useState<{ [year: number]: { [semester: number]: HybridCourse[] } }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load hybrid course data (static + Firebase updates)
  useEffect(() => {
    const loadCurriculumData = async () => {
      setIsLoading(true);
      try {
        let programCode, curriculumYear;
        
        // กรณีพิเศษสำหรับหลักสูตรสหกิจทั้งหมด ให้ใช้ข้อมูลจากโครงสร้างของตัวเองโดยตรง
        if (selectedCurriculum === 'IT 62 สหกิจ') {
          programCode = 'IT';
          curriculumYear = '62 สหกิจ';
        } else if (selectedCurriculum === 'IT 67 สหกิจ') {
          programCode = 'IT';
          curriculumYear = '67 สหกิจ';
        } else if (selectedCurriculum === 'INE 62 สหกิจ') {
          programCode = 'INE';
          curriculumYear = '62 สหกิจ';
        } else if (selectedCurriculum === 'INE 67 สหกิจ') {
          programCode = 'INE';
          curriculumYear = '67 สหกิจ';
        } else {
          [programCode, curriculumYear] = selectedCurriculum.split(' ');
        }

        const hybridData = await getHybridCurriculumData(programCode, curriculumYear);
        setTimelineData(hybridData);
      } catch (error) {
        console.error('Error loading curriculum data:', error);
        setTimelineData({});
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedCurriculum) {
      loadCurriculumData();
    }
  }, [selectedCurriculum]);

  const calculateSemesterCredits = (courses: HybridCourse[]) => {
    return courses.reduce((sum, course) => sum + course.credits, 0);
  };

  // Format credits in Thai academic style (e.g., 3(3-0-6))
  const formatCredits = (credits: number) => {
    const lecture = credits;
    const lab = 0;
    const individual = credits * 2;
    return `${credits}(${lecture}-${lab}-${individual})`;
  };
  
  // Remove prefix from course code (INE-, INET-, IT-, ITI-, ITT-)
  const removeCodePrefix = (code: string) => {
    return code.replace(/^(INE-|INET-|IT-|ITI-|ITT-)/i, '');
  };

  // Create a flat list of all semesters for easier layout
  const semesterLayout = useMemo(() => {
    if (isLoading || !timelineData) return [];
    
    const layout: Array<{
      year: number;
      semester: number;
      courses: HybridCourse[];
      label: string;
      isInternship: boolean;
    }> = [];

    const isCoopCurriculum = selectedCurriculum.includes('COOP') || selectedCurriculum.includes('สหกิจ');

    Object.entries(timelineData)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, semesters]) => {
        Object.entries(semesters)
          .sort(([a], [b]) => Number(a) - Number(b))
          .forEach(([semester, courses]) => {
            let label = `เทอมที่ ${semester}`;
            let isInternship = false;

            // Special labeling for co-op curriculum
            if (isCoopCurriculum && Number(year) === 4) {
              if (semester === '1') {
                label = 'เทอมที่ 1';
                isInternship = true;
              } else if (semester === '2') {
                label = 'เทอมที่ 2';
                isInternship = true;
              }
            } else if (!isCoopCurriculum && semester === '3') {
              label = 'ฝึกงาน';
              isInternship = true;
            }

            layout.push({
              year: Number(year),
              semester: Number(semester),
              courses,
              label,
              isInternship
            });
          });
      });

    return layout;
  }, [selectedCurriculum, timelineData, isLoading]);

  // DIAGRAM ENGINE - Curriculum flowchart with prerequisite arrows
  // Following strict orthogonal routing rules through white gutters

  // Course layout constants
  // ตรวจสอบว่าหลักสูตรนี้มี semester 3 หรือไม่
  const hasSemester3 = semesterLayout.some(sem => sem.semester === 3);
  
  // ปรับขนาดให้ใหญ่ขึ้นสำหรับหลักสูตรที่มี semester 3
  const COURSE_WIDTH = 140;
  const COURSE_HEIGHT = hasSemester3 ? 90 : 100; // ลดความสูงเล็กน้อยเมื่อมี semester 3
  const GUTTER_WIDTH = 20;
  const GUTTER_HEIGHT = hasSemester3 ? 15 : 18; // ลด gutter เมื่อมี semester 3
  const CLEARANCE = 6;
  const LANE_WIDTH = 3;



  // Find prerequisite relationships
  const findPrerequisites = (course: Course) => {
    console.log('=== Timeline findPrerequisites called ===', course.code, course.name);
    const prereqIds: string[] = [];
    if (course.prerequisites && course.prerequisites.length > 0) {
      // กรอง prerequisites ที่เป็น 'โดยความเห็นชอบของภาควิชา' ออก
      const validPrerequisites = course.prerequisites.filter(prereq => 
        prereq !== 'โดยความเห็นชอบของภาควิชา' && 
        !prereq.includes('โดยความเห็นชอบของภาควิชา')
      );
      
      console.log(`Timeline Course ${course.code}: Original prereq:`, course.prerequisites);
      console.log(`Timeline Course ${course.code}: Valid prereq:`, validPrerequisites);
      
      // หากไม่มี prerequisites ที่ถูกต้องแล้ว ไม่แสดงเส้นเชื่อมโยง
      if (validPrerequisites.length === 0) {
        console.log(`Timeline Course ${course.code}: No valid prereq, returning empty`);
        return prereqIds;
      }
      
      // สำหรับ prerequisites ที่ถูกต้อง ให้แสดงเส้นเชื่อมโยงตามปกติ
      semesterLayout.forEach((semData) => {
        semData.courses.forEach((c) => {
          // ตรวจสอบการจับคู่อย่างแม่นยำ - เฉพาะรหัสวิชาที่ตรงกันเท่านั้น
          if (validPrerequisites.some(prereq => {
            const prereqCode = prereq.split(' ')[0]; // เอาเฉพาะรหัสวิชา
            const courseCode = c.code.split('-')[1] || c.code; // เอาเฉพาะรหัสวิชา
            return prereqCode === courseCode;
          })) {
            prereqIds.push(c.id);
          }
        });
      });
    }
    return prereqIds;
  };

  // Calculate precise course positions in the grid
  const getCourseRect = (semIndex: number, courseIndex: number) => {
    const x = semIndex * (COURSE_WIDTH + GUTTER_WIDTH);
    const y = courseIndex * (COURSE_HEIGHT + GUTTER_HEIGHT) + 60; // Header offset
    
    return {
      x,
      y,
      width: COURSE_WIDTH,
      height: COURSE_HEIGHT,
      centerX: x + COURSE_WIDTH / 2,
      centerY: y + COURSE_HEIGHT / 2,
      left: x,
      right: x + COURSE_WIDTH,
      top: y,
      bottom: y + COURSE_HEIGHT
    };
  };

  // Get connection ports for courses
  const getConnectionPorts = (rect: any) => ({
    topCenter: { x: rect.centerX, y: rect.top },
    bottomCenter: { x: rect.centerX, y: rect.bottom },
    rightCenter: { x: rect.right, y: rect.centerY },
    leftCenter: { x: rect.left, y: rect.centerY },
    leftUpper: { x: rect.left, y: rect.centerY - 12 },
    leftLower: { x: rect.left, y: rect.centerY + 12 }
  });

  // Check if a rectangular area overlaps with any course box
  const overlapsWithCourses = (x: number, y: number, width: number, height: number, excludeBoxes: string[] = []) => {
    return semesterLayout.some((semData, semIdx) =>
      semData.courses.some((course, courseIdx) => {
        if (excludeBoxes.includes(`${semIdx}-${courseIdx}`)) return false;
        
        const courseRect = getCourseRect(semIdx, courseIdx);
        return !(x >= courseRect.right + CLEARANCE || 
                x + width <= courseRect.left - CLEARANCE ||
                y >= courseRect.bottom + CLEARANCE || 
                y + height <= courseRect.top - CLEARANCE);
      })
    );
  };

  // Find available horizontal lanes in the gutter space
  const findHorizontalLane = (startRect: any, endRect: any, usedLanes: Set<string>) => {
    // Try direct horizontal connection first (same Y level)
    const directY = startRect.centerY;
    const laneKey = `h-${Math.round(directY)}`;
    
    if (!usedLanes.has(laneKey) && 
        !overlapsWithCourses(startRect.right, directY - 2, endRect.left - startRect.right, 4)) {
      usedLanes.add(laneKey);
      return directY;
    }
    
    // Try lanes above and below the course centers
    const testYPositions = [
      startRect.centerY - GUTTER_HEIGHT / 4,
      startRect.centerY + GUTTER_HEIGHT / 4,
      startRect.top - CLEARANCE,
      startRect.bottom + CLEARANCE,
      endRect.top - CLEARANCE,
      endRect.bottom + CLEARANCE
    ];
    
    for (const testY of testYPositions) {
      const testLaneKey = `h-${Math.round(testY)}`;
      if (!usedLanes.has(testLaneKey) && 
          !overlapsWithCourses(startRect.right, testY - 2, endRect.left - startRect.right, 4)) {
        usedLanes.add(testLaneKey);
        return testY;
      }
    }
    
    // Fallback to original Y
    return directY;
  };

  // Check if there are blocking courses between start and end points
  const hasBlockingCourses = (startX: number, endX: number, y: number, startSemIndex: number, endSemIndex: number) => {
    for (let semIdx = startSemIndex + 1; semIdx < endSemIndex; semIdx++) {
      const semData = semesterLayout[semIdx];
      if (!semData) continue;
      
      for (let courseIdx = 0; courseIdx < semData.courses.length; courseIdx++) {
        const courseRect = getCourseRect(semIdx, courseIdx);
        // Check if the horizontal line at y intersects this course box
        const linePassesThroughCourse = y >= courseRect.top - CLEARANCE && y <= courseRect.bottom + CLEARANCE;
        const lineIsInHorizontalRange = startX < courseRect.right && endX > courseRect.left;
        
        if (linePassesThroughCourse && lineIsInHorizontalRange) {
          return true;
        }
      }
    }
    return false;
  };

  // Generate strict orthogonal path with 90-degree turns through gutters
  const generateOrthogonalPath = (
    startSemIndex: number, startCourseIndex: number,
    endSemIndex: number, endCourseIndex: number,
    usedLanes: Set<string>,
    endPortType: string = 'leftCenter'
  ) => {
    const startRect = getCourseRect(startSemIndex, startCourseIndex);
    const endRect = getCourseRect(endSemIndex, endCourseIndex);
    const startPorts = getConnectionPorts(startRect);
    const endPorts = getConnectionPorts(endRect);

    // Always use right-center for start port
    let startPort = startPorts.rightCenter;
    // Use specified end port type (leftCenter, leftUpper, or leftLower)
    let endPort = endPorts[endPortType as keyof typeof endPorts];

    const pathPoints = [startPort];

    if (startSemIndex === endSemIndex) {
      // Same column - direct horizontal connection
      pathPoints.push(endPort);
    } else {
      // Check if direct horizontal path is blocked
      const isDirectPathBlocked = hasBlockingCourses(
        startPort.x, 
        endPort.x, 
        startPort.y, 
        startSemIndex, 
        endSemIndex
      );

      const verticalDistance = endPort.y - startPort.y;
      const isApproximatelySameLevel = Math.abs(verticalDistance) < CLEARANCE;

      if (isApproximatelySameLevel && !isDirectPathBlocked) {
        // Same level, no obstacles - direct horizontal line
        pathPoints.push(endPort);
      } else if (!isDirectPathBlocked) {
        // ไม่มีสิ่งกีดขวาง - ใช้เส้นทางตรงที่สุด
        // Step 1: Move horizontally into gutter space
        const gutterX = startPort.x + GUTTER_WIDTH / 2;
        pathPoints.push({ x: gutterX, y: startPort.y });
        
        // Step 2: เดินตรงไปยัง target column ที่ระดับเดียวกับ start
        const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
        pathPoints.push({ x: targetGutterX, y: startPort.y });
        
        // Step 3: ขึ้น/ลงตรงๆ ไปยัง target
        pathPoints.push({ x: targetGutterX, y: endPort.y });
        
        // Final connection to target
        pathPoints.push(endPort);
      } else {
        // มีสิ่งกีดขวาง - ต้องอ้อม
        
        // Step 1: Move horizontally into gutter space
        const gutterX = startPort.x + GUTTER_WIDTH / 2;
        pathPoints.push({ x: gutterX, y: startPort.y });
        
        // Step 2: Find safe vertical routing lane - center in gutters
        let routingY = endPort.y;
        
        // Route in center of gutters above or below the blocking courses
        const aboveY = Math.min(startRect.top, endRect.top) - GUTTER_HEIGHT / 2 - 3;
        const belowY = Math.max(startRect.bottom, endRect.bottom) + GUTTER_HEIGHT / 2 + 3;
        
        // ปรับเส้นทางตามตำแหน่งของ endPortType เพื่อลดการตัดกันของเส้น
        if (endPortType === 'leftUpper') {
          // สำหรับลูกศรที่เข้าด้านบน ให้เลือกเส้นทางด้านบน
          routingY = aboveY;
        } else if (endPortType === 'leftLower') {
          // สำหรับลูกศรที่เข้าด้านล่าง ให้เลือกเส้นทางด้านล่าง
          routingY = belowY;
        } else {
          // สำหรับลูกศรที่เข้าตรงกลาง ให้เลือกเส้นทางที่ใกล้ที่สุด
          if (Math.abs(aboveY - startPort.y) <= Math.abs(belowY - startPort.y)) {
            routingY = aboveY;
          } else {
            routingY = belowY;
          }
        }
        
        // Ensure minimum clearance from course boxes and center in gutter
        routingY = Math.max(routingY, 45); // Better minimum distance from top
        
        // Vertical segment to routing lane
        pathPoints.push({ x: gutterX, y: routingY });
        
        // Horizontal segment across to target column
        const targetGutterX = endPort.x - GUTTER_WIDTH / 2;
        pathPoints.push({ x: targetGutterX, y: routingY });
        
        // Vertical segment down to target level
        if (Math.abs(routingY - endPort.y) > CLEARANCE) {
          pathPoints.push({ x: targetGutterX, y: endPort.y });
        }
        
        // Final connection to target
        pathPoints.push(endPort);
      }
    }

    return pathPoints;
  };

  // ฟังก์ชันตรวจสอบว่าเส้นนี้เป็นเส้นพิเศษสีน้ำเงิน (วิศวกรรมข้อมูล -> เตรียมสหกิจศึกษา)
  const isSpecialBlueConnection = (prereqCourse: Course, targetCourse: Course) => {
    // ตรวจสอบว่าเป็นเส้นจาก 060233112 (วิศวกรรมข้อมูล) ไปยัง 060233501 (เตรียมสหกิจศึกษา)
    const prereqCode = prereqCourse.code.split('-')[1] || prereqCourse.code;
    const targetCode = targetCourse.code.split('-')[1] || targetCourse.code;
    
    return prereqCode === '060233112' && targetCode === '060233501';
  };

  // Collect all arrow data with collision-free routing
  const arrowData = useMemo(() => {
    const arrows: Array<{
      id: string;
      pathPoints: Array<{ x: number; y: number }>;
      isSpecial?: boolean; // เพิ่ม flag สำหรับเส้นพิเศษ
    }> = [];
    const usedLanes = new Set<string>();

    // สำหรับหลักสูตร INET 67 ใช้การแสดงเส้นทางแบบพิเศษ
    const isINET67 = selectedCurriculum.includes('INET 67');

    semesterLayout.forEach((semData, semIndex) => {
      semData.courses.forEach((course, courseIndex) => {
        const prereqIds = findPrerequisites(course);
        
        // สำหรับหลักสูตร INET 67 ตัดเส้นวงกลมสีแดงออก
        if (isINET67 && course.code === 'INET-060233214') {
          // ไม่แสดงเส้นวงกลมสีแดง - ข้ามการสร้างเส้นทางสำหรบวิชานี้
          return;
        } else {
          // ใช้ตำแหน่งลูกศรที่แตกต่างกันตามจำนวน prerequisites
          prereqIds.forEach((prereqId, prereqIndex) => {
            // Find prerequisite position
            let prereqSemIndex = -1;
            let prereqCourseIndex = -1;
            let prereqCourse: Course | null = null;
            
            semesterLayout.forEach((prevSem, prevSemIndex) => {
              const courseIdx = prevSem.courses.findIndex(c => c.id === prereqId);
              if (courseIdx !== -1 && prevSemIndex < semIndex) {
                prereqSemIndex = prevSemIndex;
                prereqCourseIndex = courseIdx;
                prereqCourse = prevSem.courses[courseIdx];
              }
            });

            if (prereqSemIndex >= 0 && prereqCourse) {
              // เลือกตำแหน่งลูกศรตามจำนวน prerequisites
              let endPortType = 'leftCenter';
              
              // ถ้ามี prerequisites มากกว่า 1 วิชา ให้ใช้ตำแหน่งที่แตกต่างกัน
              if (prereqIds.length > 1) {
                if (prereqIndex === 0) {
                  endPortType = 'leftUpper';
                } else if (prereqIndex === 1) {
                  endPortType = 'leftLower';
                } else {
                  // สำหรับกรณีที่มีมากกว่า 2 วิชา ให้ใช้ตำแหน่งกลาง
                  endPortType = 'leftCenter';
                }
              }
              
              const pathPoints = generateOrthogonalPath(
                prereqSemIndex, prereqCourseIndex,
                semIndex, courseIndex,
                usedLanes,
                endPortType
              );

              // ตรวจสอบว่าเป็นเส้นพิเศษหรือไม่
              const isSpecial = isSpecialBlueConnection(prereqCourse, course);

              arrows.push({
                id: `${prereqId}-${course.id}`,
                pathPoints,
                isSpecial
              });
            }
          });
        }
      });
    });

    return arrows;
  }, [semesterLayout, selectedCurriculum]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center bg-white p-4 border-b-2 border-black">
          <h1 className="text-lg font-bold">
            แผนภูมิแสดงความต่อเนื่อง{departmentName} 
            {selectedCurriculum.includes('สหกิจ') ? ' (สหกิจศึกษา)' : ` (ปี ${selectedCurriculum.split(' ')[1]})`}
          </h1>
        </div>
        <div className="bg-white p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลหลักสูตร...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center bg-white p-4 border-b-2 border-black">
        <h1 className="text-lg font-bold">
          แผนภูมิแสดงความต่อเนื่อง{departmentName} 
          {selectedCurriculum.includes('สหกิจ') ? ' (สหกิจศึกษา)' : ` (ปี ${selectedCurriculum.split(' ')[1]})`}
          {/* Show indicator if data is from Firebase */}
          {semesterLayout.some(sem => sem.courses.some(course => course.isUpdatedFromFirebase)) && (
            <span className="ml-2 text-sm text-green-600 font-normal">
              (อัปเดตล่าสุด)
            </span>
          )}
        </h1>
      </div>

      {/* Flowchart */}
      <div className="bg-white overflow-x-auto">
        <div className="inline-block min-w-full p-4">
          {/* Semester Headers */}
          <div className="relative mb-2" style={{ 
            height: '40px',
            width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`
          }}>
            {semesterLayout.map((semData, index) => (
              <div 
                key={`year-${semData.year}-sem-${semData.semester}`} 
                className="absolute text-center"
                style={{
                  left: `${index * (COURSE_WIDTH + GUTTER_WIDTH)}px`,
                  width: `${COURSE_WIDTH}px`,
                  top: '0px'
                }}
              >
                <div className="font-bold text-sm mb-1">
                  ปีที่ {semData.year} {semData.label}
                </div>
              </div>
            ))}
          </div>

          {/* Course Grid with SVG Arrows */}
          <div className="relative">
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ 
                minHeight: hasSemester3 ? '500px' : '600px',
                width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`,
                height: `${Math.max(...semesterLayout.map(s => s.courses.length)) * (COURSE_HEIGHT + GUTTER_HEIGHT) + (hasSemester3 ? 150 : 200)}px`
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="5.7"
                  markerHeight="4.75"
                  refX="5.5"
                  refY="2.375"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 5.7 2.375, 0 4.75"
                    fill="#555"
                  />
                </marker>
                <marker
                  id="blueArrowhead"
                  markerWidth="5.7"
                  markerHeight="4.75"
                  refX="5.5"
                  refY="2.375"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 5.7 2.375, 0 4.75"
                    fill="#1e40af"
                  />
                </marker>
              </defs>
              
              {/* Render orthogonal prerequisite arrows */}
              {arrowData.map((arrow, index) => {
                const pathString = arrow.pathPoints.map((point, pointIndex) => 
                  `${pointIndex === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                
                // ใช้สีน้ำเงินเข้มสำหรับเส้นพิเศษ, สีดำสำหรับเส้นอื่น
                const strokeColor = arrow.isSpecial ? "#1e40af" : "#555";
                
                return (
                  <path
                    key={`arrow-${index}`}
                    d={pathString}
                    stroke={strokeColor}
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {/* Course Boxes Grid - Fixed positioning to match arrow coordinates */}
            <div className="relative" style={{ 
              height: `${Math.max(...semesterLayout.map(s => s.courses.length)) * (COURSE_HEIGHT + GUTTER_HEIGHT) + (hasSemester3 ? 150 : 200)}px`,
              width: `${semesterLayout.length * (COURSE_WIDTH + GUTTER_WIDTH)}px`
            }}>
              {semesterLayout.map((semData, semIndex) => 
                semData.courses.map((course, courseIndex) => {
                  const rect = getCourseRect(semIndex, courseIndex);
                  
                  return (
                    <div
                      key={course.id}
                      id={`course-${course.id}`}
                      className="absolute border-2 border-black bg-white p-2 text-xs flex flex-col justify-between shadow-sm"
                      style={{ 
                        left: `${rect.x}px`,
                        top: `${rect.y}px`,
                        width: `${COURSE_WIDTH}px`,
                        height: `${COURSE_HEIGHT}px`
                      }}
                    >
                      {/* Course Code */}
                      <div className="font-bold text-center text-[12px] leading-tight px-2">
                        {removeCodePrefix(course.code)}
                      </div>
                      
                      {/* Course Name */}
                      <div className="text-center leading-tight flex-1 flex items-center justify-center px-1" style={{ fontSize: '10px' }}>
                        <span className="line-clamp-none overflow-hidden w-full">
                          {course.name}
                        </span>
                      </div>
                      
                      {/* Credits */}
                      <div className="text-center font-bold text-[10px]">
                        {formatCredits(course.credits)}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Credits Summary for each semester - aligned at bottom */}
              {semesterLayout.map((semData, semIndex) => {
                // Find the maximum number of courses in any semester for consistent alignment
                const maxCoursesInAnySemester = Math.max(...semesterLayout.map(s => s.courses.length));
                const rect = getCourseRect(semIndex, maxCoursesInAnySemester);
                
                return (
                  <div
                    key={`summary-${semIndex}`}
                    className="absolute text-center text-sm font-bold border-t-2 border-black pt-2 bg-white"
                    style={{
                      left: `${rect.x}px`,
                      top: `${rect.y + 10}px`,
                      width: `${COURSE_WIDTH}px`
                    }}
                  >
                    {calculateSemesterCredits(semData.courses)} หน่วยกิต
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 border-2 border-black">
        <div className="text-center">
          <h3 className="font-bold mb-2">สรุปหลักสูตร</h3>
          <div className="flex justify-center space-x-8 text-sm">
            <div>
              <span className="font-bold">ระยะเวลา:</span> {Object.keys(timelineData).length} ปี
            </div>
            <div>
              <span className="font-bold">หน่วยกิตรวม:</span> {
                Object.values(timelineData).reduce((total, year) => 
                  total + Object.values(year).reduce((yearTotal, courses) => 
                    yearTotal + courses.reduce((sum, course) => sum + course.credits, 0), 0
                  ), 0
                )
              } หน่วยกิต
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};