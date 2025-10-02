import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartments, useCourses } from '@/hooks/useFirebaseData';
import { generateCoursesForSemester, courseDatabase } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
import { 
  getAllCourses, 
  getCoursesByProgram, 
  filterCourses, 
  getAvailablePrograms, 
  getAvailableCurriculumYears,
  searchCourses,
  CourseWithProgram,
  CourseFilter
} from '@/services/courseService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Search,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { Course, StudentCourse } from '@/types/course';
import { 
  calculateGPA, 
  getGradePoint, 
  getAvailableGrades, 
  getGradeColor,
  getGPAColor 
} from '@/utils/gradeUtils';

interface CustomCourse {
  id: string;
  courseId?: string;
  code: string;
  name: string;
  credits: number;
  year: number;
  semester: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  grade?: string;
  type: 'required' | 'elective' | 'general';
  category?: string;
  description?: string;
  mainCategory?: string;
  subCategory?: string;
  prerequisites?: string[];
  corequisites?: string[];
}

interface CustomStudyPlan {
  id: string;
  studentEmail: string;
  planName: string;
  totalCredits: number;
  courses: CustomCourse[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanManager: React.FC = () => {
  const { user } = useAuth();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { courses, loading: coursesLoading } = useCourses();
  
  // State for custom study plan
  const [customPlan, setCustomPlan] = useState<CustomStudyPlan>({
    id: '',
    studentEmail: user?.email || '',
    planName: 'แผนการเรียนของฉัน',
    totalCredits: 0,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // State for course management
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CustomCourse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New course form state
  const [newCourse, setNewCourse] = useState<Partial<CustomCourse>>({
    code: '',
    name: '',
    credits: 3,
    year: 1,
    semester: 1,
    status: 'planned',
    type: 'required',
    description: ''
  });

  // New state for course selection from curriculum data
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState('67');
  const [selectedProgram, setSelectedProgram] = useState('IT');
  const [courseSelectionMode, setCourseSelectionMode] = useState<'manual' | 'curriculum'>('curriculum');
  const [selectedCourseFromCurriculum, setSelectedCourseFromCurriculum] = useState<string>('');
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [availableCurriculumYears, setAvailableCurriculumYears] = useState<string[]>([]);
  
  // New state for year and semester filtering
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Initialize available programs and curriculum years
  useEffect(() => {
    const programs = Object.keys(courseDatabase);
    setAvailablePrograms(programs);
    
    if (programs.length > 0 && !programs.includes(selectedProgram)) {
      setSelectedProgram(programs[0]);
    }
  }, []);

  // Update available curriculum years when program changes
  useEffect(() => {
    const curriculumYears = Object.keys(courseDatabase[selectedProgram] || {});
    setAvailableCurriculumYears(curriculumYears);
    
    if (curriculumYears.length > 0 && !selectedCurriculumYear) {
      setSelectedCurriculumYear(curriculumYears[0]);
    }
  }, [selectedProgram]);

  // Update available courses when filters change
  useEffect(() => {
    const loadCourses = async () => {
      if (courseSelectionMode === 'curriculum') {
        const allCourses: any[] = [];
        
        // 1. Get courses from curriculum data (completeCurriculumData.ts)
        const programData = courseDatabase[selectedProgram]?.[selectedCurriculumYear];
        if (programData) {
          // Extract courses from semester-based structure (e.g., "1-1", "1-2", "2-1", "2-2")
          Object.entries(programData).forEach(([semesterKey, courses]: [string, any]) => {
            if (Array.isArray(courses)) {
              const [year, semester] = semesterKey.split('-').map(Number);
              courses.forEach((course: any) => {
                allCourses.push({
                  ...course,
                  id: course.code || `${course.name}_${Math.random()}`,
                  year: year,
                  semester: semester,
                  semesterKey: semesterKey,
                  source: 'curriculum'
                });
              });
            }
          });
        }
        
        // 2. Get courses from Firebase (added by admin)
        try {
          const firebaseCourses = await firebaseService.getCourses(selectedProgram, selectedCurriculumYear);
          
          // Add Firebase courses to the list
          firebaseCourses.forEach((course: any) => {
            // Check if course already exists in curriculum data
            const existingCourse = allCourses.find(c => c.code === course.code);
            
            if (!existingCourse) {
              // Add new course from Firebase
              allCourses.push({
                ...course,
                id: course.id || course.code,
                year: course.year || 1,
                semester: course.semester || 1,
                semesterKey: `${course.year || 1}-${course.semester || 1}`,
                source: 'firebase'
              });
            } else {
              // Update existing course with Firebase data (Firebase takes priority)
              Object.assign(existingCourse, {
                ...course,
                source: 'both'
              });
            }
          });
        } catch (error) {
          console.error('Error loading Firebase courses:', error);
        }
        
        setAvailableCourses(allCourses);
        setFilteredCourses(allCourses);
      }
    };
    
    loadCourses();
  }, [courseSelectionMode, selectedProgram, selectedCurriculumYear]);

  // Filter courses based on search term, year, and semester
  useEffect(() => {
    let filtered = [...availableCourses];
    
    // Filter by selected year - but allow years 5-8 to see all courses
    if (selectedYear !== null && selectedYear <= 4) {
      filtered = filtered.filter(course => course.year === selectedYear);
    }
    
    // Filter by selected semester - but allow years 5-8 to see all semesters
    if (selectedSemester !== null && selectedYear !== null && selectedYear <= 4) {
      filtered = filtered.filter(course => course.semester === selectedSemester);
    }
    
    // Filter by search term
    if (courseSearchTerm.trim() !== '') {
      const searchLower = courseSearchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.code?.toLowerCase().includes(searchLower) ||
        course.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredCourses(filtered);
  }, [availableCourses, selectedYear, selectedSemester, courseSearchTerm]);

  // Initialize study plan from Firebase or create empty plan
  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!user?.id) return;
      
      try {
        const existingPlan = await firebaseService.getStudyPlanByStudentId(user.id);
        
        if (existingPlan) {
          // Load existing plan from Firebase
          setCustomPlan({
            id: existingPlan.id,
            studentEmail: user.email || '',
            planName: 'แผนการเรียนของฉัน',
            courses: existingPlan.courses.map(course => ({
              ...course,
              id: course.id || `course_${Date.now()}_${Math.random()}`,
              courseId: course.courseId || course.id
            })),
            totalCredits: existingPlan.totalCredits || 0,
            createdAt: new Date(existingPlan.createdAt),
            updatedAt: new Date(existingPlan.updatedAt)
          });
        } else {
          // Create new empty plan
          setCustomPlan(prev => ({
            ...prev,
            id: `plan_${user.id}_${Date.now()}`,
            studentEmail: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error loading study plan:', error);
        // Fallback to empty plan
        setCustomPlan(prev => ({
          ...prev,
          id: `plan_${user.id}_${Date.now()}`,
          studentEmail: user.email || ''
        }));
      }
    };

    loadStudyPlan();
  }, [user?.id, user?.email]);

  // Save study plan to Firebase whenever customPlan changes
  useEffect(() => {
    const saveStudyPlan = async () => {
      if (!user?.id || !customPlan.id) return;
      
      try {
        const studyPlanData = {
          studentId: user.id,
          studentEmail: user.email || '',
          curriculum: 'default',
          completedCredits: completedCredits,
          gpa: gpaResult.gpa || 0,
          courses: customPlan.courses.map(course => ({
            id: course.id,
            courseId: course.courseId || course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            year: course.year,
            semester: course.semester,
            status: course.status,
            grade: course.grade || null,
            type: course.type === 'general' ? 'elective' : course.type,
            description: course.description || ''
          })),
          totalCredits: customPlan.totalCredits,
          createdAt: customPlan.createdAt,
          updatedAt: new Date()
        };

        // Check if study plan exists
        const existingPlan = await firebaseService.getStudyPlanByStudentId(user.id);
        
        if (existingPlan) {
          // Update existing plan
          await firebaseService.updateStudyPlan(existingPlan.id, studyPlanData);
        } else {
          // Create new plan
          await firebaseService.createStudyPlan(studyPlanData);
        }
      } catch (error) {
        console.error('Error saving study plan:', error);
      }
    };

    // Debounce the save operation to avoid too frequent saves
    const timeoutId = setTimeout(saveStudyPlan, 1000);
    return () => clearTimeout(timeoutId);
  }, [customPlan, user?.id, user?.email]);

  // Calculate total credits
  useEffect(() => {
    const total = customPlan.courses.reduce((sum, course) => sum + course.credits, 0);
    setCustomPlan(prev => ({ ...prev, totalCredits: total }));
  }, [customPlan.courses]);

  // Add new course to plan
  // Modified add course function to handle curriculum selection
  const addCourse = () => {
    let courseData: any = {};

    if (courseSelectionMode === 'curriculum' && selectedCourseFromCurriculum) {
      // Find selected course from curriculum data
      const selectedCourse = filteredCourses.find(c => c.id === selectedCourseFromCurriculum);
      if (selectedCourse) {
        courseData = {
          code: selectedCourse.code,
          name: selectedCourse.name,
          credits: selectedCourse.credits,
          year: selectedCourse.year,
          semester: selectedCourse.semester,
          description: selectedCourse.description || '',
          mainCategory: selectedCourse.mainCategory || '',
          subCategory: selectedCourse.subCategory || '',
          prerequisites: selectedCourse.prerequisites || [],
          corequisites: selectedCourse.corequisites || [],
          type: selectedCourse.category === 'core' ? 'required' : 
                selectedCourse.category === 'general' ? 'general' : 'elective'
        };
      }
    } else {
      // Manual input mode
      if (!newCourse.code || !newCourse.name) return;
      courseData = {
        code: newCourse.code,
        name: newCourse.name,
        credits: newCourse.credits || 3,
        year: newCourse.year || 1,
        semester: newCourse.semester || 1,
        description: newCourse.description || '',
        type: newCourse.type || 'required'
      };
    }

    const course: CustomCourse = {
      id: `course_${Date.now()}`,
      courseId: `course_${Date.now()}`,
      ...courseData,
      status: newCourse.status || 'planned'
    };

    setCustomPlan(prev => ({
      ...prev,
      courses: [...prev.courses, course],
      updatedAt: new Date()
    }));

    // Reset form
    setNewCourse({
      code: '',
      name: '',
      credits: 3,
      year: 1,
      semester: 1,
      status: 'planned',
      type: 'required',
      description: ''
    });
    setSelectedCourseFromCurriculum('');
    setIsAddCourseOpen(false);
  };

  const addCourseFromCurriculum = () => {
    const selectedCourse = availableCourses.find(c => c.id === selectedCourseFromCurriculum);
    if (selectedCourse) {
      const newCourse: CustomCourse = {
        id: `course_${Date.now()}`,
        courseId: selectedCourse.code,
        code: selectedCourse.code,
        name: selectedCourse.name,
        credits: selectedCourse.credits,
        year: selectedCourse.year,
        semester: selectedCourse.semester,
        type: selectedCourse.category === 'core' ? 'required' : 
              selectedCourse.category === 'major' ? 'required' :
              selectedCourse.category === 'general' ? 'general' : 'elective',
        status: 'planned',
        description: selectedCourse.description
      };
      
      setCustomPlan(prev => ({
        ...prev,
        courses: [...prev.courses, newCourse]
      }));
      
      setSelectedCourseFromCurriculum('');
      setIsAddCourseOpen(false);
    }
  };

  // Edit course
  const editCourse = (course: CustomCourse) => {
    setEditingCourse(course);
    setNewCourse(course);
    setIsAddCourseOpen(true);
  };

  // Update course
  const updateCourse = () => {
    if (!editingCourse || !newCourse.code || !newCourse.name) return;

    setCustomPlan(prev => ({
      ...prev,
      courses: prev.courses.map(course => 
        course.id === editingCourse.id 
          ? { ...course, ...newCourse } as CustomCourse
          : course
      ),
      updatedAt: new Date()
    }));

    setEditingCourse(null);
    setNewCourse({
      code: '',
      name: '',
      credits: 3,
      year: 1,
      semester: 1,
      status: 'planned',
      type: 'required',
      description: ''
    });
    setIsAddCourseOpen(false);
  };

  // Delete course
  const deleteCourse = (courseId: string) => {
    setCustomPlan(prev => ({
      ...prev,
      courses: prev.courses.filter(course => course.id !== courseId),
      updatedAt: new Date()
    }));
  };

  // Filter courses for display
  const displayFilteredCourses = customPlan.courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || course.year.toString() === filterYear;
    const matchesSemester = filterSemester === 'all' || course.semester.toString() === filterSemester;
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

    return matchesSearch && matchesYear && matchesSemester && matchesStatus;
  });

  // Group courses by year and semester
  const groupedCourses = displayFilteredCourses.reduce((acc, course) => {
    const key = `${course.year}-${course.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, CustomCourse[]>);

  // Calculate statistics
  const completedCourses = customPlan.courses.filter(c => c.status === 'completed');
  const inProgressCourses = customPlan.courses.filter(c => c.status === 'in_progress');
  const plannedCourses = customPlan.courses.filter(c => c.status === 'planned');
  const completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
  const gpaResult = calculateGPA(completedCourses.filter(c => c.grade));

  // Function to update course grade
  const updateCourseGrade = (courseId: string, grade: string) => {
    setCustomPlan(prev => ({
      ...prev,
      courses: prev.courses.map(course => 
        course.id === courseId 
          ? { ...course, grade }
          : course
      ),
      updatedAt: new Date()
    }));
  };

  if (departmentsLoading || coursesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการแผนการเรียน</h2>
          <p className="text-muted-foreground">สร้างและปรับแต่งแผนการเรียนของคุณเอง</p>
        </div>
        <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรายวิชา
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}
              </DialogTitle>
              <DialogDescription>
                เลือกรายวิชาจากหลักสูตรหรือกรอกข้อมูลด้วยตนเอง
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[60vh] pr-2">
            <Tabs value={courseSelectionMode} onValueChange={(value) => setCourseSelectionMode(value as 'manual' | 'curriculum')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="curriculum">เลือกจากหลักสูตร</TabsTrigger>
                <TabsTrigger value="manual">กรอกข้อมูลเอง</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curriculum" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>หลักสูตร</Label>
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePrograms.map((program) => (
                          <SelectItem key={program} value={program}>
                            {program}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ปีหลักสูตร</Label>
                    <Select value={selectedCurriculumYear} onValueChange={setSelectedCurriculumYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCurriculumYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            หลักสูตร {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ปีการศึกษา</Label>
                    <Select value={selectedYear?.toString() || 'all'} onValueChange={(value) => setSelectedYear(value === 'all' ? null : parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกปีการศึกษา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกปี</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      ปี {year} {year > 4 ? '(เลือกได้ทุกปี/เทอม)' : ''}
                    </SelectItem>
                  ))}
                      </SelectContent>
                    </Select>
                    {selectedYear && selectedYear > 4 && (
                      <p className="text-sm text-muted-foreground">
                        📝 นักศึกษาปี {selectedYear} สามารถเลือกรายวิชาจากทุกปีและทุกเทอมได้
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>เทอม</Label>
                    <Select 
                      value={selectedSemester?.toString() || 'all'} 
                      onValueChange={(value) => setSelectedSemester(value === 'all' ? null : parseInt(value))}
                      disabled={selectedYear && selectedYear > 4}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกเทอม" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกเทอม</SelectItem>
                        <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                        <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                        <SelectItem value="3">ภาคเรียนที่ 3 (ฝึกงาน)</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedYear && selectedYear > 4 && (
                      <p className="text-sm text-muted-foreground">
                        🔓 การกรองเทอมถูกปิดใช้งาน - แสดงรายวิชาทุกเทอม
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>ค้นหารายวิชา</Label>
                  <Input
                    placeholder="ค้นหาด้วยรหัสวิชา ชื่อวิชา หรือคำอธิบาย..."
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>เลือกรายวิชา</Label>
                  <Select value={selectedCourseFromCurriculum} onValueChange={setSelectedCourseFromCurriculum}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกรายวิชาจากหลักสูตร" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{course.code} - {course.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ปี {course.year} ภาค {course.semester} | {course.credits} หน่วยกิต
                              {course.mainCategory && ` | ${course.mainCategory}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedCourseFromCurriculum && (
                  <div className="p-4 bg-muted rounded-lg">
                    {(() => {
                      const course = availableCourses.find(c => c.id === selectedCourseFromCurriculum);
                      return course ? (
                        <div className="space-y-2">
                          <h4 className="font-medium">{course.code} - {course.name}</h4>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">ปี {course.year} ภาค {course.semester}</Badge>
                            <Badge variant="outline">{course.credits} หน่วยกิต</Badge>
                            {course.mainCategory && <Badge variant="secondary">{course.mainCategory}</Badge>}
                            {course.subCategory && <Badge variant="outline">{course.subCategory}</Badge>}
                          </div>
                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">วิชาที่ต้องเรียนมาก่อน: </span>
                              {course.prerequisites.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                {/* Original manual input form */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">รหัสวิชา</Label>
                    <Input
                      id="code"
                      value={newCourse.code || ''}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="เช่น IT-060243102"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">หน่วยกิต</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={newCourse.credits || 3}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อวิชา</Label>
                  <Input
                    id="name"
                    value={newCourse.name || ''}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น การโปรแกรมคอมพิวเตอร์"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">ชั้นปี</Label>
                    <Select 
                      value={newCourse.year?.toString() || '1'} 
                      onValueChange={(value) => setNewCourse(prev => ({ ...prev, year: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            ปี {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semester">ภาคเรียน</Label>
                    <Select 
                      value={newCourse.semester?.toString() || '1'} 
                      onValueChange={(value) => setNewCourse(prev => ({ ...prev, semester: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                        <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                        <SelectItem value="3">ภาคเรียนที่ 3 (ฝึกงาน)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">ประเภทวิชา</Label>
                    <Select 
                      value={newCourse.type || 'required'} 
                      onValueChange={(value) => setNewCourse(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">วิชาบังคับ</SelectItem>
                        <SelectItem value="elective">วิชาเลือก</SelectItem>
                        <SelectItem value="general">ศึกษาทั่วไป</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">สถานะ</Label>
                    <Select 
                      value={newCourse.status || 'planned'} 
                      onValueChange={(value) => setNewCourse(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">วางแผนเรียน</SelectItem>
                        <SelectItem value="in_progress">กำลังเรียน</SelectItem>
                        <SelectItem value="completed">เรียนจบแล้ว</SelectItem>
                        <SelectItem value="failed">เรียนไม่ผ่าน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">คำอธิบาย (ไม่บังคับ)</Label>
                  <Input
                    id="description"
                    value={newCourse.description || ''}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับรายวิชา"
                  />
                </div>
              </TabsContent>
            </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">สถานะการเรียน</Label>
              <Select 
                value={newCourse.status || 'planned'} 
                onValueChange={(value) => setNewCourse(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">วางแผนเรียน</SelectItem>
                  <SelectItem value="in_progress">กำลังเรียน</SelectItem>
                  <SelectItem value="completed">เรียนจบแล้ว</SelectItem>
                  <SelectItem value="failed">เรียนไม่ผ่าน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                onClick={editingCourse ? updateCourse : addCourse}
                disabled={courseSelectionMode === 'curriculum' ? !selectedCourseFromCurriculum : (!newCourse.code || !newCourse.name)}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? 'บันทึกการแก้ไข' : 'เพิ่มรายวิชา'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">รายวิชาทั้งหมด</p>
                <p className="text-2xl font-bold">{customPlan.courses.length}</p>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรองรายวิชา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ค้นหารายวิชา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterYear">ชั้นปี</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้นปี</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      ปี {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterSemester">ภาคเรียน</Label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกภาคเรียน</SelectItem>
                  <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                  <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                  <SelectItem value="3">ภาคเรียนที่ 3 (ฝึกงาน)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterStatus">สถานะ</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="planned">วางแผนเรียน</SelectItem>
                  <SelectItem value="in_progress">กำลังเรียน</SelectItem>
                  <SelectItem value="completed">เรียนจบแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      {customPlan.courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายวิชาในแผนการเรียน</h3>
            <p className="text-muted-foreground mb-4">
              เริ่มต้นสร้างแผนการเรียนของคุณโดยการเพิ่มรายวิชาแรก
            </p>
            <Button onClick={() => setIsAddCourseOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรายวิชาแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCourses).sort().map(([key, courses]) => {
            const [year, semester] = key.split('-');
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>ปีที่ {year} ภาคเรียนที่ {semester}</span>
                    <Badge variant="outline">{courses.length} รายวิชา</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{course.name}</h4>
                            <Badge 
                              variant={
                                course.status === 'completed' ? 'default' :
                                course.status === 'in_progress' ? 'secondary' :
                                'outline'
                              }
                            >
                              {course.status === 'completed' ? 'เรียนจบแล้ว' :
                               course.status === 'in_progress' ? 'กำลังเรียน' :
                               'วางแผนเรียน'}
                            </Badge>
                            {course.grade && (
                              <Badge 
                                variant="outline" 
                                className={getGradeColor(course.grade)}
                              >
                                เกรด {course.grade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{course.code}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{course.credits} หน่วยกิต</Badge>
                          <Badge variant="outline">
                            {course.type === 'required' ? 'บังคับ' :
                             course.type === 'elective' ? 'เลือก' : 'ศึกษาทั่วไป'}
                          </Badge>
                          
                          {/* Grade Input for completed courses */}
                          {course.status === 'completed' && (
                            <Select
                              value={course.grade || ''}
                              onValueChange={(grade) => updateCourseGrade(course.id, grade)}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue placeholder="เกรด" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableGrades().map((grade) => (
                                  <SelectItem key={grade} value={grade}>
                                    {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editCourse(course)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCourse(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyPlanManager;