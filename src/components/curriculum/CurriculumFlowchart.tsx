import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Department, Curriculum, Course } from '@/types/course';
import { generateCoursesForSemester } from '@/services/completeCurriculumData';
import { ArrowDown, BookOpen } from 'lucide-react';

interface CurriculumFlowchartProps {
  selectedDepartment: string;
  selectedCurriculum: string;
  departmentName: string;
}

export const CurriculumFlowchart: React.FC<CurriculumFlowchartProps> = ({ 
  selectedDepartment, 
  selectedCurriculum, 
  departmentName 
}) => {
  const getCategoryBadge = (category: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full";
    switch (category) {
      case 'core': return <Badge variant="default" className={baseClasses}>วิชาแกน</Badge>;
      case 'free': return <Badge className={`bg-orange-500/90 hover:bg-orange-500/80 text-white ${baseClasses}`}>วิชาเสรี</Badge>;
      case 'general': return <Badge variant="outline" className={baseClasses}>ศึกษาทั่วไป</Badge>;
      default: return <Badge variant="outline" className={baseClasses}>{category}</Badge>;
    }
  };

  // Generate real course data based on selected curriculum
  const coursesByYear = useMemo(() => {
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
    
    const grouped: { [key: number]: { [key: number]: Course[] } } = {};
    
    // Check if this is a co-op curriculum
    const isCoopCurriculum = selectedCurriculum.includes('COOP') || selectedCurriculum.includes('สหกิจ');
    
    // Determine max year based on program
    const maxYear = programCode === 'INET' ? 3 : programCode === 'ITI' || programCode === 'ITT' ? 2 : 4;
    
    for (let year = 1; year <= maxYear; year++) {
      grouped[year] = {};
      
      // Regular semesters (1 and 2)
      for (let semester = 1; semester <= 2; semester++) {
        const courses = generateCoursesForSemester(programCode, curriculumYear, year.toString(), semester.toString(), 15);
        if (courses.length > 0) {
          grouped[year][semester] = courses;
        }
      }
      
      // Special semester 3 for specific programs (skip for co-op curricula)
      if (!isCoopCurriculum && (programCode === 'IT' || programCode === 'INE') && year === 3) {
        const courses = generateCoursesForSemester(programCode, curriculumYear, year.toString(), '3', 15);
        if (courses.length > 0) {
          grouped[year][3] = courses;
        }
      }
      
      if (programCode === 'INET' && year === 2) {
        const courses = generateCoursesForSemester(programCode, curriculumYear, year.toString(), '3', 15);
        if (courses.length > 0) {
          grouped[year][3] = courses;
        }
      }
      
      if (programCode === 'ITI' && year === 1) {
        const courses = generateCoursesForSemester(programCode, curriculumYear, year.toString(), '3', 15);
        if (courses.length > 0) {
          grouped[year][3] = courses;
        }
      }
    }
    
    return grouped;
  }, [selectedCurriculum]);

  // Calculate credits for each semester
  const calculateSemesterCredits = (courses: Course[]) => {
    return courses.reduce((sum, course) => sum + course.credits, 0);
  };

  // Calculate total credits and course count
  const totalCredits = useMemo(() => {
    let total = 0;
    Object.values(coursesByYear).forEach(yearData => {
      Object.values(yearData).forEach(courses => {
        total += courses.reduce((sum, course) => sum + course.credits, 0);
      });
    });
    return total;
  }, [coursesByYear]);

  const totalCourses = useMemo(() => {
    let total = 0;
    Object.values(coursesByYear).forEach(yearData => {
      Object.values(yearData).forEach(courses => {
        total += courses.length;
      });
    });
    return total;
  }, [coursesByYear]);

  const totalSemesters = useMemo(() => {
    let total = 0;
    Object.values(coursesByYear).forEach(yearData => {
      total += Object.keys(yearData).length;
    });
    return total;
  }, [coursesByYear]);

  // Find prerequisites within the curriculum
  const findPrerequisiteConnections = (course: Course) => {
    console.log('=== findPrerequisiteConnections called ===', course.code, course.name);
    const connections: Course[] = [];
    if (course.prerequisites && course.prerequisites.length > 0) {
      // กรอง prerequisites ที่เป็น 'โดยความเห็นชอบของภาควิชา' ออก
      const validPrerequisites = course.prerequisites.filter(prereq => 
        prereq !== 'โดยความเห็นชอบของภาควิชา' && 
        !prereq.includes('โดยความเห็นชอบของภาควิชา')
      );
      
      console.log(`Course ${course.code}: Original prerequisites:`, course.prerequisites);
      console.log(`Course ${course.code}: Valid prerequisites:`, validPrerequisites);
      
      // หากไม่มี prerequisites ที่ถูกต้องแล้ว ไม่แสดงเส้นเชื่อมโยง
      if (validPrerequisites.length === 0) {
        console.log(`Course ${course.code}: No valid prerequisites, returning empty connections`);
        return connections;
      }
      
      // สำหรับ prerequisites ที่ถูกต้อง ให้แสดงเส้นเชื่อมโยงตามปกติ
      Object.values(coursesByYear).forEach(yearData => {
        Object.values(yearData).forEach(courses => {
          courses.forEach(prereqCourse => {
            // ตรวจสอบการจับคู่อย่างแม่นยำ - เฉพาะรหัสวิชาที่ตรงกันเท่านั้น
            if (validPrerequisites.some(prereq => {
              const prereqCode = prereq.split(' ')[0]; // เอาเฉพาะรหัสวิชา
              const courseCode = prereqCourse.code.split('-')[1] || prereqCourse.code; // เอาเฉพาะรหัสวิชา
              return prereqCode === courseCode;
            })) {
              connections.push(prereqCourse);
            }
          });
        });
      });
    }
    return connections;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
          แผนผังหลักสูตร {departmentName}
        </h2>
        <p className="text-lg text-muted-foreground">หลักสูตร {selectedCurriculum}</p>
        <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <span>ระยะเวลา: {Object.keys(coursesByYear).length} ปี</span>
          <span>หน่วยกิต: {totalCredits} หน่วยกิต</span>
        </div>
      </div>

      {/* Years and Semesters */}
      <div className="space-y-8">
        {Object.entries(coursesByYear)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, semesters]) => (
            <Card key={year} className="shadow-medium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-xl text-center">
                  ปีที่ {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(semesters)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([semester, courses]) => (
                      <div key={semester} className="space-y-4">
                        {/* Semester Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-primary">
                            เทอมที่ {semester}
                            {semester === '3' && ' (ฝึกงาน)'}
                          </h3>
                          <Badge variant="secondary" className="text-sm">
                            {calculateSemesterCredits(courses)} หน่วยกิต
                          </Badge>
                        </div>

                        {/* Courses Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {courses.map((course) => {
                            const prerequisites = findPrerequisiteConnections(course);
                            console.log('=== Course in flowchart ===', course.code, 'Prerequisites found:', prerequisites.length);
                            if (course.prerequisites) {
                              console.log('Raw prerequisites:', course.prerequisites);
                            }
                            const courseId = `course-${course.code.replace(/[^a-zA-Z0-9]/g, '')}`;
                            
                            return (
                              <div key={course.id} className="relative">
                                <Card 
                                  id={courseId}
                                  className="shadow-soft hover:shadow-medium transition-all duration-300 border-l-4 border-l-primary/30 h-40 flex flex-col"
                                >
                                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between flex-1">
                                      <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                                          <span className="font-mono font-bold text-xs truncate">
                                            {course.code.split('-')[1] || course.code}
                                          </span>
                                        </div>
                                        <h4 className="font-medium text-sm leading-tight line-clamp-3 flex-1">
                                          {course.name}
                                        </h4>
                                      </div>
                                      <div className="text-right space-y-1 ml-2 flex-shrink-0">
                                        {getCategoryBadge(course.category)}
                                        <div className="text-xs text-muted-foreground">
                                          {course.credits} หน่วยกิต
                                        </div>
                                      </div>
                                    </div>

                                    {/* Prerequisites indicator */}
                                    {prerequisites.length > 0 && (
                                      <div className="space-y-2 mt-auto">
                                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                          <ArrowDown className="w-3 h-3" />
                                          <span>วิชาบังคับก่อน:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {prerequisites.slice(0, 1).map((prereq) => (
                                            <Badge key={prereq.id} variant="outline" className="text-xs px-1 py-0.5 max-w-full truncate">
                                              <span className="truncate">{prereq.code.split('-')[1] || prereq.code}: {prereq.name}</span>
                                            </Badge>
                                          ))}
                                          {prerequisites.length > 1 && (
                                            <Badge variant="outline" className="text-xs px-1 py-0.5">
                                              +{prerequisites.length - 1}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Summary */}
      <Card className="shadow-medium bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              สรุปหลักสูตร
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2 bg-white/80 rounded-lg p-4 shadow-soft">
                <div className="text-3xl font-bold text-emerald-600">{totalCredits}</div>
                <div className="text-sm text-muted-foreground">หน่วยกิตรวม</div>
              </div>
              <div className="space-y-2 bg-white/80 rounded-lg p-4 shadow-soft">
                <div className="text-3xl font-bold text-blue-600">{Object.keys(coursesByYear).length}</div>
                <div className="text-sm text-muted-foreground">ปี</div>
              </div>
              <div className="space-y-2 bg-white/80 rounded-lg p-4 shadow-soft">
                <div className="text-3xl font-bold text-purple-600">{totalSemesters}</div>
                <div className="text-sm text-muted-foreground">เทอม</div>
              </div>
              <div className="space-y-2 bg-white/80 rounded-lg p-4 shadow-soft">
                <div className="text-3xl font-bold text-orange-600">{totalCourses}</div>
                <div className="text-sm text-muted-foreground">รายวิชา</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};