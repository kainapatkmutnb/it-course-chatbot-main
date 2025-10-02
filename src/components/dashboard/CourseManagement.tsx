import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generateCoursesForSemester } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
import { 
  BookOpen, 
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  prerequisites: string[];
  corequisites: string[];
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory: string;
  subCategory: string;
  semester: number;
  year: number;
  isActive: boolean;
}

interface CourseFormData {
  code: string;
  name: string;
  credits: number;
  description: string;
  prerequisites: string;
  corequisites: string;
  category: 'core' | 'major' | 'elective' | 'general' | 'free';
  mainCategory: string;
  subCategory: string;
}

const CourseManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  const [courseForm, setCourseForm] = useState<CourseFormData>({
    code: '',
    name: '',
    credits: 3,
    description: '',
    prerequisites: '',
    corequisites: '',
    category: 'core',
    mainCategory: 'หมวดวิชาเฉพาะ',
    subCategory: 'กลุ่มวิชาแกน'
  });

  // Available programs and curriculum years
  const programs = [
    { code: 'IT', name: 'เทคโนโลยีสารสนเทศ' },
    { code: 'INE', name: 'วิศวกรรมสารสนเทศและเครือข่าย' },
    { code: 'INET', name: 'เทคโนโลยีสารสนเทศและเครือข่าย' },
    { code: 'ITI', name: 'เทคโนโลยีสารสนเทศอุตสาหกรรม' },
    { code: 'ITT', name: 'เทคโนโลยีสารสนเทศและการสื่อสาร' }
  ];

  const curriculumYears = {
    'IT': ['62 สหกิจ', '67 สหกิจ', '62', '67'],
    'INE': ['62', '67', '62 สหกิจ', '67 สหกิจ'],
    'INET': ['62', '67'],
    'ITI': ['62', '67'],
    'ITT': ['67']
  };

  const mainCategories = [
    'หมวดวิชาศึกษาทั่วไป',
    'หมวดวิชาเฉพาะ',
    'หมวดวิชาเลือกเสรี'
  ];

  const subCategories = [
    'กลุ่มวิชาภาษา',
    'กลุ่มวิชาวิทยาศาสตร์และคณิตศาสตร์',
    'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์',
    'กลุ่มวิชากีฬาและนันทนาการ',
    'กลุ่มวิชาบูรณาการ',
    'กลุ่มวิชาเลือกในหมวดศึกษาทั่วไป',
    'กลุ่มวิชาแกน',
    'กลุ่มวิชาชีพ',
    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา'
  ];

  // Load courses when selection changes
  useEffect(() => {
    if (selectedProgram && selectedCurriculumYear && selectedYear && selectedSemester) {
      loadCourses();
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

  const resetForm = () => {
    setCourseForm({
      code: '',
      name: '',
      credits: 3,
      description: '',
      prerequisites: '',
      corequisites: '',
      category: 'core',
      mainCategory: 'หมวดวิชาเฉพาะ',
      subCategory: 'กลุ่มวิชาแกน'
    });
  };

  const handleAddCourse = async () => {
    if (!selectedProgram || !selectedCurriculumYear || !selectedYear || !selectedSemester) {
      toast({
        title: "กรุณาเลือกข้อมูลให้ครบถ้วน",
        description: "กรุณาเลือกหลักสูตร ปีหลักสูตร ชั้นปี และภาคเรียน",
        variant: "destructive",
      });
      return;
    }

    if (!courseForm.code || !courseForm.name) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกรหัสวิชาและชื่อวิชา",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCourse: Course = {
        id: `${courseForm.code}-${selectedCurriculumYear}`,
        code: courseForm.code,
        name: courseForm.name,
        credits: courseForm.credits,
        description: courseForm.description,
        prerequisites: courseForm.prerequisites ? courseForm.prerequisites.split(',').map(p => p.trim()) : [],
        corequisites: courseForm.corequisites ? courseForm.corequisites.split(',').map(c => c.trim()) : [],
        category: courseForm.category,
        mainCategory: courseForm.mainCategory,
        subCategory: courseForm.subCategory,
        semester: parseInt(selectedSemester),
        year: parseInt(selectedYear),
        isActive: true
      };

      await firebaseService.addCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        newCourse
      );

      // Add audit log for course creation
      if (user) {
        await firebaseService.createAuditLog({
          action: 'เพิ่มรายวิชา',
          details: `เพิ่มรายวิชา ${newCourse.code} ${newCourse.name} ในหลักสูตร ${selectedProgram} ปีหลักสูตร ${selectedCurriculumYear} ชั้นปีที่ ${selectedYear} เทอม ${selectedSemester}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'course'
        });
      }

      setCourses([...courses, newCourse]);
      setIsAddDialogOpen(false);
      resetForm();

      toast({
        title: "เพิ่มรายวิชาสำเร็จ",
        description: `เพิ่มรายวิชา ${courseForm.code} ${courseForm.name} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายวิชาได้",
        variant: "destructive",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      code: course.code,
      name: course.name,
      credits: course.credits,
      description: course.description,
      prerequisites: course.prerequisites.join(', '),
      corequisites: course.corequisites.join(', '),
      category: course.category,
      mainCategory: course.mainCategory,
      subCategory: course.subCategory
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      const updatedCourse: Course = {
        ...editingCourse,
        code: courseForm.code,
        name: courseForm.name,
        credits: courseForm.credits,
        description: courseForm.description,
        prerequisites: courseForm.prerequisites ? courseForm.prerequisites.split(',').map(p => p.trim()) : [],
        corequisites: courseForm.corequisites ? courseForm.corequisites.split(',').map(c => c.trim()) : [],
        category: courseForm.category,
        mainCategory: courseForm.mainCategory,
        subCategory: courseForm.subCategory
      };

      await firebaseService.updateCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        updatedCourse
      );

      setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c));
      setIsEditDialogOpen(false);
      setEditingCourse(null);
      resetForm();

      toast({
        title: "แก้ไขรายวิชาสำเร็จ",
        description: `แก้ไขรายวิชา ${courseForm.code} ${courseForm.name} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขรายวิชาได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`คุณต้องการลบรายวิชา ${course.code} ${course.name} หรือไม่?`)) {
      return;
    }

    try {
      await firebaseService.deleteCourse(
        selectedProgram,
        selectedCurriculumYear,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        course.id
      );

      // Add audit log for course deletion
      if (user) {
        await firebaseService.createAuditLog({
          action: 'ลบรายวิชา',
          details: `ลบรายวิชา ${course.code} ${course.name} ออกจากหลักสูตร ${selectedProgram} ปีหลักสูตร ${selectedCurriculumYear} ชั้นปีที่ ${selectedYear} เทอม ${selectedSemester}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'course'
        });
      }

      setCourses(courses.filter(c => c.id !== course.id));

      toast({
        title: "ลบรายวิชาสำเร็จ",
        description: `ลบรายวิชา ${course.code} ${course.name} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายวิชาได้",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-blue-100 text-blue-800';
      case 'major': return 'bg-green-100 text-green-800';
      case 'elective': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-purple-100 text-purple-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'core': return 'วิชาแกน';
      case 'major': return 'วิชาเอก';
      case 'elective': return 'วิชาเลือก';
      case 'general': return 'วิชาศึกษาทั่วไป';
      case 'free': return 'วิชาเลือกเสรี';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            จัดการรายวิชา
          </CardTitle>
          <CardDescription>
            เลือกหลักสูตรและภาคเรียนเพื่อจัดการรายวิชา
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="ค้นหารายวิชา..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Badge variant="outline">
                    {filteredCourses.length} รายวิชา
                  </Badge>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มรายวิชา
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>เพิ่มรายวิชาใหม่</DialogTitle>
                      <DialogDescription>
                        กรอกข้อมูลรายวิชาที่ต้องการเพิ่ม
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">รหัสวิชา</Label>
                        <Input
                          id="code"
                          value={courseForm.code}
                          onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                          placeholder="เช่น IT-060243101"
                        />
                      </div>
                      <div>
                        <Label htmlFor="credits">หน่วยกิต</Label>
                        <Input
                          id="credits"
                          type="number"
                          min="1"
                          max="6"
                          value={courseForm.credits}
                          onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="name">ชื่อวิชา</Label>
                        <Input
                          id="name"
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                          placeholder="ชื่อรายวิชา"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">ประเภทวิชา</Label>
                        <Select value={courseForm.category} onValueChange={(value: any) => setCourseForm({...courseForm, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core">วิชาแกน</SelectItem>
                            <SelectItem value="major">วิชาเอก</SelectItem>
                            <SelectItem value="elective">วิชาเลือก</SelectItem>
                            <SelectItem value="general">วิชาศึกษาทั่วไป</SelectItem>
                            <SelectItem value="free">วิชาเลือกเสรี</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mainCategory">หมวดวิชา</Label>
                        <Select value={courseForm.mainCategory} onValueChange={(value) => setCourseForm({...courseForm, mainCategory: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mainCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="subCategory">กลุ่มวิชา</Label>
                        <Select value={courseForm.subCategory} onValueChange={(value) => setCourseForm({...courseForm, subCategory: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {subCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">คำอธิบายรายวิชา</Label>
                        <Textarea
                          id="description"
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                          placeholder="คำอธิบายรายวิชา"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prerequisites">วิชาที่ต้องเรียนมาก่อน</Label>
                        <Input
                          id="prerequisites"
                          value={courseForm.prerequisites}
                          onChange={(e) => setCourseForm({...courseForm, prerequisites: e.target.value})}
                          placeholder="คั่นด้วยเครื่องหมายจุลภาค"
                        />
                      </div>
                      <div>
                        <Label htmlFor="corequisites">วิชาที่ต้องเรียนพร้อมกัน</Label>
                        <Input
                          id="corequisites"
                          value={courseForm.corequisites}
                          onChange={(e) => setCourseForm({...courseForm, corequisites: e.target.value})}
                          placeholder="คั่นด้วยเครื่องหมายจุลภาค"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button onClick={handleAddCourse}>
                        <Save className="h-4 w-4 mr-2" />
                        บันทึก
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{course.code}</h3>
                              <Badge className={getCategoryBadgeColor(course.category)}>
                                {getCategoryName(course.category)}
                              </Badge>
                              <Badge variant="outline">{course.credits} หน่วยกิต</Badge>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2">{course.name}</h4>
                            {course.description && (
                              <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              {course.mainCategory && (
                                <span className="bg-gray-100 px-2 py-1 rounded">{course.mainCategory}</span>
                              )}
                              {course.subCategory && (
                                <span className="bg-gray-100 px-2 py-1 rounded">{course.subCategory}</span>
                              )}
                            </div>
                            {((course.prerequisites && course.prerequisites.length > 0) || (course.corequisites && course.corequisites.length > 0)) && (
                              <div className="mt-2 text-xs text-gray-500">
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <div>วิชาที่ต้องเรียนมาก่อน: {course.prerequisites.join(', ')}</div>
                                )}
                                {course.corequisites && course.corequisites.length > 0 && (
                                  <div>วิชาที่ต้องเรียนพร้อมกัน: {course.corequisites.join(', ')}</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredCourses.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'ไม่พบรายวิชาที่ค้นหา' : 'ไม่มีรายวิชาในภาคเรียนนี้'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขรายวิชา</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลรายวิชา
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-code">รหัสวิชา</Label>
              <Input
                id="edit-code"
                value={courseForm.code}
                onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                placeholder="เช่น IT-060243101"
              />
            </div>
            <div>
              <Label htmlFor="edit-credits">หน่วยกิต</Label>
              <Input
                id="edit-credits"
                type="number"
                min="1"
                max="6"
                value={courseForm.credits}
                onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-name">ชื่อวิชา</Label>
              <Input
                id="edit-name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                placeholder="ชื่อรายวิชา"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">ประเภทวิชา</Label>
              <Select value={courseForm.category} onValueChange={(value: any) => setCourseForm({...courseForm, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">วิชาแกน</SelectItem>
                  <SelectItem value="major">วิชาเอก</SelectItem>
                  <SelectItem value="elective">วิชาเลือก</SelectItem>
                  <SelectItem value="general">วิชาศึกษาทั่วไป</SelectItem>
                  <SelectItem value="free">วิชาเลือกเสรี</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-mainCategory">หมวดวิชา</Label>
              <Select value={courseForm.mainCategory} onValueChange={(value) => setCourseForm({...courseForm, mainCategory: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-subCategory">กลุ่มวิชา</Label>
              <Select value={courseForm.subCategory} onValueChange={(value) => setCourseForm({...courseForm, subCategory: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-description">คำอธิบายรายวิชา</Label>
              <Textarea
                id="edit-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="คำอธิบายรายวิชา"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-prerequisites">วิชาที่ต้องเรียนมาก่อน</Label>
              <Input
                id="edit-prerequisites"
                value={courseForm.prerequisites}
                onChange={(e) => setCourseForm({...courseForm, prerequisites: e.target.value})}
                placeholder="คั่นด้วยเครื่องหมายจุลภาค"
              />
            </div>
            <div>
              <Label htmlFor="edit-corequisites">วิชาที่ต้องเรียนพร้อมกัน</Label>
              <Input
                id="edit-corequisites"
                value={courseForm.corequisites}
                onChange={(e) => setCourseForm({...courseForm, corequisites: e.target.value})}
                placeholder="คั่นด้วยเครื่องหมายจุลภาค"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdateCourse}>
              <Save className="h-4 w-4 mr-2" />
              บันทึกการแก้ไข
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;