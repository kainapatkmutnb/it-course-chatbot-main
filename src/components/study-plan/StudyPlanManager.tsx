import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { courseDatabase } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
import { 
  BookOpen, 
  Calendar, 
  Target,
  Trophy,
} from 'lucide-react';
import { 
  calculateGPA, 
  getAvailableGrades, 
  getGPAColor 
} from '@/utils/gradeUtils';

interface CurriculumCourse {
  code: string;
  name: string;
  credits: number;
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory?: string;
  subCategory?: string;
  prerequisites?: string[];
  year: number;
  semester: number;
}

interface StudentCourse {
  id: string;
  code: string;
  originalName: string;
  customName?: string;
  credits: number;
  year: number;
  semester: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  grade?: string;
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory?: string;
  subCategory?: string;
  prerequisites?: string[];
  isElective?: boolean;
}

interface StudyPlan {
  id: string;
  studentId: string;
  studentEmail: string;
  program: string;
  curriculumYear: string;
  isLocked: boolean;
  courses: StudentCourse[];
  totalCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanManager: React.FC = () => {
  const { user } = useAuth();
  
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [availableCurriculumYears, setAvailableCurriculumYears] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>('');
  const [curriculumCourses, setCurriculumCourses] = useState<CurriculumCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const programs = Object.keys(courseDatabase);
      setAvailablePrograms(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('เกิดข้อผิดพลาดในการโหลดหลักสูตร');
    }
  }, []);
  
  useEffect(() => {
    if (selectedProgram) {
      try {
        const years = Object.keys(courseDatabase[selectedProgram] || {});
        setAvailableCurriculumYears(years);
        if (years.length > 0 && !selectedCurriculumYear) {
          setSelectedCurriculumYear(years[0]);
        }
      } catch (err) {
        console.error('Error loading curriculum years:', err);
        setError('เกิดข้อผิดพลาดในการโหลดปีหลักสูตร');
      }
    }
  }, [selectedProgram]);
  
  useEffect(() => {
    if (selectedProgram && selectedCurriculumYear) {
      try {
        const courses: CurriculumCourse[] = [];
        const programData = courseDatabase[selectedProgram]?.[selectedCurriculumYear];
        
        if (programData) {
          Object.entries(programData).forEach(([semesterKey, semesterCourses]: [string, any]) => {
            if (Array.isArray(semesterCourses)) {
              const [year, semester] = semesterKey.split('-').map(Number);
              semesterCourses.forEach((course: any) => {
                courses.push({
                  ...course,
                  year,
                  semester
                });
              });
            }
          });
        }
        
        setCurriculumCourses(courses);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('เกิดข้อผิดพลาดในการโหลดรายวิชา');
      }
    }
  }, [selectedProgram, selectedCurriculumYear]);
  
  const isInternshipCourse = useCallback((course: Pick<StudentCourse, 'code' | 'originalName' | 'subCategory'>): boolean => {
    const code = (course.code || '').trim();
    const name = (course.originalName || '').trim();
    const subCategory = course.subCategory || '';
    const isInternshipCategory = subCategory === 'กลุ่มวิชาฝึกงาน/สหกิจศึกษา';
    const looksLikeInternship = name.includes('ฝึกงาน') || name.includes('ฝึกปฏิบัติงาน');
    const isInternshipCode = code.includes('060233403');
    const isCoop = name.includes('สหกิจ');
    const isProject = name.includes('โครงงาน');
    return (isInternshipCode || (isInternshipCategory && looksLikeInternship)) && !isCoop && !isProject;
  }, []);

  const extractCodeToken = useCallback((text: string): { full?: string; digits?: string } | null => {
    const t = (text || '').trim();
    if (!t) return null;
    if (t.includes('โดยความเห็นชอบ')) return null;
    if (t.includes('ความเห็นชอบของภาควิชา')) return null;
    if (t.includes('ตามความเห็นชอบ')) return null;

    const full = t.match(/[A-Z]{2,6}-\d{6,9}/)?.[0];
    const digits = t.match(/\d{6,9}/)?.[0];
    if (!full && !digits) return null;
    return { ...(full ? { full } : {}), ...(digits ? { digits } : {}) };
  }, []);

  const buildCourseIndex = useCallback((courses: StudentCourse[]) => {
    const byDigits = new Map<string, StudentCourse>();
    const byFull = new Map<string, StudentCourse>();
    for (const c of courses) {
      const code = (c.code || '').trim();
      if (code) byFull.set(code, c);
      const digits = code.match(/\d{6,9}/)?.[0];
      if (digits) byDigits.set(digits, c);
    }
    return { byDigits, byFull };
  }, []);

  const getPrerequisiteIssues = useCallback((course: StudentCourse, allCourses: StudentCourse[]) => {
    const prerequisites = course.prerequisites || [];
    if (prerequisites.length === 0) {
      return { missing: [] as string[], failed: [] as string[] };
    }

    const { byDigits, byFull } = buildCourseIndex(allCourses);
    const missing: string[] = [];
    const failed: string[] = [];

    for (const prereq of prerequisites) {
      const token = extractCodeToken(prereq);
      if (!token) continue;

      const target =
        (token.full ? byFull.get(token.full) : undefined) ||
        (token.digits ? byDigits.get(token.digits) : undefined);

      if (!target) continue;

      const grade = (target.grade || '').trim().toUpperCase();
      if (!grade) {
        missing.push(target.code);
        continue;
      }
      if (grade === 'F' || grade === 'U') {
        failed.push(target.code);
      } else if (grade === 'I' || grade === 'W') {
        missing.push(target.code);
      }
    }

    return { missing, failed };
  }, [buildCourseIndex, extractCodeToken]);

  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!user?.id) return;
      
      try {
        const existingPlan = await firebaseService.getStudyPlanByStudentId(user.id);
        
        if (existingPlan && existingPlan.program && existingPlan.curriculumYear) {
          const convertedCourses: StudentCourse[] = (existingPlan.courses || []).map((course: any) => {
            let code = course.code || 'N/A';
            const originalName = course.originalName || course.name || 'N/A';
            
            // Auto-correct wrong course code for language elective 3 in INE 62
            if (existingPlan.program === 'INE' && 
                (existingPlan.curriculumYear === '62' || existingPlan.curriculumYear === '62 สหกิจ') &&
                course.year === 2 && 
                course.semester === 1 && 
                (code.trim() === 'INE-080303xxx' || code.trim() === '080303xxx')) {
              code = 'INE-080103xxx  ';
            }

            const subCategory = course.subCategory;
            const internship = isInternshipCourse({ code, originalName, subCategory });
            let status = course.status || 'planned';
            let grade = course.grade || '';

            if (internship) {
              if (status === 'completed' && !grade) {
                grade = 'S';
              } else if (grade !== 'S') {
                grade = '';
              }
            }

            // Sync status with grade if grade is set
            if (grade) {
              if (grade === 'F' || grade === 'U') {
                status = 'failed';
              } else if (grade === 'I' || grade === 'W') {
                status = 'in_progress';
              } else {
                status = 'completed'; // A, B+, B, C+, C, D+, D, S
              }
            } else {
              // No grade: cannot be completed or failed
              if (status === 'completed' || status === 'failed') {
                status = 'planned';
              }
            }

            return {
              id: course.id || `course-${Date.now()}-${Math.random()}`,
              code,
              originalName,
              customName: course.customName,
              credits: course.credits || 0,
              year: course.year || 1,
              semester: course.semester || 1,
              status,
              grade,
              category: course.category || 'core',
              mainCategory: course.mainCategory,
              subCategory,
              prerequisites: course.prerequisites || [],
              isElective: course.isElective || course.category === 'elective' || course.category === 'general' || course.category === 'free' || course.subCategory === 'กลุ่มวิชาชีพ' || ((originalName || '').includes('วิชาเลือก'))
            };
          });
          setStudyPlan({
            id: existingPlan.id,
            studentId: user.id,
            studentEmail: existingPlan.studentEmail || user.email || '',
            program: existingPlan.program,
            curriculumYear: existingPlan.curriculumYear,
            isLocked: existingPlan.isLocked !== false,
            courses: convertedCourses,
            totalCredits: existingPlan.totalCredits || 0,
            createdAt: new Date(existingPlan.createdAt),
            updatedAt: new Date(existingPlan.updatedAt)
          });
        }
      } catch (err) {
        console.error('Error loading study plan:', err);
        setError('เกิดข้อผิดพลาดในการโหลดแผนการเรียน');
      }
    };
    
    loadStudyPlan();
  }, [user?.id, user?.email, isInternshipCourse]);

  const updateCourseGrade = useCallback((courseId: string, grade: string) => {
    if (!studyPlan) return;
    
    const course = studyPlan.courses.find(c => c.id === courseId);
    if (!course) return;

    const prereqIssues = getPrerequisiteIssues(course, studyPlan.courses);
    if (prereqIssues.missing.length > 0) {
      alert(`วิชานี้มีวิชาที่ต้องเรียนก่อน\nกรุณาใส่เกรดวิชา prerequisite ก่อน: ${prereqIssues.missing.join(', ')}`);
      return;
    }
    if (prereqIssues.failed.length > 0) {
      alert(`ไม่สามารถใส่เกรดได้ เพราะวิชาที่ต้องก่อนเรียน (${prereqIssues.failed.join(', ')}) ติด F`);
      return;
    }

    if (isInternshipCourse(course) && grade !== '' && grade !== 'S') {
      alert('วิชาฝึกงานให้ใส่ได้เฉพาะ S (ผ่าน) เท่านั้น และไม่นับใน GPA');
      return;
    }
    
    const updatedCourses = studyPlan.courses.map(c => {
      if (c.id !== courseId) return c;
      
      let status: 'planned' | 'in_progress' | 'completed' | 'failed' = 'planned';
      if (grade) {
        if (grade === 'F' || grade === 'U') {
          status = 'failed';
        } else if (grade === 'I' || grade === 'W') {
          status = 'in_progress';
        } else {
          status = 'completed'; // A, B+, B, C+, C, D+, D, S
        }
      }
      
      return {
        ...c,
        grade,
        status
      };
    });
    
    const newTotalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    
    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      totalCredits: newTotalCredits,
      updatedAt: new Date()
    } : null);
    
    saveToFirebase({ courses: updatedCourses, totalCredits: newTotalCredits });
  }, [studyPlan, isInternshipCourse, getPrerequisiteIssues]);
  
  const updateCustomCourseName = useCallback((courseId: string, customName: string) => {
    if (!studyPlan) return;
    
    const updatedCourses = studyPlan.courses.map(c => 
      c.id === courseId ? { ...c, customName } : c
    );
    
    setStudyPlan(prev => prev ? {
      ...prev,
      courses: updatedCourses,
      updatedAt: new Date()
    } : null);
    
    saveToFirebase({ courses: updatedCourses });
  }, [studyPlan]);
  
  const saveToFirebase = useCallback(async (updates: Partial<StudyPlan>) => {
    if (!studyPlan) return;
    try {
      const coursesForFirebase = (updates.courses || studyPlan.courses).map(course => {
        const internship = isInternshipCourse(course);
        const grade = internship ? (course.grade ? 'S' : '') : course.grade;
        return {
          ...course,
          grade,
          name: course.customName || course.originalName,
          prerequisites: course.prerequisites || []
        };
      });

      const planId = studyPlan.id && !studyPlan.id.startsWith('plan-') ? studyPlan.id : null;
      if (planId) {
        await firebaseService.updateStudyPlan(planId, {
          ...updates,
          courses: coursesForFirebase
        });
        return;
      }

      const existingPlan = await firebaseService.getStudyPlanByStudentId(studyPlan.studentId);
      if (!existingPlan) return;
      await firebaseService.updateStudyPlan(existingPlan.id, {
        ...updates,
        courses: coursesForFirebase
      });
    } catch (err) {
      console.error('Error saving to Firebase:', err);
    }
  }, [studyPlan, isInternshipCourse]);
  
  const createStudyPlan = useCallback(async () => {
    if (!user?.id || !selectedProgram || !selectedCurriculumYear || curriculumCourses.length === 0) {
      alert('กรุณาเลือกหลักสูตรและปีหลักสูตรให้ครบถ้วน');
      return;
    }
    
    try {
      const initialCourses: StudentCourse[] = curriculumCourses.map((course, index) => ({
        id: `course-${Date.now()}-${index}`,
        code: course.code,
        originalName: course.name,
        credits: course.credits,
        year: course.year,
        semester: course.semester,
        status: 'planned',
        category: course.category,
        mainCategory: course.mainCategory,
        subCategory: course.subCategory,
        prerequisites: course.prerequisites || [],
        isElective: course.category === 'elective' || course.category === 'general' || course.category === 'free' || course.subCategory === 'กลุ่มวิชาชีพ' || ((course.name || '').includes('วิชาเลือก'))
      }));
      
      const newPlan: StudyPlan = {
        id: '',
        studentId: user.id,
        studentEmail: user.email || '',
        program: selectedProgram,
        curriculumYear: selectedCurriculumYear,
        isLocked: true,
        courses: initialCourses,
        totalCredits: initialCourses.reduce((sum, c) => sum + (c.credits || 0), 0),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const coursesForFirebase = initialCourses.map(course => ({
        ...course,
        name: course.originalName,
        prerequisites: course.prerequisites || []
      }));
      const planId = await firebaseService.createStudyPlan({
        studentId: newPlan.studentId,
        studentEmail: newPlan.studentEmail,
        program: newPlan.program,
        curriculumYear: newPlan.curriculumYear,
        isLocked: newPlan.isLocked,
        courses: coursesForFirebase,
        totalCredits: newPlan.totalCredits
      });
      if (!planId) {
        throw new Error('ไม่สามารถบันทึกแผนการเรียนได้');
      }

      setStudyPlan({ ...newPlan, id: planId });
    } catch (err) {
      console.error('Error creating study plan:', err);
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
    }
  }, [user?.id, user?.email, selectedProgram, selectedCurriculumYear, curriculumCourses]);

  const resetStudyPlan = useCallback(async () => {
    if (!user?.id) return;
    const confirmed = window.confirm('ต้องการรีเซ็ตแผนการเรียนใช่ไหม?\nข้อมูลแผนการเรียนและเกรดที่บันทึกไว้จะถูกลบออกจากระบบ และต้องเลือกหลักสูตรใหม่อีกครั้ง');
    if (!confirmed) return;

    try {
      const ok = await firebaseService.deleteStudyPlansByStudentId(user.id);
      if (!ok) {
        alert('รีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setStudyPlan(null);
      setSelectedProgram('');
      setSelectedCurriculumYear('');
      setAvailableCurriculumYears([]);
      setCurriculumCourses([]);
      setError(null);
    } catch (err) {
      console.error('Error resetting study plan:', err);
      alert('รีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }, [user?.id]);
  
  const completedCourses = studyPlan?.courses?.filter(c => c.status === 'completed') || [];
  const inProgressCourses = studyPlan?.courses?.filter(c => c.status === 'in_progress') || [];
  const plannedCourses = studyPlan?.courses?.filter(c => c.status === 'planned') || [];
  const completedCredits = completedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const gpaResult = calculateGPA(completedCourses.filter(c => c.grade && !isInternshipCourse(c)) as any);
  
  const groupedCourses = studyPlan?.courses?.reduce((acc, course) => {
    const key = `${course.year}-${course.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, StudentCourse[]>) || {};
  
  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!studyPlan) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">เลือกหลักสูตรของคุณ</h2>
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>หลักสูตร</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map(program => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>ปีหลักสูตร</Label>
              <Select 
                value={selectedCurriculumYear} 
                onValueChange={setSelectedCurriculumYear}
                disabled={!selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกปีหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurriculumYears.map(year => (
                    <SelectItem key={year} value={year}>
                      หลักสูตร {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={createStudyPlan}
              disabled={!selectedProgram || !selectedCurriculumYear || curriculumCourses.length === 0}
              className="w-full"
            >
              ยืนยันและสร้างแผนการเรียน
            </Button>
          </CardContent>
        </Card>
        
        {curriculumCourses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่างรายวิชา ({curriculumCourses.length} วิชา)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {curriculumCourses.slice(0, 10).map(course => (
                  <div key={course.code} className="p-2 bg-muted rounded text-sm">
                    {course.code} - {course.name} ({course.credits} หน่วยกิต)
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการแผนการเรียน</h2>
          <p className="text-muted-foreground">
            หลักสูตร: {studyPlan.program} | ปีหลักสูตร: {studyPlan.curriculumYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={resetStudyPlan}>
            รีเซ็ตหลักสูตร
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">รายวิชาทั้งหมด</p>
                <p className="text-2xl font-bold">{studyPlan.courses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">เรียนจบแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{completedCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">กำลังเรียน</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">วางแผนเรียน</p>
                <p className="text-2xl font-bold text-orange-600">{plannedCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">เกรดเฉลี่ย (GPA)</p>
                <p className={`text-2xl font-bold ${getGPAColor(gpaResult.gpa)}`}>
                  {gpaResult.gpa > 0 ? gpaResult.gpa.toFixed(2) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {[1, 2, 3, 4].map(year => (
        <div key={year} className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2">ปีที่ {year}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].filter(sem => !(year === 4 && sem === 3)).map(semester => {
              const key = `${year}-${semester}`;
              const courses = groupedCourses[key] || [];
              
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle>ภาคเรียนที่ {semester}</CardTitle>
                    <CardDescription>
                      {courses.length} วิชา | {courses.reduce((sum, c) => sum + (c.credits || 0), 0)} หน่วยกิต
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courses.map(course => (
                      <div key={course.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {course.code} - {course.customName || course.originalName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {course.credits} หน่วยกิต
                              {course.mainCategory && ` | ${course.mainCategory}`}
                            </div>
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                เงื่อนไขก่อนเรียน: {course.prerequisites.join(', ')}
                              </div>
                            )}
                            {(() => {
                              const issues = getPrerequisiteIssues(course, studyPlan.courses);
                              if (issues.missing.length > 0) {
                                return (
                                  <div className="text-xs text-red-600 mt-1">
                                    ต้องใส่เกรดวิชาก่อนเรียนก่อน: {issues.missing.join(', ')}
                                  </div>
                                );
                              }
                              if (issues.failed.length > 0) {
                                return (
                                  <div className="text-xs text-red-600 mt-1">
                                    วิชาก่อนเรียนติด F: {issues.failed.join(', ')}
                                  </div>
                                );
                              }
                              if (course.prerequisites && course.prerequisites.length > 0) {
                                const validPrereqs = course.prerequisites.filter(p => 
                                  !p.includes('โดยความเห็นชอบ') && 
                                  !p.includes('ความเห็นชอบของภาควิชา') && 
                                  !p.includes('ตามความเห็นชอบ')
                                );
                                if (validPrereqs.length > 0) {
                                  return (
                                    <div className="text-xs text-green-600 mt-1 font-medium">
                                      สามารถลงเกรดได้ เนื่องจากผ่านวิชา {validPrereqs.join(', ')} แล้ว
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                          <Badge 
                            className={
                              course.status === 'completed' ? 'bg-green-100 text-green-800' :
                              course.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              course.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {course.status === 'completed' ? 'เรียนจบ' :
                             course.status === 'in_progress' ? 'กำลังเรียน' :
                             course.status === 'failed' ? 'ไม่ผ่าน' :
                             'วางแผน'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {(course.isElective || course.subCategory === 'กลุ่มวิชาชีพ' || (course.originalName || '').includes('วิชาเลือก')) && (
                            <div className="space-y-1">
                              <Label className="text-xs">ชื่อวิชา (ถ้าต้องการแก้ไข)</Label>
                              <Input
                                value={course.customName || ''}
                                onChange={(e) => updateCustomCourseName(course.id, e.target.value)}
                                placeholder="ใส่ชื่อวิชา"
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <Label className="text-xs">เกรด</Label>
                            <Select 
                              value={isInternshipCourse(course) ? (course.grade === 'S' ? 'S' : 'none') : (course.grade || 'none')}
                              onValueChange={(value) => {
                                if (isInternshipCourse(course)) {
                                  updateCourseGrade(course.id, value === 'none' ? '' : 'S');
                                  return;
                                }
                                updateCourseGrade(course.id, value === 'none' ? '' : value);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="เลือกเกรด" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {isInternshipCourse(course) ? (
                                  <SelectItem value="S">S</SelectItem>
                                ) : (
                                  getAvailableGrades().map(grade => (
                                    <SelectItem key={grade} value={grade}>
                                      {grade}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {courses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        ไม่มีรายวิชาในภาคเรียนนี้
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudyPlanManager;
