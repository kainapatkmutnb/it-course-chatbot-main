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
import { useStudyPlan, useStudentGPAAndCredits } from '@/hooks/useFirebaseData';
import { generateCoursesForSemester } from '@/services/completeCurriculumData';
import { getDepartments, extractDepartmentFromStudentInfo, getCurriculumTotalCredits } from '@/services/departmentService';
import { calculateGPA as calculateGPAUtil, evaluateAcademicStanding } from '@/utils/gradeUtils';
import { Department } from '@/types/course';
import StudyPlanManager from '@/components/study-plan/StudyPlanManager';
import StudyPlanProgress from '@/components/study-plan/StudyPlanProgress';
import StudyPlanReport from '@/components/study-plan/StudyPlanReport';
import { 
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Target,
  User,
  Mail,
  School,
  CheckCircle,
  TrendingUp,
  Clock,
  Edit,
  Save,
  X,
  Map,
  FileText
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
  
  // Use new hook to get GPA and credits from Firebase
  const { 
    data: gpaData, 
    loading: gpaLoading, 
    error: gpaError, 
    refreshGPAAndCredits, 
    updateGPAAndCredits 
  } = useStudentGPAAndCredits(user?.id);

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
  const completedCourses = studyPlan?.courses?.filter(course => course.status === 'completed') || [];
  const inProgressCourses = studyPlan?.courses?.filter(course => course.status === 'in_progress') || [];
  const plannedCourses = studyPlan?.courses?.filter(course => course.status === 'planned') || [];
  
  // Calculate GPA, credits, and academic standing from studyPlan using standard calculateGPAUtil and evaluateAcademicStanding
  const rawCourses = studyPlan?.courses || [];
  const gpaCalcResult = calculateGPAUtil(rawCourses);
  const standingResult = evaluateAcademicStanding(rawCourses);
  const requiredCurriculumTotal = getCurriculumTotalCredits(studyPlan?.program, studyPlan?.curriculumYear);

  const completedCredits = gpaData?.completedCredits ?? gpaCalcResult.completedCredits;
  const totalCredits = studyPlan?.totalCredits || gpaData?.totalCredits || requiredCurriculumTotal;
  const currentGPA = gpaData?.gpa ?? (standingResult.currentGPAX || gpaCalcResult.gpa);
  const progressPercentage = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

  // Auto-sync student year in user profile if it does not match the current calculated year
  React.useEffect(() => {
    if (!user || user.role !== 'student' || !studyPlan?.courses) return;
    let calculatedYear = 1;
    if (inProgressCourses.length > 0) {
      calculatedYear = Math.max(...inProgressCourses.map(c => Number(c.year) || 1));
    } else if (completedCourses.length > 0) {
      const maxPassedYear = Math.max(...completedCourses.map(c => Number(c.year) || 1));
      const maxPassedSem = Math.max(...completedCourses.filter(c => Number(c.year) === maxPassedYear).map(c => Number(c.semester) || 1));
      calculatedYear = maxPassedSem >= 2 ? maxPassedYear + 1 : maxPassedYear;
    }
    if (calculatedYear > 0 && (user.studentYear !== calculatedYear || user.year !== calculatedYear)) {
      if (updateProfile) {
        updateProfile({ studentYear: calculatedYear, year: calculatedYear });
      }
    }
  }, [user?.id, user?.studentYear, user?.year, studyPlan?.courses?.length, inProgressCourses.length, completedCourses.length, updateProfile]);


  // Update loading/error conditions to include GPA data
  if (studyPlanLoading || gpaLoading) {
    return (
      <div className="academic-page min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (studyPlanError || gpaError) {
    return (
      <div className="academic-page min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <Card className="academic-panel w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{studyPlanError || gpaError}</p>
            <Button className="academic-control mt-4" onClick={() => window.location.reload()}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="academic-page min-h-screen p-6 gradient-subtle print:p-0 print:bg-white">
      <div className="container mx-auto space-y-6 print:space-y-0 print:max-w-none print:p-0">
        {/* Welcome Section with User Info */}
        <Card className="academic-welcome shadow-soft border-0 bg-gradient-to-r from-student/10 to-primary/10 print:hidden">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback className="bg-student text-white text-lg">
                  {user?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="academic-title text-2xl font-bold text-foreground">
                  ยินดีต้อนรับ, {user?.name}
                </h1>
                <p className="academic-copy text-muted-foreground mb-2">แดชบอร์ดนักศึกษา - คณะเทคโนโลยีและการจัดการอุตสาหกรรม</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="break-all">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 shrink-0" />
                    <span>นักศึกษา</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <School className="w-4 h-4 shrink-0" />
                    <span>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
 
        {/* Academic Standing Hero Banner (ระบบแจ้งเตือนสถานภาพทางวิชาการและวิทยาทัณฑ์) */}
        {standingResult && standingResult.history.length > 0 && (
          <Card className={`border shadow-sm print:hidden transition-all ${
            standingResult.isRetired
              ? 'border-red-600 bg-red-50/90 text-red-950'
              : standingResult.isLowProbation
                ? 'border-rose-300 bg-rose-50/70 text-rose-950'
                : standingResult.isHighProbation
                  ? 'border-amber-300 bg-amber-50/70 text-amber-950'
                  : 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
          }`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-base flex items-center gap-1.5">
                      {standingResult.isRetired ? (
                        <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                      ) : standingResult.isProbation ? (
                        <AlertTriangle className={`w-5 h-5 shrink-0 ${standingResult.isLowProbation ? 'text-rose-600' : 'text-amber-600'}`} />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      สถานภาพทางวิชาการ:
                    </span>
                    <Badge className={`text-xs px-2.5 py-0.5 font-medium ${
                      standingResult.isRetired
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : standingResult.isLowProbation
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : standingResult.isHighProbation
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}>
                      {standingResult.standingLabel}
                    </Badge>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      (GPAX สะสม: {currentGPA.toFixed(2)})
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                    {standingResult.isRetired ? (
                      <span className="font-semibold text-red-700">
                        {standingResult.retireReason} — กรุณาติดต่ออาจารย์ที่ปรึกษาและสำนักทะเบียนและประมวลผลทันทีเพื่อตรวจสอบสิทธิ์การยื่นคำร้อง
                      </span>
                    ) : standingResult.isLowProbation ? (
                      <span>
                        คุณมีเกรดเฉลี่ยสะสมอยู่ในเกณฑ์ <strong>วิทยาทัณฑ์โปรต่ำ (1.50 - 1.74)</strong> ติดต่อกันได้ไม่เกิน 4 ภาคการศึกษาปกติ และลงทะเบียนเรียนได้สูงสุดไม่เกิน <strong>16 หน่วยกิต</strong> (หากครบ 4 เทอมติดต่อกันจะพ้นสภาพนักศึกษา)
                      </span>
                    ) : standingResult.isHighProbation ? (
                      <span>
                        คุณมีเกรดเฉลี่ยสะสมอยู่ในเกณฑ์ <strong>วิทยาทัณฑ์โปรสูง (1.75 - 1.99)</strong> ลงทะเบียนเรียนได้ไม่เกิน <strong>16 หน่วยกิต</strong> และต้องสะสม GPAX รวมให้ถึง 2.00 ก่อนสำเร็จการศึกษา
                      </span>
                    ) : (
                      <span>
                        คุณอยู่ใน <strong>สถานภาพปกติ</strong> สามารถลงทะเบียนเรียนได้ 9 - 22 หน่วยกิตตามระเบียบมหาวิทยาลัย
                      </span>
                    )}
                  </p>

                  {/* Target Recovery Calculator */}
                  {standingResult.isProbation && standingResult.targetGPANextTerm && (
                    <div className="mt-2.5 p-3 rounded-md bg-white/85 border border-black/5 text-xs text-foreground/90 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-primary">
                        <Target className="w-3.5 h-3.5" />
                        เป้าหมายเกรดเฉลี่ยเพื่อพ้นวิทยาทัณฑ์ (GPA Recovery):
                      </div>
                      <p>
                        {standingResult.targetGPANextTerm.formulaExplanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4-Step Probation Stepper (for probation or retired) */}
                {(standingResult.isProbation || standingResult.isRetired) && (
                  <div className="shrink-0 bg-white/95 p-3.5 rounded-lg border border-black/10 text-center min-w-[240px] shadow-xs">
                    <div className="text-[11px] font-medium text-muted-foreground mb-2.5">
                      โควตาภาคการศึกษาวิทยาทัณฑ์ (สูงสุด 4 เทอมติด)
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4].map(step => {
                        const isActive = standingResult.consecutiveProbationCount >= step;
                        return (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step === 4 && isActive
                                ? 'bg-red-600 text-white ring-2 ring-red-400'
                                : isActive
                                  ? step >= 3
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-amber-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {step === 4 ? 'รีไทร์' : `${step}`}
                            </div>
                            {step < 4 && (
                              <div className={`w-3 h-0.5 ${
                                standingResult.consecutiveProbationCount > step ? 'bg-amber-500' : 'bg-muted'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-2 font-medium">
                      {standingResult.isRetired
                        ? '🛑 พ้นสภาพนักศึกษา'
                        : standingResult.consecutiveProbationCount === 3
                          ? '🚨 ระวัง! ภาคเรียนถัดไปเป็นเทอมตัดสิน'
                          : `สะสมแล้ว ${standingResult.consecutiveProbationCount}/4 เทอม (เหลือโอกาสอีก ${4 - standingResult.consecutiveProbationCount} เทอม)`}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="study-plan" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 print:hidden sm:grid-cols-4">
            <TabsTrigger className="min-h-11 whitespace-normal text-center" value="study-plan">จัดการแผนการเรียน</TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal text-center" value="study-progress">การวางแผนการเรียน</TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal text-center" value="report">รายงานแผนการเรียน</TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal text-center" value="profile">โปรไฟล์</TabsTrigger>
          </TabsList>

          {/* Study Plan Management Tab */}
          <TabsContent value="study-plan" className="space-y-6">
            <StudyPlanManager />
          </TabsContent>

          {/* Study Plan Progress Tab */}
          <TabsContent value="study-progress" className="space-y-6">
            <StudyPlanProgress />
          </TabsContent>
          
          {/* Study Plan Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <StudyPlanReport />
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="academic-panel shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>ข้อมูลส่วนตัว</span>
                  </div>
                  {!isEditingProfile ? (
                    <Button onClick={handleEditProfile} variant="outline" size="sm" className="academic-control">
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไข
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile} size="sm" className="academic-control">
                        <Save className="w-4 h-4 mr-2" />
                        บันทึก
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm" className="academic-control">
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
                        className="academic-control"
                      />
                    ) : (
                      <Input id="name" value={user?.name || ''} readOnly className="academic-control" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input id="email" value={user?.email || ''} readOnly className="academic-control" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">รหัสนักศึกษา</Label>
                    {isEditingProfile ? (
                      <Input 
                        id="studentId" 
                        value={editedProfile.studentId} 
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, studentId: e.target.value }))}
                        placeholder="เช่น s6506022620052"
                        className="academic-control"
                      />
                    ) : (
                      <Input id="studentId" value={user?.studentId || 'ไม่ระบุ'} readOnly className="academic-control" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">สาขาวิชา</Label>
                    {isEditingProfile ? (
                      <Select 
                        value={editedProfile.department} 
                        onValueChange={(value) => setEditedProfile(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger className="academic-control">
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
                        className="academic-control"
                      />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">สถิติการเรียน</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="academic-number text-2xl font-bold text-primary">{completedCredits}</div>
                      <div className="text-sm text-muted-foreground">หน่วยกิตที่เรียนแล้ว</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="academic-number text-2xl font-bold text-success">{currentGPA.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">เกรดเฉลี่ย</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="academic-number text-2xl font-bold text-emerald-600">{completedCourses.length}</div>
                      <div className="text-sm text-muted-foreground">วิชาที่เรียนผ่านแล้ว</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="academic-number text-2xl font-bold text-warning">{inProgressCourses.length}</div>
                      <div className="text-sm text-muted-foreground">วิชาที่กำลังเรียน</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="academic-number text-2xl font-bold text-info">{Math.round(progressPercentage)}%</div>
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
