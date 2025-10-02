import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useStudyPlan } from '@/hooks/useFirebaseData';
import { generateCoursesForSemester } from '@/services/completeCurriculumData';
import { getDepartments, extractDepartmentFromStudentInfo } from '@/services/departmentService';
import { Department } from '@/types/course';
import StudyPlanManager from '@/components/study-plan/StudyPlanManager';
import { 
  AlertCircle,
  Target,
  User,
  Mail,
  School,
  CheckCircle,
  TrendingUp,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react';



const StudentDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: user?.name || '',
    studentId: user?.studentId || '',
    department: user?.department || ''
  });

  // Get departments data
  const departments = getDepartments();
  
  // Auto-detect department from student ID or email if not set
  const detectedDepartment = extractDepartmentFromStudentInfo(user?.studentId, user?.email);
  const currentDepartment = user?.department || detectedDepartment;
  
  // Use Firebase data instead of mock data
  const { studyPlan, loading: studyPlanLoading, error: studyPlanError } = useStudyPlan(user?.id);

  // Profile editing functions
  const handleEditProfile = () => {
    setEditedProfile({
      name: user?.name || '',
      studentId: user?.studentId || '',
      department: currentDepartment
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (updateProfile) {
        await updateProfile({
          name: editedProfile.name,
          studentId: editedProfile.studentId,
          department: editedProfile.department
        });
      }
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      name: user?.name || '',
      studentId: user?.studentId || '',
      department: currentDepartment
    });
    setIsEditingProfile(false);
  };

  // Removed departments/courses hooks no longer needed after deleting curriculum tab
  // const { departments, loading: departmentsLoading, error: departmentsError } = useDepartments();
  // const { courses, loading: coursesLoading, error: coursesError } = useCourses();

  // Removed curriculum-derived selections and semesterCourses
  // const selectedDept = departments.find(d => d.id === selectedDepartment);
  // const selectedCurr = selectedDept?.curricula.find(c => c.id === selectedCurriculum);
  // const selectedSemesterData = selectedCurr?.semesters.find(s => s.year === selectedYear && s.semester === selectedSemester);
  // const semesterCourses = selectedSemesterData ? 
  //   (selectedSemesterData.courses.length > 0 ? 
  //     selectedSemesterData.courses : 
  //     generateCoursesForSemester(selectedDepartment, selectedCurriculum, selectedYear.toString(), selectedSemester.toString())
  //   ) : [];

  // Calculate statistics from real data
  const completedCourses = studyPlan?.courses.filter(course => course.status === 'completed') || [];
  const inProgressCourses = studyPlan?.courses.filter(course => course.status === 'in_progress') || [];
  const plannedCourses = studyPlan?.courses.filter(course => course.status === 'planned') || [];
  
  const completedCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);
  const totalCredits = studyPlan?.totalCredits || 140;
  const progressPercentage = (completedCredits / totalCredits) * 100;

  // Calculate GPA from completed courses
  const calculateGPA = () => {
    const gradedCourses = completedCourses.filter(course => course.grade);
    if (gradedCourses.length === 0) return 0;

    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
    };

    const totalPoints = gradedCourses.reduce((sum, course) => {
      const points = gradePoints[course.grade || 'F'] || 0;
      return sum + (points * course.credits);
    }, 0);

    const totalCreditsGraded = gradedCourses.reduce((sum, course) => sum + course.credits, 0);
    return totalCreditsGraded > 0 ? totalPoints / totalCreditsGraded : 0;
  };

  const currentGPA = calculateGPA();

  // Update loading/error conditions to rely only on studyPlan
  if (studyPlanLoading) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (studyPlanError) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{studyPlanError}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>ลองใหม่</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 gradient-subtle">
      <div className="container mx-auto space-y-6">
        {/* Welcome Section with User Info */}
        <Card className="shadow-soft border-0 bg-gradient-to-r from-student/10 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback className="bg-student text-white text-lg">
                  {user?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  ยินดีต้อนรับ, {user?.name}
                </h1>
                <p className="text-muted-foreground mb-2">แดชบอร์ดนักศึกษา - คณะเทคโนโลยีและการจัดการอุตสาหกรรม</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>นักศึกษา</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <School className="w-4 h-4" />
                    <span>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="study-plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="study-plan">จัดการแผนการเรียน</TabsTrigger>
            {/* Removed curriculum tab trigger */}
            <TabsTrigger value="profile">โปรไฟล์</TabsTrigger>
          </TabsList>

          {/* Study Plan Management Tab */}
          <TabsContent value="study-plan" className="space-y-6">
            <StudyPlanManager />
          </TabsContent>

          {/* Removed Curriculum Tab and its content */}
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>ข้อมูลส่วนตัว</span>
                  </div>
                  {!isEditingProfile ? (
                    <Button onClick={handleEditProfile} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไข
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        บันทึก
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        ยกเลิก
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription>
                  จัดการข้อมูลส่วนตัวของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                    {isEditingProfile ? (
                      <Input 
                        id="name" 
                        value={editedProfile.name} 
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <Input id="name" value={user?.name || ''} readOnly />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input id="email" value={user?.email || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">รหัสนักศึกษา</Label>
                    {isEditingProfile ? (
                      <Input 
                        id="studentId" 
                        value={editedProfile.studentId} 
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, studentId: e.target.value }))}
                        placeholder="เช่น s6506022620052"
                      />
                    ) : (
                      <Input id="studentId" value={user?.studentId || 'ไม่ระบุ'} readOnly />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">สาขาวิชา</Label>
                    {isEditingProfile ? (
                      <Select 
                        value={editedProfile.department} 
                        onValueChange={(value) => setEditedProfile(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสาขาวิชา" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.nameThai} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="department" 
                        value={departments.find(d => d.id === currentDepartment)?.nameThai || currentDepartment || 'ไม่ระบุ'} 
                        readOnly 
                      />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">สถิติการเรียน</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">{completedCredits}</div>
                      <div className="text-sm text-muted-foreground">หน่วยกิตที่เรียนแล้ว</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-success">{currentGPA.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">เกรดเฉลี่ย</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-warning">{inProgressCourses.length}</div>
                      <div className="text-sm text-muted-foreground">วิชาที่กำลังเรียน</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-info">{Math.round(progressPercentage)}%</div>
                      <div className="text-sm text-muted-foreground">ความคืบหน้า</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;