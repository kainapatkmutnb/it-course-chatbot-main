import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@/types/auth';
import { getAllCourses, studentCourses } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
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
  Calendar,
  FileText
} from 'lucide-react';

// Define CustomCourse interface locally
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

interface StudentDetailViewProps {
  studentId: string;
  onBack?: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ studentId, onBack }) => {
  const [student, setStudent] = useState<User | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const allCourses = getAllCourses();
  const [studyPlan, setStudyPlan] = useState<CustomCourse[]>([]);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(true);

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      if (studentId) {
        try {
          console.log('🔍 Fetching student data for ID:', studentId);
          setIsLoadingStudent(true);
          const studentData = await firebaseService.getUserById(studentId);
          console.log('👤 Student data received:', studentData);
          setStudent(studentData);
        } catch (error) {
          console.error('❌ Error fetching student:', error);
          setStudent(null);
        } finally {
          setIsLoadingStudent(false);
        }
      }
    };

    fetchStudent();
  }, [studentId]);

  // Fetch student courses data
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (studentId) {
        try {
          console.log('🔍 Fetching student courses for ID:', studentId);
          setIsLoadingCourses(true);
          const coursesData = await firebaseService.getStudentCourses(studentId);
          console.log('📚 Student courses data received:', coursesData);
          setStudentCourses(coursesData || []);
        } catch (error) {
          console.error('❌ Error fetching student courses:', error);
          setStudentCourses([]);
        } finally {
          setIsLoadingCourses(false);
        }
      }
    };

    fetchStudentCourses();
  }, [studentId]);

  // Fetch study plan data
  useEffect(() => {
    const fetchStudyPlan = async () => {
      if (studentId) {
        try {
          console.log('🔍 Fetching study plan for student ID:', studentId);
          setIsLoadingStudyPlan(true);
          const studyPlanData = await firebaseService.getStudyPlanByStudentId(studentId);
          console.log('📚 Study plan data received:', studyPlanData);
          
          if (studyPlanData && studyPlanData.courses) {
            console.log('✅ Setting study plan courses:', studyPlanData.courses);
            setStudyPlan(studyPlanData.courses);
          } else {
            console.log('❌ No study plan data or courses found');
            setStudyPlan([]);
          }
        } catch (error) {
          console.error('❌ Error fetching study plan:', error);
          setStudyPlan([]);
        } finally {
          setIsLoadingStudyPlan(false);
        }
      }
    };

    fetchStudyPlan();
  }, [studentId]);
  
  const getStudentProgress = () => {
    if (!student) return { completed: 0, inProgress: 0, failed: 0, totalCredits: 0, progressPercentage: 0 };
    
    const completed = studentCourses.filter(sc => sc.status === 'completed').length;
    const inProgress = studentCourses.filter(sc => sc.status === 'in_progress').length;
    const failed = studentCourses.filter(sc => sc.status === 'failed').length;
    const totalCredits = studentCourses
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

  // Loading state
  if (isLoadingStudent || isLoadingCourses) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลดข้อมูลนักศึกษา...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">ไม่พบข้อมูลนักศึกษา</h3>
            <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลนักศึกษาได้</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getStudentProgress();

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
        )}
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
              <AvatarImage src={(student as any).avatar} alt={student.name} />
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
                  <span className="text-sm">{(student as any).program}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details - Study Plan Only */}
      <Tabs defaultValue="study-plan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="study-plan">แผนการเรียน</TabsTrigger>
        </TabsList>

        <TabsContent value="study-plan" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>แผนการเรียน</span>
              </CardTitle>
              <CardDescription>
                รายวิชาที่นักศึกษาได้วางแผนการเรียนไว้
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudyPlan ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 animate-spin" />
                  <p>กำลังโหลดแผนการเรียน...</p>
                </div>
              ) : studyPlan.length > 0 ? (
                <div className="space-y-3">
                  {studyPlan.map((course) => {
                    // กำหนดสีตามสถานะของวิชา
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'bg-green-50 border-green-200';
                        case 'in_progress':
                          return 'bg-yellow-50 border-yellow-200';
                        case 'failed':
                          return 'bg-red-50 border-red-200';
                        case 'planned':
                          return 'bg-blue-50 border-blue-200';
                        default:
                          return 'bg-gray-50 border-gray-200';
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return <CheckCircle className="w-6 h-6 text-green-600" />;
                        case 'in_progress':
                          return <Clock className="w-6 h-6 text-yellow-600" />;
                        case 'failed':
                          return <AlertCircle className="w-6 h-6 text-red-600" />;
                        case 'planned':
                          return <BookOpen className="w-6 h-6 text-blue-600" />;
                        default:
                          return <BookOpen className="w-6 h-6 text-gray-600" />;
                      }
                    };

                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return <Badge className="bg-green-100 text-green-800 border-green-200">ผ่านแล้ว</Badge>;
                        case 'in_progress':
                          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">กำลังเรียน</Badge>;
                        case 'failed':
                          return <Badge className="bg-red-100 text-red-800 border-red-200">ไม่ผ่าน</Badge>;
                        case 'planned':
                          return <Badge className="bg-blue-100 text-blue-800 border-blue-200">วางแผนไว้</Badge>;
                        default:
                          return <Badge className="bg-gray-100 text-gray-800 border-gray-200">ไม่ระบุ</Badge>;
                      }
                    };

                    return (
                      <div key={course.id} className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(course.status)}`}>
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(course.status)}
                          <div>
                            <div className="font-medium">{course.code} - {course.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.credits} หน่วยกิต
                              {course.type && ` • ประเภท: ${course.type}`}
                              {course.grade && ` • เกรด: ${course.grade}`}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(course.status)}
                      </div>
                    );
                  })}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">รวมหน่วยกิตที่วางแผน:</span>
                      <span className="font-bold text-blue-600">
                        {studyPlan.reduce((total, course) => total + (course.credits || 0), 0)} หน่วยกิต
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>นักศึกษายังไม่ได้วางแผนการเรียน</p>
                  <p className="text-sm mt-2">กรุณาติดต่อนักศึกษาให้ทำการวางแผนการเรียนในระบบ</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetailView;