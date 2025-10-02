import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useFirebaseData';
import { users, getAllCourses, auditLogs } from '@/services/completeCurriculumData';
import { firebaseService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Clock,
  Settings,
  Download,
  Upload,
  UserPlus,
  History,
  Save,
  Mail,
  User,
  Building
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { users: allUsers, loading: usersLoading, error: usersError } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    credits: 3,
    description: '',
    category: 'core' as const
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as const
  });

  const allCourses = getAllCourses();

  // Helper functions for role display
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'นักศึกษา';
      case 'instructor': return 'อาจารย์';
      case 'staff': return 'บุคลากร';
      case 'admin': return 'ผู้ดูแลระบบ';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'instructor': return 'default';
      case 'staff': return 'secondary';
      case 'student': return 'outline';
      default: return 'outline';
    }
  };

  const stats = {
    totalUsers: users.length,
    totalCourses: allCourses.length,
    activeUsers: users.filter(u => u.lastLogin).length,
    activeCourses: allCourses.filter(c => c.isActive).length
  };

  const addCourse = () => {
    if (newCourse.code && newCourse.name) {
      toast({
        title: 'เพิ่มรายวิชาสำเร็จ',
        description: `เพิ่มวิชา ${newCourse.code} - ${newCourse.name} แล้ว`,
      });
      setNewCourse({
        code: '',
        name: '',
        credits: 3,
        description: '',
        category: 'core'
      });
    }
  };

  const changeUserRole = (userId: string, newRole: string) => {
    toast({
      title: 'เปลี่ยนบทบาทสำเร็จ',
      description: `เปลี่ยนบทบาทผู้ใช้เป็น ${newRole} แล้ว`,
    });
  };

  const createUser = async () => {
    if (newUser.name && newUser.email && newUser.role) {
      try {
        const userId = await firebaseService.createUser({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: true
        });
        
        if (userId) {
          toast({
            title: 'สร้างผู้ใช้สำเร็จ',
            description: `สร้างบัญชีผู้ใช้ ${newUser.name} แล้ว`,
          });
          setNewUser({
            name: '',
            email: '',
            role: 'student'
          });
        } else {
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error creating user:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้',
          variant: 'destructive'
        });
      }
    }
  };

  const exportData = () => {
    toast({
      title: 'ส่งออกข้อมูลสำเร็จ',
      description: 'ไฟล์ข้อมูลหลักสูตรถูกส่งออกแล้ว',
    });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 gradient-subtle">
      <div className="container mx-auto space-y-6">
        {/* Welcome Section with User Info */}
        <Card className="shadow-soft border-0 bg-gradient-to-r from-admin/10 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback className="bg-admin text-white text-lg">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  ยินดีต้อนรับ, {user?.name}
                </h1>
                <p className="text-muted-foreground mb-2">แดชบอร์ดผู้ดูแลระบบ - จัดการระบบและผู้ใช้งาน</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>ผู้ดูแลระบบ</span>
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
            <h1 className="text-3xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
            <p className="text-muted-foreground">
              ยินดีต้อนรับ, {user?.name} • ระดับสิทธิ์: Super Admin
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-admin" />
            <div className="text-right">
              <div className="font-medium">ผู้ดูแลระบบ</div>
              <div className="text-sm text-muted-foreground">สิทธิ์การเข้าถึงเต็ม</div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ผู้ใช้ทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{stats?.totalUsers || allUsers.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รายวิชาทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-secondary" />
                <span className="text-2xl font-bold">{stats?.totalCourses || allCourses.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ผู้ใช้ที่ใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-success" />
                <span className="text-2xl font-bold">{stats?.activeUsers || allUsers.filter(u => u.lastLoginAt).length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                วิชาที่เปิดสอน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-warning" />
                <span className="text-2xl font-bold">{stats?.activeCourses || allCourses.filter(c => c.isActive).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
            <TabsTrigger value="courses">จัดการรายวิชา</TabsTrigger>
            <TabsTrigger value="import-export">นำเข้า/ส่งออก</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="settings">ตั้งค่าระบบ</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>จัดการผู้ใช้</span>
                    </CardTitle>
                    <CardDescription>
                      จัดการบัญชีผู้ใช้และบทบาท
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ค้นหาผู้ใช้..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="w-4 h-4 mr-2" />
                          เพิ่มผู้ใช้
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                          <DialogDescription>
                            สร้างบัญชีผู้ใช้ใหม่และกำหนดบทบาท
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-user-name">ชื่อ-นามสกุล</Label>
                              <Input 
                                id="new-user-name" 
                                placeholder="นายสมชาย ใจดี" 
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-user-email">อีเมล</Label>
                              <Input 
                                id="new-user-email" 
                                placeholder="somchai@kmutnb.ac.th" 
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-user-role">บทบาท</Label>
                            <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as any})}>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกบทบาท" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">นักศึกษา</SelectItem>
                                <SelectItem value="instructor">อาจารย์</SelectItem>
                                <SelectItem value="staff">บุคลากร</SelectItem>
                                <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={createUser}>สร้างบัญชี</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((userData) => (
                      <div key={userData.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-soft transition-shadow">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={userData.profilePicture} alt={userData.name} />
                            <AvatarFallback>
                              {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userData.name}</div>
                            <div className="text-sm text-muted-foreground">{userData.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={getRoleBadgeVariant(userData.role)}>
                                {getRoleDisplayName(userData.role)}
                              </Badge>
                              {userData.lastLoginAt && (
                                <span className="text-xs text-muted-foreground">
                                  เข้าสู่ระบบล่าสุด: {new Date(userData.lastLoginAt.seconds * 1000).toLocaleDateString('th-TH')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={userData.role}
                            onValueChange={(newRole) => changeUserRole(userData.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">นักศึกษา</SelectItem>
                              <SelectItem value="instructor">อาจารย์</SelectItem>
                              <SelectItem value="staff">บุคลากร</SelectItem>
                              <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Management */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" />
                      <span>จัดการรายวิชา</span>
                    </CardTitle>
                    <CardDescription>
                      เพิ่ม แก้ไข และจัดการรายวิชา
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        เพิ่มรายวิชา
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>เพิ่มรายวิชาใหม่</DialogTitle>
                        <DialogDescription>
                          สร้างรายวิชาใหม่ในระบบ
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="course-code">รหัสวิชา</Label>
                            <Input 
                              id="course-code" 
                              placeholder="CS101" 
                              value={newCourse.code}
                              onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="course-credits">หน่วยกิต</Label>
                            <Input 
                              id="course-credits" 
                              type="number" 
                              value={newCourse.credits}
                              onChange={(e) => setNewCourse({...newCourse, credits: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-name">ชื่อวิชา</Label>
                          <Input 
                            id="course-name" 
                            placeholder="การเขียนโปรแกรมเบื้องต้น" 
                            value={newCourse.name}
                            onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-category">หมวดหมู่</Label>
                          <Select value={newCourse.category} onValueChange={(value) => setNewCourse({...newCourse, category: value as any})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="core">วิชาแกน</SelectItem>
                              <SelectItem value="general">ศึกษาทั่วไป</SelectItem>
                              <SelectItem value="elective">วิชาเลือก</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-description">คำอธิบายรายวิชา</Label>
                          <Textarea 
                            id="course-description" 
                            placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของรายวิชา"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                          />
                        </div>
                        <Button className="w-full" onClick={addCourse}>เพิ่มรายวิชา</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allCourses.length > 0 ? (
                    allCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-muted-foreground">{course.code}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {course.credits} หน่วยกิต • {course.category === 'core' ? 'วิชาแกน' : course.category === 'general' ? 'ศึกษาทั่วไป' : 'วิชาเลือก'}
                          </div>
                          {course.description && (
                            <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {course.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={course.isActive ? 'default' : 'secondary'}>
                            {course.isActive ? 'เปิดสอน' : 'ปิดสอน'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ยังไม่มีรายวิชาในระบบ</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import/Export */}
          <TabsContent value="import-export" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>นำเข้า/ส่งออกข้อมูล</span>
                </CardTitle>
                <CardDescription>
                  จัดการการนำเข้าและส่งออกข้อมูลระบบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ส่งออกข้อมูล</CardTitle>
                      <CardDescription>
                        ส่งออกข้อมูลระบบทั้งหมดเป็นไฟล์ JSON
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={exportData} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        ส่งออกข้อมูลระบบ
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">นำเข้าข้อมูล</CardTitle>
                      <CardDescription>
                        นำเข้าข้อมูลจากไฟล์ JSON หรือ CSV
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Input type="file" accept=".json,.csv" />
                        <Button className="w-full" variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          นำเข้าข้อมูล
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Audit Log</span>
                </CardTitle>
                <CardDescription>
                  ประวัติการใช้งานและการเปลี่ยนแปลงในระบบ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 20).map((log) => (
                      <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{log.action}</div>
                          <div className="text-sm text-muted-foreground">{log.details}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            โดย: {log.userId} • {new Date(log.timestamp.seconds * 1000).toLocaleString('th-TH')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ยังไม่มีประวัติการใช้งาน</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>ตั้งค่าระบบ</span>
                </CardTitle>
                <CardDescription>
                  จัดการการตั้งค่าระบบและกำหนดค่า
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">การตั้งค่าทั่วไป</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="system-name">ชื่อระบบ</Label>
                        <Input id="system-name" defaultValue="ระบบจัดการหลักสูตร IT" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">อีเมลผู้ดูแลระบบ</Label>
                        <Input id="admin-email" defaultValue="admin@kmutnb.ac.th" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">การตั้งค่าความปลอดภัย</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">การเข้าสู่ระบบด้วย Google</div>
                          <div className="text-sm text-muted-foreground">อนุญาตให้ผู้ใช้เข้าสู่ระบบด้วย Google Account</div>
                        </div>
                        <Button variant="outline">เปิดใช้งาน</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">การยืนยันตัวตนสองขั้นตอน</div>
                          <div className="text-sm text-muted-foreground">บังคับให้ผู้ดูแลระบบใช้ 2FA</div>
                        </div>
                        <Button variant="outline">กำหนดค่า</Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      บันทึกการตั้งค่า
                    </Button>
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

export default AdminDashboard;