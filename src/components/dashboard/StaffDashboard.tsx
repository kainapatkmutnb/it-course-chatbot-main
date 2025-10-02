import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/hooks/useFirebaseData';
import { Course, firebaseService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { getCoursesByProgram } from '@/services/courseService';
import CourseManagement from './CourseManagement';
import { 
  Users, 
  Settings, 
  BookOpen, 
  Link,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  Mail,
  User,
  Building
} from 'lucide-react';
import { generateCoursesForSemester } from '@/services/completeCurriculumData';

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [prerequisiteToAdd, setPrerequisiteToAdd] = useState<string>('');
  const [corequisiteToAdd, setCorequisiteToAdd] = useState<string>('');
  const [courses, setCourses] = useState<any[]>([]);
  const [allCoursesInCurriculum, setAllCoursesInCurriculum] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  // Available programs and curriculum years
  const programs = [
    { code: 'IT', name: 'เทคโนโลยีสารสนเทุศ' },
    { code: 'INE', name: 'วิศวกรรมสารสนเทุศและเครือข่าย' },
    { code: 'INET', name: 'เทคโนโลยีสารสนเทุศและเครือข่าย' },
    { code: 'ITI', name: 'เทคโนโลยีสารสนเทุศอุตสาหกรรม' },
    { code: 'ITT', name: 'เทคโนโลยีสารสนเทุศและการสื่อสาร' }
  ];

  const curriculumYears = {
    'IT': ['62 สหกิจ', '67 สหกิจ', '62', '67'],
    'INE': ['62', '67', '62 สหกิจ', '67 สหกิจ'],
    'INET': ['62', '67'],
    'ITI': ['62', '67'],
    'ITT': ['67']
  };

  // Load courses when selection changes
  useEffect(() => {
    if (selectedProgram && selectedCurriculumYear && selectedYear && selectedSemester) {
      loadCourses();
    }
    if (selectedProgram && selectedCurriculumYear) {
      loadAllCoursesInCurriculum();
    }
  }, [selectedProgram, selectedCurriculumYear, selectedYear, selectedSemester]);

  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = courses.filter(course =>
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [courses, searchTerm]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      // Get courses from Firebase
      const firebaseCourses = await firebaseService.getCourses(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester)
      );

      // Get curriculum courses as base data
      const curriculumCourses = generateCoursesForSemester(
        selectedProgram,
        selectedCurriculumYear,
        selectedYear,
        selectedSemester
      );

      // Create a map of curriculum courses
      const curriculumMap = new Map(curriculumCourses.map(c => [c.id, c]));

      // Process Firebase courses
      const processedCourses: Course[] = [];
      
      if (firebaseCourses && firebaseCourses.length > 0) {
        // Add Firebase courses (these override curriculum courses)
        firebaseCourses.forEach(fbCourse => {
          processedCourses.push({
            ...fbCourse,
            semester: fbCourse.semester ?? parseInt(selectedSemester),
            year: fbCourse.year ?? parseInt(selectedYear),
            isActive: fbCourse.isActive ?? true
          });
          // Remove from curriculum map if it exists there
          curriculumMap.delete(fbCourse.id);
        });
      }

      // Add remaining curriculum courses that weren't overridden by Firebase
      curriculumMap.forEach(course => {
        processedCourses.push(course);
      });

      setCourses(processedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายวิชาได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllCoursesInCurriculum = async () => {
    try {
      // Get all courses for the selected program and curriculum year
      const allCourses = getCoursesByProgram(selectedProgram, selectedCurriculumYear);
      setAllCoursesInCurriculum(allCourses);
    } catch (error) {
      console.error('Error loading all courses in curriculum:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายวิชาทั้งหมดในหลักสูตรได้",
        variant: "destructive",
      });
    }
  };

  const addPrerequisite = async () => {
    if (selectedCourse && prerequisiteToAdd && selectedCourse !== prerequisiteToAdd) {
      try {
        // Find the course to update
        const courseToUpdate = courses.find(c => c.code === selectedCourse);
        if (!courseToUpdate) return;

        // Update prerequisites
        const updatedPrerequisites = [...courseToUpdate.prerequisites, prerequisiteToAdd];
        const updatedCourse = {
          ...courseToUpdate,
          prerequisites: updatedPrerequisites
        };

        // Update in Firebase
        await firebaseService.updateCourse(
          selectedProgram,
          selectedCurriculumYear,
          parseInt(selectedYear),
          parseInt(selectedSemester),
          updatedCourse
        );

        // Update local state
        setCourses(courses.map(c => c.code === selectedCourse ? updatedCourse : c));
        
        setPrerequisiteToAdd('');
        
        // Create audit log
        if (user) {
          await firebaseService.createAuditLog({
            action: 'เพิ่มเงื่อนไขวิชา',
            details: `เพิ่มเงื่อนไขวิชา ${prerequisiteToAdd} สำหรับ ${selectedCourse}`,
            userId: user.id,
            ipAddress: 'localhost',
            category: 'course'
          });
        }
        
        toast({
          title: 'เพิ่มเงื่อนไขสำเร็จ',
          description: `เพิ่มเงื่อนไขวิชา ${prerequisiteToAdd} สำหรับ ${selectedCourse}`,
        });
      } catch (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเพิ่มเงื่อนไขได้',
          variant: 'destructive'
        });
      }
    }
  };

  const addCorequisiteHandler = async () => {
    if (selectedCourse && corequisiteToAdd && selectedCourse !== corequisiteToAdd) {
      try {
        // Find the course to update
        const courseToUpdate = courses.find(c => c.code === selectedCourse);
        if (!courseToUpdate) return;

        // Update corequisites
        const updatedCorequisites = [...(courseToUpdate.corequisites || []), corequisiteToAdd];
        const updatedCourse = {
          ...courseToUpdate,
          corequisites: updatedCorequisites
        };

        // Update in Firebase
        await firebaseService.updateCourse(
          selectedProgram,
          selectedCurriculumYear,
          parseInt(selectedYear),
          parseInt(selectedSemester),
          updatedCourse
        );

        // Update local state
        setCourses(courses.map(c => c.code === selectedCourse ? updatedCourse : c));
        
        setCorequisiteToAdd('');
        
        // Create audit log
        if (user) {
          await firebaseService.createAuditLog({
            action: 'เพิ่มวิชาที่ต้องเรียนพร้อมกัน',
            details: `เพิ่มวิชาที่ต้องเรียนพร้อมกัน ${corequisiteToAdd} สำหรับ ${selectedCourse}`,
            userId: user.id,
            ipAddress: 'localhost',
            category: 'course'
          });
        }
        
        toast({
          title: 'เพิ่มวิชาที่ต้องเรียนพร้อมกันสำเร็จ',
          description: `เพิ่มวิชาที่ต้องเรียนพร้อมกัน ${corequisiteToAdd} สำหรับ ${selectedCourse}`,
        });
      } catch (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเพิ่มวิชาที่ต้องเรียนพร้อมกันได้',
          variant: 'destructive'
        });
      }
    }
  };

  const removePrerequisite = async (courseCode: string, prerequisite: string) => {
    try {
      // Find the course to update
      const courseToUpdate = courses.find(c => c.code === courseCode);
      if (!courseToUpdate) return;

      // Update prerequisites
      const updatedPrerequisites = courseToUpdate.prerequisites.filter(p => p !== prerequisite);
      const updatedCourse = {
        ...courseToUpdate,
        prerequisites: updatedPrerequisites
      };

      // Update in Firebase
      await firebaseService.updateCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        updatedCourse
      );

      // Update local state
      setCourses(courses.map(c => c.code === courseCode ? updatedCourse : c));
      
      // Create audit log
      if (user) {
        await firebaseService.createAuditLog({
          action: 'ลบเงื่อนไขวิชา',
          details: `ลบเงื่อนไขวิชา ${prerequisite} ออกจาก ${courseCode}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'course'
        });
      }
      
      toast({
        title: 'ลบเงื่อนไขสำเร็จ',
        description: `ลบเงื่อนไขวิชา ${prerequisite} ออกจาก ${courseCode}`,
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบเงื่อนไขได้',
        variant: 'destructive'
      });
    }
  };

  const addCorequisite = async (courseCode: string, corequisite: string) => {
    try {
      // Find the course to update
      const courseToUpdate = courses.find(c => c.code === courseCode);
      if (!courseToUpdate) return;

      // Update corequisites
      const updatedCorequisites = [...courseToUpdate.corequisites, corequisite];
      const updatedCourse = {
        ...courseToUpdate,
        corequisites: updatedCorequisites
      };

      // Update in Firebase
      await firebaseService.updateCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        updatedCourse
      );

      // Update local state
      setCourses(courses.map(c => c.code === courseCode ? updatedCourse : c));
      
      // Create audit log
      if (user) {
        await firebaseService.createAuditLog({
          action: 'เพิ่มวิชาที่ต้องเรียนพร้อมกัน',
          details: `เพิ่มวิชาที่ต้องเรียนพร้อมกัน ${corequisite} สำหรับ ${courseCode}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'course'
        });
      }
      
      toast({
        title: 'เพิ่มวิชาที่ต้องเรียนพร้อมกันสำเร็จ',
        description: `เพิ่มวิชาที่ต้องเรียนพร้อมกัน ${corequisite} สำหรับ ${courseCode}`,
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มวิชาที่ต้องเรียนพร้อมกันได้',
        variant: 'destructive'
      });
    }
  };

  const removeCorequisite = async (courseCode: string, corequisite: string) => {
    try {
      // Find the course to update
      const courseToUpdate = courses.find(c => c.code === courseCode);
      if (!courseToUpdate) return;

      // Update corequisites
      const updatedCorequisites = courseToUpdate.corequisites.filter(c => c !== corequisite);
      const updatedCourse = {
        ...courseToUpdate,
        corequisites: updatedCorequisites
      };

      // Update in Firebase
      await firebaseService.updateCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        updatedCourse
      );

      // Update local state
      setCourses(courses.map(c => c.code === courseCode ? updatedCourse : c));
      
      // Create audit log
      if (user) {
        await firebaseService.createAuditLog({
          action: 'ลบวิชาที่ต้องเรียนพร้อมกัน',
          details: `ลบวิชาที่ต้องเรียนพร้อมกัน ${corequisite} ออกจาก ${courseCode}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'course'
        });
      }
      
      toast({
        title: 'ลบวิชาที่ต้องเรียนพร้อมกันสำเร็จ',
        description: `ลบวิชาที่ต้องเรียนพร้อมกัน ${corequisite} ออกจาก ${courseCode}`,
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบวิชาที่ต้องเรียนพร้อมกันได้',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 gradient-subtle">
      <div className="container mx-auto space-y-6">
        {/* Welcome Section with User Info */}
        <Card className="shadow-soft border-0 bg-gradient-to-r from-staff/10 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback className="bg-staff text-white text-lg">
                  {user?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  ยินดีต้อนรับ, {user?.name}
                </h1>
                <p className="text-muted-foreground mb-2">แดชบอร์ดบุคลากร - จัดการเงื่อนไขรายวิชา</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>บุคลากรวิชาการ</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Main Content */}
        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">จัดการเงื่อนไขวิชา</TabsTrigger>
            <TabsTrigger value="courses">จัดการรายวิชา</TabsTrigger>
            <TabsTrigger value="overview">ภาพรวมเงื่อนไข</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>จัดการเงื่อนไขรายวิชา</span>
                </CardTitle>
                <CardDescription>
                  ตั้งค่าและแก้ไขเงื่อนไขการเรียนวิชาต่างๆ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selection Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-primary/5">
                  <div>
                    <Label htmlFor="program">หลักสูตร</Label>
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหลักสูตร" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.code} value={program.code}>
                            {program.code} - {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="curriculumYear">ปีหลักสูตร</Label>
                    <Select 
                      value={selectedCurriculumYear} 
                      onValueChange={setSelectedCurriculumYear}
                      disabled={!selectedProgram}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกปีหลักสูตร" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProgram && curriculumYears[selectedProgram as keyof typeof curriculumYears] && 
                         curriculumYears[selectedProgram as keyof typeof curriculumYears].map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">ชั้นปี</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกชั้นปี" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ปี 1</SelectItem>
                        <SelectItem value="2">ปี 2</SelectItem>
                        <SelectItem value="3">ปี 3</SelectItem>
                        <SelectItem value="4">ปี 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="semester">ภาคเรียน</Label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกภาคเรียน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                        <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                        <SelectItem value="3">ภาคเรียนที่ 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProgram && selectedCurriculumYear && selectedYear && selectedSemester && (
                  <>
                    {/* Add Prerequisites Section */}
                    <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-secondary/5">
                      <div>
                        <Label htmlFor="course-select">เลือกวิชา</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกวิชาที่ต้องการตั้งเงื่อนไข" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.code}>
                                {course.code} - {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="prerequisite-select">เลือกวิชาเงื่อนไข</Label>
                        <Select value={prerequisiteToAdd} onValueChange={setPrerequisiteToAdd}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกวิชาเงื่อนไข" />
                          </SelectTrigger>
                          <SelectContent>
                            {allCoursesInCurriculum
                              .filter(course => course.code !== selectedCourse)
                              .map((course) => (
                                <SelectItem key={course.id} value={course.code}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button 
                          onClick={addPrerequisite}
                          disabled={!selectedCourse || !prerequisiteToAdd}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          เพิ่มเงื่อนไข
                        </Button>
                      </div>
                    </div>

                    {/* Add Corequisite Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue/5 border border-blue/20 rounded-lg">
                      <div>
                        <Label htmlFor="corequisite-course">เลือกวิชาที่ต้องเรียนพร้อมกัน</Label>
                        <Select value={corequisiteToAdd} onValueChange={setCorequisiteToAdd}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกวิชาที่ต้องเรียนพร้อมกัน" />
                          </SelectTrigger>
                          <SelectContent>
                            {allCoursesInCurriculum
                              .filter(course => course.code !== selectedCourse)
                              .map((course) => (
                                <SelectItem key={course.id} value={course.code}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button 
                          onClick={addCorequisiteHandler}
                          disabled={!selectedCourse || !corequisiteToAdd}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          เพิ่มวิชาที่ต้องเรียนพร้อมกัน
                        </Button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ค้นหารายวิชา..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Course List with Prerequisites */}
                    <div className="space-y-4">
                      {filteredCourses.map((course) => (
                        <div key={course.id} className="p-4 border rounded-lg hover:shadow-soft transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <BookOpen className="w-5 h-5 text-primary" />
                              <h3 className="font-medium">{course.code} - {course.name}</h3>
                              <Badge variant="outline">{course.credits} หน่วยกิต</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {course.description}
                          </p>
                          
                          {/* Prerequisites */}
                          {course.prerequisites && course.prerequisites.length > 0 ? (
                            <div className="space-y-2 mb-3">
                              <p className="text-sm font-medium">วิชาที่ต้องเรียนมาก่อน:</p>
                              <div className="flex flex-wrap gap-2">
                                {course.prerequisites.map((prerequisite, index) => (
                                  <div key={`${course.code}-pre-${prerequisite}`} className="flex items-center space-x-1 bg-warning/10 border border-warning/20 rounded-lg px-3 py-1">
                                    <span className="text-sm">{prerequisite}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={() => removePrerequisite(course.code, prerequisite)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {/* Corequisites */}
                          {course.corequisites && course.corequisites.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">วิชาที่ต้องเรียนพร้อมกัน:</p>
                              <div className="flex flex-wrap gap-2">
                                {course.corequisites.map((corequisite, index) => (
                                  <div key={`${course.code}-co-${corequisite}`} className="flex items-center space-x-1 bg-blue/10 border border-blue/20 rounded-lg px-3 py-1">
                                    <span className="text-sm">{corequisite}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={() => removeCorequisite(course.code, corequisite)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {(!course.prerequisites || course.prerequisites.length === 0) && 
                           (!course.corequisites || course.corequisites.length === 0) && (
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">ยังไม่มีเงื่อนไขการเรียน</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Management Tab */}
          <TabsContent value="courses" className="space-y-6">
            <CourseManagement />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>ภาพรวมเงื่อนไขรายวิชา</span>
                </CardTitle>
                <CardDescription>
                  แสดงเงื่อนไขการเรียนทั้งหมดในหลักสูตร
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProgram && selectedCurriculumYear && selectedYear && selectedSemester ? (
                  <div className="space-y-6">
                    {courses.filter(course => 
                      (course.prerequisites && course.prerequisites.length > 0) || 
                      (course.corequisites && course.corequisites.length > 0)
                    ).length > 0 ? (
                      courses
                        .filter(course => 
                          (course.prerequisites && course.prerequisites.length > 0) || 
                          (course.corequisites && course.corequisites.length > 0)
                        )
                        .map((course) => (
                          <div key={course.id} className="p-4 border rounded-lg bg-secondary/5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <h3 className="font-medium">
                                  {course.code} - {course.name}
                                </h3>
                              </div>
                              <div className="flex gap-2">
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <Badge variant="outline">
                                    {course.prerequisites.length} เงื่อนไข
                                  </Badge>
                                )}
                                {course.corequisites && course.corequisites.length > 0 && (
                                  <Badge variant="outline" className="bg-blue/10">
                                    {course.corequisites.length} วิชาพร้อมกัน
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <div className="space-y-2 mb-3">
                                <p className="text-sm font-medium text-muted-foreground">วิชาที่ต้องเรียนมาก่อน:</p>
                                <div className="flex flex-wrap gap-2">
                                  {course.prerequisites.map((prerequisite, index) => (
                                    <Badge key={`${course.code}-pre-${prerequisite}`} variant="secondary" className="bg-success/10 text-success-foreground border-success/20">
                                      {prerequisite}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {course.corequisites && course.corequisites.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">วิชาที่ต้องเรียนพร้อมกัน:</p>
                                <div className="flex flex-wrap gap-2">
                                  {course.corequisites.map((corequisite, index) => (
                                    <Badge key={`${course.code}-co-${corequisite}`} variant="secondary" className="bg-blue/10 text-blue-foreground border-blue/20">
                                      {corequisite}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          ยังไม่มีการตั้งเงื่อนไขรายวิชาในหลักสูตรและภาคเรียนที่เลือก
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      กรุณาเลือกหลักสูตร ปีหลักสูตร ชั้นปี และภาคเรียนในแท็บ "จัดการเงื่อนไขวิชา" เพื่อดูภาพรวมเงื่อนไข
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDashboard;