import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
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
  Award,
  AlertCircle,
  Mail,
  User,
  Building,
  Plus,
  UserPlus,
  UserMinus,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  
  // Data states
  const [supervisedStudents, setSupervisedStudents] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [gradeStatistics, setGradeStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load instructor's students and statistics
  useEffect(() => {
    const loadInstructorData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load students supervised by this instructor
        const students = await firebaseService.getStudentsByInstructor(user.id);
        setSupervisedStudents(students);

        // Load available students (not assigned to any instructor)
        const available = await firebaseService.getAvailableStudents(user.id);
        console.log('Available students:', available);
        setAvailableStudents(available);

        // Load grade statistics for supervised students
        if (students.length > 0) {
          const studentIds = students.map(s => s.id);
          const stats = await firebaseService.getStudentGradeStatistics(studentIds);
          setGradeStatistics(stats);
        } else {
          setGradeStatistics({
            averageGPA: 0,
            totalCredits: 0,
            completedCredits: 0,
            studentsWithGPA: []
          });
        }

      } catch (err) {
        console.error('Error loading instructor data:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [user?.id]);

  // Handle adding student to instructor's supervision
  const handleAddStudent = async (studentId: string) => {
    if (!user?.id) return;
    
    try {
      setIsAssigning(studentId);
      const success = await firebaseService.assignStudentToInstructor(studentId, user.id);
      
      if (success) {
        toast({
          title: "สำเร็จ",
          description: "เพิ่มนักศึกษาเข้าสู่การดูแลเรียบร้อยแล้ว",
        });
        
        // Refresh data
        const students = await firebaseService.getStudentsByInstructor(user.id);
        setSupervisedStudents(students);
        
        const available = await firebaseService.getAvailableStudents(user.id);
        setAvailableStudents(available);
        
        // Update statistics
        if (students.length > 0) {
          const studentIds = students.map(s => s.id);
          const stats = await firebaseService.getStudentGradeStatistics(studentIds);
          setGradeStatistics(stats);
        }
        
        setShowAddStudentDialog(false);
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเพิ่มนักศึกษาได้",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มนักศึกษาได้",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(null);
    }
  };

  // Handle removing student from instructor's supervision
  const handleRemoveStudent = async (studentId: string) => {
    if (!user?.id) return;
    
    try {
      setIsAssigning(studentId);
      const success = await firebaseService.removeStudentFromInstructor(studentId, user.id);
      
      if (success) {
        toast({
          title: "สำเร็จ",
          description: "ยกเลิกการดูแลนักศึกษาเรียบร้อยแล้ว",
        });
        
        // Refresh data
        const students = await firebaseService.getStudentsByInstructor(user.id);
        setSupervisedStudents(students);
        
        const available = await firebaseService.getAvailableStudents(user.id);
        setAvailableStudents(available);
        
        // Update statistics
        if (students.length > 0) {
          const studentIds = students.map(s => s.id);
          const stats = await firebaseService.getStudentGradeStatistics(studentIds);
          setGradeStatistics(stats);
        } else {
          setGradeStatistics({
            averageGPA: 0,
            totalCredits: 0,
            completedCredits: 0,
            studentsWithGPA: []
          });
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถยกเลิกการดูแลนักศึกษาได้",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกการดูแลนักศึกษาได้",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(null);
    }
  };

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return supervisedStudents;
    
    return supervisedStudents.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supervisedStudents, searchTerm]);

  // Filter available students for adding
  const filteredAvailableStudents = useMemo(() => {
    console.log('Available students before filter:', availableStudents);
    console.log('Search term:', searchTerm);
    
    if (!searchTerm) {
      console.log('No search term, returning all available students:', availableStudents);
      return availableStudents;
    }
    
    const filtered = availableStudents.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('Filtered available students:', filtered);
    return filtered;
  }, [availableStudents, searchTerm]);

  // Calculate student statistics for display
  const getStudentStats = (student: any) => {
    const studyPlan = gradeStatistics?.studentsWithGPA?.find(
      (s: any) => s.studentId === student.id
    );
    
    return {
      gpa: studyPlan?.gpa?.toFixed(2) || '0.00',
      totalCredits: studyPlan?.credits || 0,
      completed: 0, // This would need to be calculated from course completion data
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">แดชบอร์ดอาจารย์</h1>
          <p className="text-muted-foreground">จัดการและติดตามนักศึกษาที่ดูแล</p>
        </div>
        <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              เพิ่มนักศึกษา
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มนักศึกษาเข้าสู่การดูแล</DialogTitle>
              <DialogDescription>
                เลือกนักศึกษาที่ต้องการเพิ่มเข้าสู่การดูแล
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="ค้นหานักศึกษา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {/* {console.log('Rendering available students:', filteredAvailableStudents)} */}
                {filteredAvailableStudents.map((student) => (
                  <Card key={student.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.studentId} • {student.department}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {student.advisorId ? (
                              <Badge variant="secondary" className="text-xs">
                                มีอาจารย์ที่ปรึกษาแล้ว
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                ยังไม่มีอาจารย์ที่ปรึกษา
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddStudent(student.id)}
                        disabled={isAssigning === student.id}
                        size="sm"
                      >
                        {isAssigning === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                {filteredAvailableStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    ไม่พบนักศึกษาที่สามารถเพิ่มได้
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">นักศึกษาที่ดูแล</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supervisedStudents.length}</div>
            <p className="text-xs text-muted-foreground">คน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เกรดเฉลี่ย</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradeStatistics?.averageGPA?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">GPA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หน่วยกิตเฉลี่ย</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(gradeStatistics?.totalCredits / supervisedStudents.length) || 0}
            </div>
            <p className="text-xs text-muted-foreground">หน่วยกิต</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความคืบหน้า</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((gradeStatistics?.completedCredits / gradeStatistics?.totalCredits) * 100) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">เฉลี่ย</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="students">นักศึกษาที่ดูแล</TabsTrigger>
          <TabsTrigger value="statistics">สถิติเกรด</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหานักศึกษา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const stats = getStudentStats(student);
              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{student.name}</CardTitle>
                          <CardDescription>{student.studentId}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                        disabled={isAssigning === student.id}
                      >
                        {isAssigning === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{student.department}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.gpa}</div>
                        <div className="text-xs text-muted-foreground">GPA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.totalCredits}</div>
                        <div className="text-xs text-muted-foreground">หน่วยกิต</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{stats.completed}</div>
                        <div className="text-xs text-muted-foreground">จบแล้ว</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      ดูรายละเอียด
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">ไม่มีนักศึกษาที่ดูแล</h3>
                <p className="text-muted-foreground text-center mb-4">
                  คุณยังไม่มีนักศึกษาที่ดูแล หรือไม่พบนักศึกษาที่ค้นหา
                </p>
                <Button onClick={() => setShowAddStudentDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  เพิ่มนักศึกษา
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GPA Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  การกระจายของเกรด
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gradeStatistics?.studentsWithGPA?.length > 0 ? (
                  <div className="space-y-3">
                    {gradeStatistics.studentsWithGPA.map((student: any, index: number) => {
                      const studentInfo = supervisedStudents.find(s => s.id === student.studentId);
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{studentInfo?.name || 'Unknown'}</span>
                          <Badge variant={student.gpa >= 3.5 ? 'default' : student.gpa >= 3.0 ? 'secondary' : 'destructive'}>
                            {student.gpa.toFixed(2)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    ไม่มีข้อมูลเกรด
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Credit Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  สรุปหน่วยกิต
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>หน่วยกิตรวม:</span>
                    <span className="font-bold">{gradeStatistics?.totalCredits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>หน่วยกิตที่จบแล้ว:</span>
                    <span className="font-bold text-green-600">{gradeStatistics?.completedCredits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เกรดเฉลี่ยรวม:</span>
                    <span className="font-bold text-blue-600">
                      {gradeStatistics?.averageGPA?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <Dialog open={!!selectedStudentId} onOpenChange={() => setSelectedStudentId('')}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดนักศึกษา</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <StudentDetailView studentId={selectedStudentId} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InstructorDashboard;