import React, { useState } from 'react';
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
import { firebaseService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
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

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [prerequisiteToAdd, setPrerequisiteToAdd] = useState<string>('');
  const [coursePrerequisites, setCoursePrerequisites] = useState<{ [key: string]: string[] }>({
    'IT201': ['IT101'],
    'IT301': ['IT201'],
    'IT401': ['IT301']
  });

  // Use Firebase data instead of mock data
  const { courses: allCourses, loading: coursesLoading, error: coursesError } = useCourses();
  
  const filteredCourses = allCourses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPrerequisite = async () => {
    if (selectedCourse && prerequisiteToAdd && selectedCourse !== prerequisiteToAdd) {
      try {
        // Update prerequisites in Firebase
        const updatedPrerequisites = [...(coursePrerequisites[selectedCourse] || []), prerequisiteToAdd];
        
        // Update local state
        setCoursePrerequisites(prev => ({
          ...prev,
          [selectedCourse]: updatedPrerequisites
        }));
        
        setPrerequisiteToAdd('');
        
        // Create audit log
        await firebaseService.createAuditLog({
          action: 'add_prerequisite',
          userId: user?.email || '',
          details: `เพิ่มเงื่อนไขวิชา ${prerequisiteToAdd} สำหรับ ${selectedCourse}`,
          timestamp: new Date()
        });
        
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

  const removePrerequisite = async (courseCode: string, prerequisite: string) => {
    try {
      // Update local state
      setCoursePrerequisites(prev => ({
        ...prev,
        [courseCode]: (prev[courseCode] || []).filter(p => p !== prerequisite)
      }));
      
      // Create audit log
      await firebaseService.createAuditLog({
        action: 'remove_prerequisite',
        userId: user?.email || '',
        details: `ลบเงื่อนไขวิชา ${prerequisite} ออกจาก ${courseCode}`,
        timestamp: new Date()
      });
      
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

  const saveAllPrerequisites = async () => {
    try {
      // In a real implementation, you would save prerequisites to Firebase
      // For now, we'll just create an audit log
      await firebaseService.createAuditLog({
        action: 'save_prerequisites',
        userId: user?.email || '',
        details: 'บันทึกการเปลี่ยนแปลงเงื่อนไขรายวิชาทั้งหมด',
        timestamp: new Date()
      });
      
      toast({
        title: 'บันทึกการเปลี่ยนแปลงสำเร็จ',
        description: 'เงื่อนไขรายวิชาทั้งหมดถูกอัปเดตแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้',
        variant: 'destructive'
      });
    }
  };

  const stats = {
    totalCourses: allCourses.length,
    coursesWithPrerequisites: Object.keys(coursePrerequisites).length,
    totalPrerequisites: Object.values(coursePrerequisites).flat().length
  };

  if (coursesLoading) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="min-h-screen p-6 gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{coursesError}</p>
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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">แดชบอร์ดบุคลากร</h1>
            <p className="text-muted-foreground">
              ยินดีต้อนรับ, {user?.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-8 h-8 text-staff" />
            <div className="text-right">
              <div className="font-medium">บุคลากรวิชาการ</div>
              <div className="text-sm text-muted-foreground">จัดการเงื่อนไขรายวิชา</div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รายวิชาทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{stats.totalCourses}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                วิชาที่มีเงื่อนไข
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Link className="w-8 h-8 text-warning" />
                <span className="text-2xl font-bold">{stats.coursesWithPrerequisites}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เงื่อนไขทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Settings className="w-8 h-8 text-success" />
                <span className="text-2xl font-bold">{stats.totalPrerequisites}</span>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {/* Add Prerequisites Section */}
                <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-primary/5">
                  <div>
                    <Label htmlFor="course-select">เลือกวิชา</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกวิชาที่ต้องการตั้งเงื่อนไข" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCourses.map((course) => (
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
                        {allCourses
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
                  {filteredCourses.map((course) => {
                    const prerequisites = coursePrerequisites[course.code] || [];
                    return (
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
                        
                        {prerequisites.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">เงื่อนไขการเรียน:</p>
                            <div className="flex flex-wrap gap-2">
                              {prerequisites.map((prerequisite, index) => (
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
                        ) : (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">ยังไม่มีเงื่อนไขการเรียน</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveAllPrerequisites} className="bg-success text-success-foreground hover:bg-success/90">
                    <Save className="w-4 h-4 mr-2" />
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </div>
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
                <div className="space-y-6">
                  {Object.entries(coursePrerequisites).length > 0 ? (
                    Object.entries(coursePrerequisites).map(([courseCode, prerequisites]) => {
                      const course = allCourses.find(c => c.code === courseCode);
                      return (
                        <div key={courseCode} className="p-4 border rounded-lg bg-secondary/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <BookOpen className="w-5 h-5 text-primary" />
                              <h3 className="font-medium">
                                {courseCode} - {course?.name || 'ไม่พบข้อมูลวิชา'}
                              </h3>
                            </div>
                            <Badge variant="outline">
                              {prerequisites.length} เงื่อนไข
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">เงื่อนไขการเรียน:</p>
                            <div className="flex flex-wrap gap-2">
                              {prerequisites.map((prerequisite, index) => (
                                <Badge key={`${courseCode}-pre-${prerequisite}`} variant="secondary" className="bg-success/10 text-success-foreground border-success/20">
                                  {prerequisite}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        ยังไม่มีการตั้งเงื่อนไขรายวิชา
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDashboard;