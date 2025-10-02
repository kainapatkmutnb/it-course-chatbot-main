import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useCourses, useStudyPlans } from '@/hooks/useFirebaseData';
import StudentDetailView from './StudentDetailView';
import { 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Search,
  TrendingUp,
  Users,
  Calendar,
  Award,
  AlertCircle,
  Mail,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const { studyPlans, loading: studyPlansLoading, error: studyPlansError } = useStudyPlans();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Filter students under instructor's care
  const studentsUnderCare = useMemo(() => {
    if (!users || !user) return [];
    return users.filter(u => 
      u.role === 'student' && 
      u.advisorId === user.uid
    );
  }, [users, user]);

  // Filter courses taught by instructor
  const instructorCourses = useMemo(() => {
    if (!courses || !user) return [];
    return courses.filter(course => 
      course.instructorId === user.uid
    );
  }, [courses, user]);

  // Get selected student's study plan
  const selectedStudentPlan = useMemo(() => {
    if (!selectedStudentId || !studyPlans) return null;
    return studyPlans.find(plan => plan.studentId === selectedStudentId);
  }, [selectedStudentId, studyPlans]);

  // Calculate statistics for selected student
  const studentStats = useMemo(() => {
    if (!selectedStudentPlan || !courses) return null;

    const plannedCourses = selectedStudentPlan.plannedCourses || [];
    const completedCourses = selectedStudentPlan.completedCourses || [];
    
    // Get course details
    const allCourses = courses;
    
    // Calculate course statuses
    const notTaken = allCourses.filter(course => 
      !plannedCourses.some(pc => pc.courseId === course.id) &&
      !completedCourses.some(cc => cc.courseId === course.id)
    );
    
    const planned = plannedCourses.filter(pc => 
      !completedCourses.some(cc => cc.courseId === pc.courseId)
    );
    
    const inProgress = plannedCourses.filter(pc => 
      pc.semester === 'current' && 
      !completedCourses.some(cc => cc.courseId === pc.courseId)
    );
    
    const completed = completedCourses;

    // Calculate GPA
    const totalCredits = completed.reduce((sum, cc) => {
      const course = allCourses.find(c => c.id === cc.courseId);
      return sum + (course?.credits || 0);
    }, 0);

    const totalGradePoints = completed.reduce((sum, cc) => {
      const course = allCourses.find(c => c.id === cc.courseId);
      const gradePoint = getGradePoint(cc.grade);
      return sum + (gradePoint * (course?.credits || 0));
    }, 0);

    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    return {
      notTaken: notTaken.length,
      planned: planned.length,
      inProgress: inProgress.length,
      completed: completed.length,
      totalCredits,
      gpa
    };
  }, [selectedStudentPlan, courses]);

  // Helper function to convert grade to grade point
  const getGradePoint = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 
      'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0.0;
  };

  const getStudentStats = (studentId: string) => {
    // For now, return default stats since we need to implement proper study plan fetching
    // This would need to be updated to use useStudyPlan(studentId) for each student
    return { completed: 0, total: 0, gpa: '0.00' };
  };

  const filteredStudents = studentsUnderCare.filter(student =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a student is selected, show their detail view
  if (selectedStudentId) {
    const selectedStudent = users.find(u => u.id === selectedStudentId);
    if (selectedStudent) {
      return (
        <div className="min-h-screen p-6 gradient-subtle">
          <div className="container mx-auto">
            <StudentDetailView 
              student={selectedStudent} 
              onBack={() => setSelectedStudentId('')} 
            />
          </div>
        </div>
      );
    }
  }

  if (usersLoading || coursesLoading || studyPlansLoading) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (usersError || coursesError || studyPlansError) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">
              {usersError || coursesError || studyPlansError}
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 gradient-subtle">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดอาจารย์</h1>
            <p className="text-gray-600 mt-1">จัดการและติดตามนักศึกษาที่ดูแล</p>
          </div>
        </div>

        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              เลือกนักศึกษาที่ต้องการดู
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกนักศึกษา..." />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsUnderCare.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.displayName} ({student.studentId}) - {student.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedStudentId && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedStudentId('')}
                >
                  ล้างการเลือก
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Statistics */}
        {selectedStudentId && studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ยังไม่ผ่าน</p>
                    <p className="text-2xl font-bold text-red-600">{studentStats.notTaken}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">วางแผนเรียน</p>
                    <p className="text-2xl font-bold text-blue-600">{studentStats.planned}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">กำลังเรียน</p>
                    <p className="text-2xl font-bold text-orange-600">{studentStats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">เรียนจบแล้ว</p>
                    <p className="text-2xl font-bold text-green-600">{studentStats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GPA and Credits */}
        {selectedStudentId && studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  เกรดเฉลี่ย (GPA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{studentStats.gpa}</p>
                  <p className="text-gray-600 mt-2">จาก 4.00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  หน่วยกิตรวม
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{studentStats.totalCredits}</p>
                  <p className="text-gray-600 mt-2">หน่วยกิต</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Details */}
        {selectedStudentId && selectedStudentPlan && (
          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="completed">เรียนจบแล้ว</TabsTrigger>
              <TabsTrigger value="inprogress">กำลังเรียน</TabsTrigger>
              <TabsTrigger value="planned">วางแผนเรียน</TabsTrigger>
              <TabsTrigger value="nottaken">ยังไม่ผ่าน</TabsTrigger>
            </TabsList>

            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>รายวิชาที่เรียนจบแล้ว</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedStudentPlan.completedCourses?.map((completedCourse) => {
                      const course = courses.find(c => c.id === completedCourse.courseId);
                      return (
                        <div key={completedCourse.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{course?.code} - {course?.name}</p>
                            <p className="text-sm text-gray-600">{course?.credits} หน่วยกิต</p>
                          </div>
                          <Badge variant={completedCourse.grade === 'A' ? 'default' : 
                                        completedCourse.grade === 'F' ? 'destructive' : 'secondary'}>
                            {completedCourse.grade}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inprogress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>รายวิชาที่กำลังเรียน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedStudentPlan.plannedCourses?.filter(pc => 
                      pc.semester === 'current' && 
                      !selectedStudentPlan.completedCourses?.some(cc => cc.courseId === pc.courseId)
                    ).map((plannedCourse) => {
                      const course = courses.find(c => c.id === plannedCourse.courseId);
                      return (
                        <div key={plannedCourse.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{course?.code} - {course?.name}</p>
                            <p className="text-sm text-gray-600">{course?.credits} หน่วยกิต</p>
                          </div>
                          <Badge variant="outline">กำลังเรียน</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planned" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>รายวิชาที่วางแผนเรียน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedStudentPlan.plannedCourses?.filter(pc => 
                      pc.semester !== 'current' && 
                      !selectedStudentPlan.completedCourses?.some(cc => cc.courseId === pc.courseId)
                    ).map((plannedCourse) => {
                      const course = courses.find(c => c.id === plannedCourse.courseId);
                      return (
                        <div key={plannedCourse.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{course?.code} - {course?.name}</p>
                            <p className="text-sm text-gray-600">{course?.credits} หน่วยกิต • เทอม {plannedCourse.semester}</p>
                          </div>
                          <Badge variant="secondary">วางแผน</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nottaken" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>รายวิชาที่ยังไม่ผ่าน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courses.filter(course => 
                      !selectedStudentPlan.plannedCourses?.some(pc => pc.courseId === course.id) &&
                      !selectedStudentPlan.completedCourses?.some(cc => cc.courseId === course.id)
                    ).map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{course.code} - {course.name}</p>
                          <p className="text-sm text-gray-600">{course.credits} หน่วยกิต</p>
                        </div>
                        <Badge variant="destructive">ยังไม่ผ่าน</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* No student selected message */}
        {!selectedStudentId && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">เลือกนักศึกษาเพื่อดูข้อมูล</h3>
              <p className="text-gray-600">กรุณาเลือกนักศึกษาจากรายการด้านบนเพื่อดูสถิติและรายละเอียดการเรียน</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;