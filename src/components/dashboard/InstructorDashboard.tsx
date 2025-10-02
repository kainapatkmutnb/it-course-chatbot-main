import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useCourses, useStudyPlan } from '@/hooks/useFirebaseData';
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
  Building
} from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Use Firebase data instead of mock data
  const { users: allUsers, loading: usersLoading, error: usersError } = useUsers();
  const { courses: allCourses, loading: coursesLoading, error: coursesError } = useCourses();

  // Students under instructor's care (filter students)
  const studentsUnderCare = allUsers.filter(u => u.role === 'student');
  
  // Courses taught by this instructor
  const instructorCourses = allCourses.filter(course => 
    course.instructor === user?.name || course.instructor === user?.email
  );

  const getStudentStats = (studentId: string) => {
    // For now, return default stats since we need to implement proper study plan fetching
    // This would need to be updated to use useStudyPlan(studentId) for each student
    return { completed: 0, total: 0, gpa: '0.00' };
  };

  const filteredStudents = studentsUnderCare.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a student is selected, show their detail view
  if (selectedStudentId) {
    const selectedStudent = allUsers.find(u => u.id === selectedStudentId);
    if (selectedStudent) {
      return (
        <div className="min-h-screen p-6 gradient-subtle">
          <div className="container mx-auto">
            <StudentDetailView 
              student={selectedStudent} 
              onBack={() => setSelectedStudentId(null)} 
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
      <div className="container mx-auto space-y-6">
        {/* Welcome Section with User Info */}
        <Card className="shadow-soft border-0 bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  ยินดีต้อนรับ, {user?.name}
                </h1>
                <p className="text-muted-foreground mb-2">แดชบอร์ดอาจารย์ - คณะเทคโนโลยีสารสนเทศ</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>อาจารย์</span>
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

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                นักศึกษาที่ดูแล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-secondary" />
                <span className="text-2xl font-bold">{studentsUnderCare.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                วิชาที่สอน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{instructorCourses.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                นักศึกษาผ่าน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="w-8 h-8 text-success" />
                <span className="text-2xl font-bold">85%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ภาคการศึกษา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-info" />
                <span className="text-2xl font-bold">1/2567</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">นักศึกษาที่ดูแล</TabsTrigger>
            <TabsTrigger value="courses">วิชาที่สอน</TabsTrigger>
            <TabsTrigger value="statistics">สถิติ</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>นักศึกษาที่ดูแล</span>
                    </CardTitle>
                    <CardDescription>
                      รายชื่อนักศึกษาที่อยู่ในความดูแล
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหานักศึกษา..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const stats = getStudentStats(student.id);
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-soft transition-shadow">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.profilePicture} alt={student.name} />
                              <AvatarFallback>
                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.email}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  GPA {stats.gpa}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  ผ่าน {stats.completed} วิชา
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedStudentId(student.id)}
                            >
                              ดูรายละเอียด
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ไม่พบนักศึกษาที่ตรงกับการค้นหา</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>วิชาที่สอน</span>
                </CardTitle>
                <CardDescription>
                  รายวิชาที่คุณรับผิดชอบในภาคการศึกษานี้
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructorCourses.length > 0 ? (
                    instructorCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-medium">{course.code} - {course.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.credits} หน่วยกิต • {course.category === 'core' ? 'วิชาแกน' : course.category === 'general' ? 'ศึกษาทั่วไป' : 'วิชาเลือก'}
                            </div>
                            {course.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={course.isActive ? 'default' : 'secondary'}>
                            {course.isActive ? 'เปิดสอน' : 'ปิดสอน'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            จัดการ
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ยังไม่มีรายวิชาที่รับผิดชอบ</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>สถิติผลการเรียน</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">นักศึกษาผ่าน</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-success/20 rounded-full h-2">
                          <div className="bg-success h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">กำลังเรียน</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-warning/20 rounded-full h-2">
                          <div className="bg-warning h-2 rounded-full" style={{ width: '10%' }} />
                        </div>
                        <span className="font-medium">10%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ไม่ผ่าน</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-destructive/20 rounded-full h-2">
                          <div className="bg-destructive h-2 rounded-full" style={{ width: '5%' }} />
                        </div>
                        <span className="font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>นักศึกษาที่ต้องช่วยเหลือ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentsUnderCare.slice(0, 3).map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profilePicture} alt={student.name} />
                            <AvatarFallback className="text-xs">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ต้องการความช่วยเหลือ
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          ติดต่อ
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorDashboard;