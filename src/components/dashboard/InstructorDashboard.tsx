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
import { firebaseService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
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
  XCircle,
  Eye,
  Phone,
  MapPin,
  Plus,
  UserPlus,
  UserMinus
} from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading, error: usersError, refreshUsers } = useUsers();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const { studyPlans, loading: studyPlansLoading, error: studyPlansError } = useStudyPlans();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [allStudentsSearchTerm, setAllStudentsSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('students');
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  // Filter students under instructor's care
  const studentsUnderCare = useMemo(() => {
    if (!users || !user) return [];
    return users.filter(u => 
      u.role === 'student' && 
      u.advisorId === user.id
    );
  }, [users, user]);

  // Filter all students (not under care)
  const allStudents = useMemo(() => {
    if (!users || !user) return [];
    return users.filter(u => u.role === 'student');
  }, [users, user]);

  // Filter students not under instructor's care
  const studentsNotUnderCare = useMemo(() => {
    if (!users || !user) return [];
    return users.filter(u => 
      u.role === 'student' && 
      u.advisorId !== user.id
    );
  }, [users, user]);

  // Filter courses taught by instructor
  const instructorCourses = useMemo(() => {
    if (!courses || !user) return [];
    return courses.filter(course => 
      course.instructor === user.id
    );
  }, [courses, user]);

  // Get selected student's study plan
  const selectedStudentPlan = useMemo(() => {
    if (!selectedStudentId || !studyPlans) return null;
    return studyPlans.find(plan => plan.studentId === selectedStudentId);
  }, [selectedStudentId, studyPlans]);

  // Helper function to convert grade to grade point
  const getGradePoint = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 
      'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0.0;
  };

  // Calculate statistics for selected student
  const studentStats = useMemo(() => {
    if (!selectedStudentPlan || !courses) return null;

    const plannedCourses = selectedStudentPlan.courses.filter(course => course.status === 'planned') || [];
    const completedCourses = selectedStudentPlan.courses.filter(course => course.status === 'completed') || [];
    
    // Get course details
    const allCourses = courses;
    
    // Calculate course statuses
    const notTaken = allCourses.filter(course => 
      !selectedStudentPlan.courses.some(pc => pc.courseId === course.id)
    );
    
    const planned = plannedCourses.filter(pc => 
      !completedCourses.some(cc => cc.courseId === pc.courseId)
    );
    
    const inProgress = selectedStudentPlan.courses.filter(course => 
      course.status === 'in_progress'
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

  // Calculate overall statistics for all students
  const overallStats = useMemo(() => {
    if (!studentsUnderCare || !studyPlans || !courses) return null;

    let totalStudents = studentsUnderCare.length;
    let totalCompletedCourses = 0;
    let totalCredits = 0;
    let totalGradePoints = 0;
    let studentsWithGPA = 0;

    studentsUnderCare.forEach(student => {
      const studentPlan = studyPlans.find(plan => plan.studentId === student.id);
      if (studentPlan?.courses) {
        const completed = studentPlan.courses.filter(course => course.status === 'completed');
        totalCompletedCourses += completed.length;

        const studentCredits = completed.reduce((sum, cc) => {
          const course = courses.find(c => c.id === cc.courseId);
          return sum + (course?.credits || 0);
        }, 0);

        const studentGradePoints = completed.reduce((sum, cc) => {
          const course = courses.find(c => c.id === cc.courseId);
          const gradePoint = getGradePoint(cc.grade);
          return sum + (gradePoint * (course?.credits || 0));
        }, 0);

        if (studentCredits > 0) {
          totalCredits += studentCredits;
          totalGradePoints += studentGradePoints;
          studentsWithGPA++;
        }
      }
    });

    const averageGPA = studentsWithGPA > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    return {
      totalStudents,
      totalCompletedCourses,
      averageGPA,
      totalCredits
    };
  }, [studentsUnderCare, studyPlans, courses]);



  // Get individual student statistics
  const getStudentStatistics = (studentId: string) => {
    const studentPlan = studyPlans?.find(plan => plan.studentId === studentId);
    if (!studentPlan || !courses) return { completed: 0, gpa: '0.00', totalCredits: 0 };

    const completedCourses = studentPlan.courses?.filter(course => course.status === 'completed') || [];
    
    const totalCredits = completedCourses.reduce((sum, cc) => {
      const course = courses.find(c => c.id === cc.courseId);
      return sum + (course?.credits || 0);
    }, 0);

    const totalGradePoints = completedCourses.reduce((sum, cc) => {
      const course = courses.find(c => c.id === cc.courseId);
      const gradePoint = getGradePoint(cc.grade);
      return sum + (gradePoint * (course?.credits || 0));
    }, 0);

    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    return {
      completed: completedCourses.length,
      gpa,
      totalCredits
    };
  };

  const filteredStudents = studentsUnderCare.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter all students for the new tab
  const filteredAllStudents = allStudents.filter(student =>
    student.name?.toLowerCase().includes(allStudentsSearchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(allStudentsSearchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(allStudentsSearchTerm.toLowerCase())
  );

  // Handle assigning student to instructor
  const handleAssignStudent = async (studentId: string) => {
    if (!user) return;
    
    setIsAssigning(studentId);
    try {
      const success = await firebaseService.assignStudentToInstructor(studentId, user.id);
      if (success) {
        toast({
          title: 'สำเร็จ',
          description: 'เพิ่มนักศึกษาเข้าสู่รายการที่ดูแลแล้ว',
        });
        await refreshUsers(); // Refresh the users list
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเพิ่มนักศึกษาได้',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มนักศึกษาได้',
        variant: 'destructive'
      });
    } finally {
      setIsAssigning(null);
    }
  };

  // Handle removing student from instructor
  const handleRemoveStudent = async (studentId: string) => {
    if (!user) return;
    
    setIsAssigning(studentId);
    try {
      const success = await firebaseService.removeStudentFromInstructor(studentId, user.id);
      if (success) {
        toast({
          title: 'สำเร็จ',
          description: 'ลบนักศึกษาออกจากรายการที่ดูแลแล้ว',
        });
        await refreshUsers(); // Refresh the users list
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถลบนักศึกษาได้',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบนักศึกษาได้',
        variant: 'destructive'
      });
    } finally {
      setIsAssigning(null);
    }
  };

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

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              นักศึกษาที่ดูแล
            </TabsTrigger>
            <TabsTrigger value="grade-stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              สถิติเกรด
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  ค้นหานักศึกษาที่ดูแล
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือรหัสนักศึกษา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => {
                const stats = getStudentStatistics(student.id);
                return (
                  <Card key={student.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.profilePicture || ''} />
                          <AvatarFallback>
                            {student.name?.charAt(0) || student.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {student.name || 'ไม่ระบุชื่อ'}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {student.studentId}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {(student as any).phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{(student as any).phone}</span>
                          </div>
                        )}
                        {student.department && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building className="h-4 w-4" />
                            <span>{student.department}</span>
                          </div>
                        )}
                      </div>

                      {/* Academic Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                          <p className="text-xs text-gray-600">วิชาที่ผ่าน</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.gpa}</p>
                          <p className="text-xs text-gray-600">เกรดเฉลี่ย</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-orange-600">{stats.totalCredits}</p>
                        <p className="text-xs text-gray-600">หน่วยกิตรวม</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูรายละเอียด
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={isAssigning === student.id}
                        >
                          {isAssigning === student.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No students found */}
            {filteredStudents.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'ไม่พบนักศึกษาที่ค้นหา' : 'ไม่มีนักศึกษาที่ดูแล'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกดคำ' 
                      : 'ยังไม่มีนักศึกษาที่ได้รับมอบหมายให้คุณดูแล'
                    }
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchTerm('')}
                    >
                      ล้างการค้นหา
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Grade Statistics Tab */}
          <TabsContent value="grade-stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  สถิติเกรดนักศึกษาที่ดูแล
                </CardTitle>
                <CardDescription>
                  ภาพรวมสถิติเกรดและผลการเรียนของนักศึกษาที่อยู่ในการดูแล
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supervisedStudents.length > 0 ? (
                  <div className="space-y-6">
                    {/* Overall Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {supervisedStudents.length}
                          </p>
                          <p className="text-sm text-gray-600">นักศึกษาทั้งหมด</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {(supervisedStudents.reduce((sum, student) => {
                              const stats = getStudentStatistics(student.id);
                              return sum + parseFloat(stats.gpa);
                            }, 0) / supervisedStudents.length).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">เกรดเฉลี่ยรวม</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {Math.round(supervisedStudents.reduce((sum, student) => {
                              const stats = getStudentStatistics(student.id);
                              return sum + stats.totalCredits;
                            }, 0) / supervisedStudents.length)}
                          </p>
                          <p className="text-sm text-gray-600">หน่วยกิตเฉลี่ย</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round(supervisedStudents.reduce((sum, student) => {
                              const stats = getStudentStatistics(student.id);
                              return sum + stats.completed;
                            }, 0) / supervisedStudents.length)}
                          </p>
                          <p className="text-sm text-gray-600">วิชาที่ผ่านเฉลี่ย</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Individual Student Statistics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">รายละเอียดแต่ละคน</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {supervisedStudents.map((student) => {
                          const stats = getStudentStatistics(student.id);
                          return (
                            <Card key={student.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={student.profilePicture || ''} />
                                      <AvatarFallback>
                                        {student.name?.charAt(0) || student.email?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{student.name || 'ไม่ระบุชื่อ'}</p>
                                      <p className="text-sm text-gray-600">{student.studentId}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-4 text-center">
                                    <div>
                                      <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                                      <p className="text-xs text-gray-600">ผ่าน</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold text-blue-600">{stats.inProgress}</p>
                                      <p className="text-xs text-gray-600">กำลังเรียน</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold text-blue-600">{stats.gpa}</p>
                                      <p className="text-xs text-gray-600">เกรดเฉลี่ย</p>
                                    </div>
                                    <div>
                                      <p className="text-lg font-bold text-orange-600">{stats.totalCredits}</p>
                                      <p className="text-xs text-gray-600">หน่วยกิต</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      ยังไม่มีนักศึกษาที่ดูแล
                    </h3>
                    <p className="text-gray-600">
                      เมื่อมีนักศึกษาที่อยู่ในการดูแล สถิติเกรดจะแสดงที่นี่
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorDashboard;