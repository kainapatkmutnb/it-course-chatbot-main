import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@/types/auth';
import { getAllCourses, studentCourses } from '@/services/completeCurriculumData';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Award,
  ArrowLeft,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

interface StudentDetailViewProps {
  student: User;
  onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, onBack }) => {
  const allCourses = getAllCourses();
  
  const getStudentProgress = () => {
    const studentEnrollments = studentCourses.filter(sc => sc.studentId === student.id);
    const completed = studentEnrollments.filter(sc => sc.status === 'completed').length;
    const inProgress = studentEnrollments.filter(sc => sc.status === 'in_progress').length;
    const failed = studentEnrollments.filter(sc => sc.status === 'failed').length;
    const totalCredits = studentEnrollments
      .filter(sc => sc.status === 'completed')
      .reduce((sum, sc) => {
        const course = allCourses.find(c => c.id === sc.courseId);
        return sum + (course?.credits || 0);
      }, 0);
    
    return { completed, inProgress, failed, totalCredits, progressPercentage: (totalCredits / 140) * 100 };
  };

  const getCourseDetails = (courseId: string) => {
    return allCourses.find(course => course.id === courseId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-warning" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <BookOpen className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const progress = getStudentProgress();
  const studentEnrollments = studentCourses.filter(sc => sc.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h2 className="text-2xl font-bold">รายละเอียดนักศึกษา</h2>
          <p className="text-muted-foreground">ข้อมูลและผลการเรียนของนักศึกษา</p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="text-lg">
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold">{student.name}</h3>
                <p className="text-muted-foreground">{student.studentId}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{student.program}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">ปีที่ {student.year}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">เกรดเฉลี่ย: 3.25</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ความก้าวหน้า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{progress.totalCredits}</span>
                <span className="text-sm text-muted-foreground">/ 140 หน่วยกิต</span>
              </div>
              <Progress value={progress.progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.progressPercentage.toFixed(1)}% เสร็จสิ้น
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              วิชาที่ผ่านแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-success" />
              <span className="text-2xl font-bold">{progress.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              กำลังเรียน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-warning" />
              <span className="text-2xl font-bold">{progress.inProgress}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ไม่ผ่าน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <span className="text-2xl font-bold">{progress.failed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Details */}
      <Tabs defaultValue="all-courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-courses">วิชาทั้งหมด</TabsTrigger>
          <TabsTrigger value="completed">ผ่านแล้ว</TabsTrigger>
          <TabsTrigger value="in-progress">กำลังเรียน</TabsTrigger>
          <TabsTrigger value="failed">ไม่ผ่าน</TabsTrigger>
        </TabsList>

        <TabsContent value="all-courses" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>รายวิชาทั้งหมด</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentEnrollments.map((studentCourse) => {
                  const course = getCourseDetails(studentCourse.courseId);
                  if (!course) return null;
                  
                  return (
                    <div key={studentCourse.courseId} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(studentCourse.status)}
                        <div>
                          <div className="font-medium">{course.code} - {course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.credits} หน่วยกิต 
                            {studentCourse.grade && ` • เกรด: ${studentCourse.grade}`}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={
                          studentCourse.status === 'completed' ? 'bg-success text-success-foreground' :
                          studentCourse.status === 'in_progress' ? 'bg-warning text-warning-foreground' :
                          studentCourse.status === 'failed' ? 'bg-destructive text-destructive-foreground' :
                          ''
                        }
                      >
                        {studentCourse.status === 'completed' ? 'ผ่านแล้ว' :
                         studentCourse.status === 'in_progress' ? 'กำลังเรียน' :
                         studentCourse.status === 'failed' ? 'ไม่ผ่าน' : 'ยังไม่ได้เรียน'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>วิชาที่ผ่านแล้ว</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentEnrollments.filter(sc => sc.status === 'completed').map((studentCourse) => {
                  const course = getCourseDetails(studentCourse.courseId);
                  if (!course) return null;
                  
                  return (
                    <div key={studentCourse.courseId} className="flex items-center justify-between p-4 rounded-lg border bg-success/5">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                          <div className="font-medium">{course.code} - {course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.credits} หน่วยกิต • เกรด: {studentCourse.grade}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">ผ่านแล้ว</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>วิชาที่กำลังเรียน</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentEnrollments.filter(sc => sc.status === 'in_progress').map((studentCourse) => {
                  const course = getCourseDetails(studentCourse.courseId);
                  if (!course) return null;
                  
                  return (
                    <div key={studentCourse.courseId} className="flex items-center justify-between p-4 rounded-lg border bg-warning/5">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-6 h-6 text-warning" />
                        <div>
                          <div className="font-medium">{course.code} - {course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.credits} หน่วยกิต • อาจารย์: {course.instructor}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-warning text-warning-foreground">กำลังเรียน</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>วิชาที่ไม่ผ่าน</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentEnrollments.filter(sc => sc.status === 'failed').length > 0 ? 
                  studentEnrollments.filter(sc => sc.status === 'failed').map((studentCourse) => {
                    const course = getCourseDetails(studentCourse.courseId);
                    if (!course) return null;
                    
                    return (
                      <div key={studentCourse.courseId} className="flex items-center justify-between p-4 rounded-lg border bg-destructive/5">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-6 h-6 text-destructive" />
                          <div>
                            <div className="font-medium">{course.code} - {course.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.credits} หน่วยกิต • เกรด: {studentCourse.grade}
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive">ไม่ผ่าน</Badge>
                      </div>
                    );
                  }) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                      <p>นักศึกษาไม่มีวิชาที่ไม่ผ่าน</p>
                    </div>
                  )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetailView;