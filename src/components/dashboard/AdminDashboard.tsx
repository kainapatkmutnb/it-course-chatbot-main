import React, { useState, useEffect } from 'react';
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
import { useUsers, useCourses, useSystemStats } from '@/hooks/useFirebaseData';
import { getAllCourses, auditLogs } from '@/services/completeCurriculumData';
import { firebaseService, AuditLog } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/auth';
import CourseManagement from './CourseManagement';
import { getCoursesByProgram } from '@/services/courseService';
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
  const { courses: firebaseCourses, loading: coursesLoading, error: coursesError } = useCourses();
  const { stats: systemStats, loading: statsLoading, error: statsError, refreshStats } = useSystemStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 10;
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
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'ระบบจัดการหลักสูตร IT',
    adminEmail: 'admin@kmutnb.ac.th',
    enableGoogleLogin: true,
    enableTwoFactor: false
  });
  const [allCoursesFromBothSources, setAllCoursesFromBothSources] = useState<any[]>([]);
  const [coursesLoading2, setCoursesLoading2] = useState(true);

  // Available programs and curriculum years (same as StaffDashboard)
  const programs = [
    { code: 'IT', name: 'เทคโนโลยีสารสนเทุศ' },
    { code: 'INE', name: 'วิศวกรรมสารสนเทุศและเครือข่าย' },
    { code: 'INET', name: 'เทคโนโลยีสารสนเทุศและเครือข่าย' },
    { code: 'ITI', name: 'เทคโนโลยีสารสนเทุศอุตสาหกรรม' },
    { code: 'ITT', name: 'เทคโนโลยีสารสนเทุศและการสื่อสาร' }
  ];

  const curriculumYears = {
    'IT': ['62 สหกิจ', '67 สหกิจ', '62', '67'],
    'INE': ['62', '67', '62 สหกิจ', '67 สหกิจ'],
    'INET': ['62', '67'],
    'ITI': ['62', '67'],
    'ITT': ['67']
  };

  // Load all courses from both Firebase and completeCurriculumData
  const loadAllCoursesFromBothSources = async () => {
    setCoursesLoading2(true);
    try {
      const allCourses: any[] = [];
      
      // Loop through all programs and curriculum years
      for (const program of programs) {
        const programYears = curriculumYears[program.code as keyof typeof curriculumYears];
        if (programYears) {
          for (const year of programYears) {
            // Get all courses for this program and curriculum year from completeCurriculumData
            const programCourses = getCoursesByProgram(program.code, year);
            
            // Get Firebase courses for all semesters and years
            for (let studyYear = 1; studyYear <= 4; studyYear++) {
              for (let semester = 1; semester <= 3; semester++) {
                try {
                  const firebaseCourses = await firebaseService.getCourses(
                    program.code,
                    year,
                    studyYear,
                    semester
                  );
                  
                  if (firebaseCourses && firebaseCourses.length > 0) {
                    firebaseCourses.forEach(fbCourse => {
                      // Check if course already exists in allCourses
                      const existingIndex = allCourses.findIndex(c => c.code === fbCourse.code);
                      if (existingIndex >= 0) {
                        // Update existing course with Firebase data (Firebase takes precedence)
                        allCourses[existingIndex] = {
                          ...allCourses[existingIndex],
                          ...fbCourse,
                          program: program.code,
                          programName: program.name,
                          curriculumYear: year,
                          source: 'firebase'
                        };
                      } else {
                        // Add new course from Firebase
                        allCourses.push({
                          ...fbCourse,
                          program: program.code,
                          programName: program.name,
                          curriculumYear: year,
                          source: 'firebase'
                        });
                      }
                    });
                  }
                } catch (error) {
                  // Continue if error occurs for specific program/year/semester
                  console.warn(`Error loading courses for ${program.code} ${year} year ${studyYear} semester ${semester}:`, error);
                }
              }
            }
            
            // Add curriculum courses that don't have Firebase overrides
            programCourses.forEach(course => {
              const existingIndex = allCourses.findIndex(c => c.code === course.code);
              if (existingIndex === -1) {
                allCourses.push({
                  ...course,
                  program: program.code,
                  programName: program.name,
                  curriculumYear: year,
                  source: 'curriculum'
                });
              }
            });
          }
        }
      }
      
      setAllCoursesFromBothSources(allCourses);
    } catch (error) {
      console.error('Error loading all courses from both sources:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายวิชาได้",
        variant: "destructive",
      });
    } finally {
      setCoursesLoading2(false);
    }
  };

  // Load courses from both sources on component mount
  useEffect(() => {
    loadAllCoursesFromBothSources();
  }, []);

  const allCourses = firebaseCourses || [];
  const stats = systemStats;

  // Calculate combined statistics
  const combinedStats = {
    totalCourses: allCoursesFromBothSources.length,
    activeCourses: allCoursesFromBothSources.filter(c => c.isActive !== false).length
  };

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

  const importData = async () => {
    if (!importFile) {
      toast({
        title: 'กรุณาเลือกไฟล์',
        description: 'กรุณาเลือกไฟล์ JSON หรือ CSV ที่ต้องการนำเข้า',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const fileExtension = importFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== 'json' && fileExtension !== 'csv') {
        toast({
          title: 'รูปแบบไฟล์ไม่ถูกต้อง',
          description: 'กรุณาเลือกไฟล์ JSON หรือ CSV เท่านั้น',
          variant: 'destructive',
        });
        return;
      }

      const fileContent = await importFile.text();
      let importedData: any;

      if (fileExtension === 'json') {
        try {
          importedData = JSON.parse(fileContent);
        } catch (error) {
          toast({
            title: 'ไฟล์ JSON ไม่ถูกต้อง',
            description: 'ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบรูปแบบไฟล์',
            variant: 'destructive',
          });
          return;
        }
      } else if (fileExtension === 'csv') {
        // สำหรับ CSV ให้แปลงเป็น JSON format
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            data.push(obj);
          }
        }
        
        importedData = { users: data }; // สมมติว่า CSV เป็นข้อมูลผู้ใช้
      }

      // ตรวจสอบโครงสร้างข้อมูล
      if (!importedData || typeof importedData !== 'object') {
        toast({
          title: 'โครงสร้างข้อมูลไม่ถูกต้อง',
          description: 'ไฟล์ที่นำเข้าต้องมีโครงสร้างข้อมูลที่ถูกต้อง',
          variant: 'destructive',
        });
        return;
      }

      let importCount = 0;
      let errorCount = 0;

      // นำเข้าข้อมูลผู้ใช้
      if (importedData.users && Array.isArray(importedData.users)) {
        for (const userData of importedData.users) {
          try {
            if (userData.name && userData.email && userData.role) {
              await firebaseService.createUser({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                department: userData.department || '',
                studentId: userData.studentId || '',
                isActive: userData.isActive !== false
              });
              importCount++;
            }
          } catch (error) {
            console.error('Error importing user:', error);
            errorCount++;
          }
        }
      }

      // นำเข้าข้อมูลรายวิชา
      if (importedData.courses && Array.isArray(importedData.courses)) {
        for (const courseData of importedData.courses) {
          try {
            if (courseData.code && courseData.name) {
              await firebaseService.addCourse(
                courseData.program || 'default',
                courseData.curriculumYear || '2567',
                courseData.year || 1,
                courseData.semester || 1,
                {
                  id: courseData.id || courseData.code,
                  code: courseData.code,
                  name: courseData.name,
                  credits: courseData.credits || 3,
                  description: courseData.description || '',
                  category: courseData.category || 'core',
                  mainCategory: courseData.mainCategory || '',
                  subCategory: courseData.subCategory || '',
                  prerequisites: courseData.prerequisites || [],
                  corequisites: courseData.corequisites || [],
                  isActive: courseData.isActive !== false,
                  instructor: courseData.instructor || '',
                  maxStudents: courseData.maxStudents || 0,
                  currentStudents: courseData.currentStudents || 0
                }
              );
              importCount++;
            }
          } catch (error) {
            console.error('Error importing course:', error);
            errorCount++;
          }
        }
      }

      // นำเข้าข้อมูลแผนการเรียน
      if (importedData.studyPlans && Array.isArray(importedData.studyPlans)) {
        for (const studyPlanData of importedData.studyPlans) {
          try {
            if (studyPlanData.studentId && studyPlanData.curriculum) {
              await firebaseService.createStudyPlan({
                studentId: studyPlanData.studentId,
                curriculum: studyPlanData.curriculum,
                totalCredits: studyPlanData.totalCredits || 0,
                completedCredits: studyPlanData.completedCredits || 0,
                gpa: studyPlanData.gpa || 0,
                courses: studyPlanData.courses || []
              });
              importCount++;
            }
          } catch (error) {
            console.error('Error importing study plan:', error);
            errorCount++;
          }
        }
      }

      // แสดงผลลัพธ์
      if (importCount > 0) {
        toast({
          title: 'นำเข้าข้อมูลสำเร็จ',
          description: `นำเข้าข้อมูลสำเร็จ ${importCount} รายการ${errorCount > 0 ? ` (ข้อผิดพลาด ${errorCount} รายการ)` : ''}`,
        });

        // เพิ่ม audit log
        if (user) {
          await firebaseService.createAuditLog({
            action: 'นำเข้าข้อมูลระบบ',
            details: `นำเข้าข้อมูลจากไฟล์ ${importFile.name} สำเร็จ ${importCount} รายการ${errorCount > 0 ? ` (ข้อผิดพลาด ${errorCount} รายการ)` : ''}`,
            userId: user.id,
            ipAddress: 'localhost',
            category: 'system'
          });
        }

        // รีเซ็ตไฟล์
        setImportFile(null);
        
        // รีเฟรชหน้า (อาจจะต้องเพิ่ม refresh functions)
        window.location.reload();
      } else {
        toast({
          title: 'ไม่พบข้อมูลที่สามารถนำเข้าได้',
          description: 'กรุณาตรวจสอบรูปแบบข้อมูลในไฟล์',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถนำเข้าข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
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

  const localStats = {
    totalUsers: allUsers?.length || 0,
    totalCourses: allCourses.length,
    activeUsers: allUsers?.filter(u => u.isActive !== false).length || 0,
    activeCourses: allCourses.filter(c => c.isActive !== false).length
  };

  // Save system settings to Firebase
  const saveSystemSettings = async () => {
    try {
      setIsLoading(true);
      
      // Create audit log
      if (user) {
        await firebaseService.createAuditLog({
          action: 'อัปเดตการตั้งค่าระบบ',
          details: `อัปเดตการตั้งค่าระบบ: ชื่อระบบ="${systemSettings.systemName}", อีเมลผู้ดูแล="${systemSettings.adminEmail}", Google Login=${systemSettings.enableGoogleLogin}, 2FA=${systemSettings.enableTwoFactor}`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'system'
        });
      }
      
      toast({
        title: 'บันทึกการตั้งค่าสำเร็จ',
        description: 'การตั้งค่าระบบได้รับการอัปเดตแล้ว',
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการตั้งค่าได้',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
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

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // ตรวจสอบสิทธิ์ admin
      if (user?.role !== 'admin') {
        toast({
          title: 'ไม่มีสิทธิ์เข้าถึง',
          description: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนบทบาทผู้ใช้ได้',
          variant: 'destructive'
        });
        return;
      }

      if (!user?.id) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่พบข้อมูลผู้ใช้ที่ทำการเปลี่ยนแปลง',
          variant: 'destructive'
        });
        return;
      }

      // ป้องกันการเปลี่ยน role ของตัวเอง
      if (userId === user.id) {
        toast({
          title: 'ไม่สามารถดำเนินการได้',
          description: 'ไม่สามารถเปลี่ยนบทบาทของตัวเองได้',
          variant: 'destructive'
        });
        return;
      }

      const success = await firebaseService.updateUserRole(userId, newRole, user.id);
      if (success) {
        toast({
          title: 'เปลี่ยนบทบาทสำเร็จ',
          description: `เปลี่ยนบทบาทผู้ใช้เป็น ${getRoleDisplayName(newRole)} แล้ว`,
        });
        // Refresh users data would be handled by the useUsers hook
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้',
        variant: 'destructive'
      });
    }
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
          // Add audit log for user creation
          if (user) {
            await firebaseService.createAuditLog({
              action: 'เพิ่มผู้ใช้',
              details: `เพิ่มผู้ใช้ใหม่ ${newUser.name} (${newUser.email}) บทบาท: ${newUser.role}`,
              userId: user.id,
              ipAddress: 'localhost',
              category: 'user'
            });
          }

          toast({
            title: 'สร้างผู้ใช้สำเร็จ',
            description: `สร้างบัญชีผู้ใช้ ${newUser.name} แล้ว`,
          });
          setNewUser({
            name: '',
            email: '',
            role: 'student'
          });

          // Auto refresh page after successful user creation
          setTimeout(() => {
            window.location.reload();
          }, 1500);
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

  const exportData = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูลทั้งหมดจาก Firebase
      const [users, courses, studyPlans, auditLogs, departments] = await Promise.all([
         firebaseService.getUsers(),
         firebaseService.getCourses(),
         firebaseService.getStudyPlans(),
         firebaseService.getAuditLogs(1000), // ดึง audit logs 1000 รายการล่าสุด
         firebaseService.getDepartments()
       ]);

      // รวมข้อมูลทั้งหมด
      const exportedData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          description: 'ข้อมูลระบบทั้งหมดจาก IT Course Chatbot System'
        },
        users: users,
        courses: courses,
        studyPlans: studyPlans,
        auditLogs: auditLogs.logs,
        departments: departments,
        statistics: {
          totalUsers: users.length,
          totalCourses: courses.length,
          totalStudyPlans: Array.isArray(studyPlans) ? studyPlans.length : 0,
          totalAuditLogs: auditLogs.totalCount,
          totalDepartments: departments.length
        }
      };

      // สร้างไฟล์ JSON และดาวน์โหลด
      const dataStr = JSON.stringify(exportedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'ส่งออกข้อมูลสำเร็จ',
        description: `ส่งออกข้อมูลทั้งหมด ${users.length} ผู้ใช้, ${courses.length} รายวิชา, ${Array.isArray(studyPlans) ? studyPlans.length : 0} แผนการเรียน และข้อมูลอื่นๆ เรียบร้อยแล้ว`,
      });

      // เพิ่ม audit log
      if (user) {
        await firebaseService.createAuditLog({
          action: 'ส่งออกข้อมูลระบบ',
          details: `ส่งออกข้อมูลระบบทั้งหมด รวม ${users.length} ผู้ใช้, ${courses.length} รายวิชา, ${Array.isArray(studyPlans) ? studyPlans.length : 0} แผนการเรียน`,
          userId: user.id,
          ipAddress: 'localhost',
          category: 'system'
        });
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userData: any) => {
    setEditingUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (editingUser && editingUser.name && editingUser.email && editingUser.role) {
      try {
        const success = await firebaseService.updateUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        });
        
        if (success) {
          toast({
            title: 'อัปเดตผู้ใช้สำเร็จ',
            description: `อัปเดตข้อมูลผู้ใช้ ${editingUser.name} แล้ว`,
          });
          setIsEditDialogOpen(false);
          setEditingUser(null);
        } else {
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeleteUser = (userData: any) => {
    setUserToDelete(userData);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const success = await firebaseService.deleteUser(userToDelete.id);
        if (success) {
          // Add audit log for user deletion
          if (user) {
            await firebaseService.createAuditLog({
              action: 'ลบผู้ใช้',
              details: `ลบผู้ใช้ ${userToDelete.name} (${userToDelete.email}) บทบาท: ${userToDelete.role}`,
              userId: user.id,
              ipAddress: 'localhost',
              category: 'user'
            });
          }

          toast({
            title: 'ลบผู้ใช้สำเร็จ',
            description: `ลบบัญชีผู้ใช้ ${userToDelete.name} แล้ว`,
          });
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);

          // Auto refresh page after successful user deletion
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถลบบัญชีผู้ใช้ได้',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถลบบัญชีผู้ใช้ได้',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredUsers = allUsers?.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Load audit logs from Firebase
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setAuditLogsLoading(true);
        const result = await firebaseService.getAuditLogs(logsPerPage, currentPage);
        setAuditLogs(result.logs);
        setTotalPages(result.totalPages);
        setTotalLogs(result.totalCount);
      } catch (error) {
        console.error('Error loading audit logs:', error);
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูล Audit Log ได้",
          variant: "destructive",
        });
      } finally {
        setAuditLogsLoading(false);
      }
    };

    loadAuditLogs();
  }, [toast, currentPage, logsPerPage]);

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
                <span className="text-2xl font-bold">{localStats?.totalUsers}</span>
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
                <span className="text-2xl font-bold">{combinedStats.totalCourses}</span>
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
                <span className="text-2xl font-bold">{localStats?.activeUsers}</span>
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
                <span className="text-2xl font-bold">{combinedStats.activeCourses}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
            <TabsTrigger value="courses">จัดการรายวิชา</TabsTrigger>
            <TabsTrigger value="import-export">นำเข้า/ส่งออก</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            {/* <TabsTrigger value="settings">ตั้งค่าระบบ</TabsTrigger> */}
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
                      จัดการบัญชีผู้ใช้แะบทบาท
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
                  {usersLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้...</div>
                    </div>
                  ) : usersError ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-destructive">เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้</div>
                    </div>
                  ) : filteredUsers.length > 0 ? (
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
                              {userData.lastLogin && (
                                <span className="text-xs text-muted-foreground">
                                  เข้าสู่ระบบล่าสุด: {userData.lastLogin instanceof Date 
                                    ? userData.lastLogin.toLocaleDateString('th-TH')
                                    : new Date((userData.lastLogin as any).seconds * 1000).toLocaleDateString('th-TH')
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={userData.role}
                            onValueChange={(newRole) => changeUserRole(userData.id, newRole as UserRole)}
                            disabled={userData.id === user?.id || user?.role !== 'admin'}
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditUser(userData)}
                            disabled={user?.role !== 'admin'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(userData)} 
                            className="text-destructive hover:text-destructive"
                            disabled={userData.id === user?.id || user?.role !== 'admin'}
                          >
                            <Trash2 className="w-4 h-4" />
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      แสดง {((currentPage - 1) * logsPerPage) + 1}-{Math.min(currentPage * logsPerPage, totalLogs)} จาก {totalLogs} รายการ
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        หน้าแรก
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        หน้า {currentPage} จาก {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        ถัดไป
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        หน้าสุดท้าย
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Management */}
          <TabsContent value="courses" className="space-y-6">
            <CourseManagement />
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
                        <Input 
                          type="file" 
                          accept=".json,.csv" 
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                        {importFile && (
                          <p className="text-sm text-gray-600">
                            ไฟล์ที่เลือก: {importFile.name}
                          </p>
                        )}
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={importData}
                          disabled={isLoading || !importFile}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                              กำลังนำเข้า...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              นำเข้าข้อมูล
                            </>
                          )}
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
                  {auditLogsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">กำลังโหลดข้อมูล Audit Log...</div>
                    </div>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => {
                      // Safely convert details to string if it's an object
                      const detailsText = typeof log.details === 'object' 
                        ? JSON.stringify(log.details) 
                        : String(log.details || '');
                      
                      // Safely convert other fields to strings
                      const userIdText = typeof log.userId === 'object' 
                        ? JSON.stringify(log.userId) 
                        : String(log.userId || '');
                      
                      const categoryText = typeof log.category === 'object' 
                        ? JSON.stringify(log.category) 
                        : String(log.category || '');
                      
                      const ipAddressText = typeof log.ipAddress === 'object' 
                        ? JSON.stringify(log.ipAddress) 
                        : String(log.ipAddress || '');

                      return (
                        <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                          <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium">{String(log.action || '')}</div>
                            <div className="text-sm text-muted-foreground">{detailsText}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              โดย: {userIdText} • {log.timestamp?.toLocaleString?.('th-TH') || String(log.timestamp)} • IP: {ipAddressText}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              หมวดหมู่: {categoryText}
                            </div>
                          </div>
                        </div>
                      );
                    })
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

          {/* System Settings - Commented out */}
          {/* 
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
                        <Input 
                          id="system-name" 
                          value={systemSettings.systemName}
                          onChange={(e) => setSystemSettings({...systemSettings, systemName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">อีเมลผู้ดูแลระบบ</Label>
                        <Input 
                          id="admin-email" 
                          value={systemSettings.adminEmail}
                          onChange={(e) => setSystemSettings({...systemSettings, adminEmail: e.target.value})}
                        />
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
                        <Button 
                          variant={systemSettings.enableGoogleLogin ? "default" : "outline"}
                          onClick={() => setSystemSettings({...systemSettings, enableGoogleLogin: !systemSettings.enableGoogleLogin})}
                        >
                          {systemSettings.enableGoogleLogin ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">การยืนยันตัวตนสองขั้นตอน</div>
                          <div className="text-sm text-muted-foreground">บังคับให้ผู้ดูแลระบบใช้ 2FA</div>
                        </div>
                        <Button 
                          variant={systemSettings.enableTwoFactor ? "default" : "outline"}
                          onClick={() => setSystemSettings({...systemSettings, enableTwoFactor: !systemSettings.enableTwoFactor})}
                        >
                          {systemSettings.enableTwoFactor ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={saveSystemSettings} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          */
        </Tabs>

         {/* Edit User Dialog */}
         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
               <DialogDescription>
                 อัปเดตข้อมูลผู้ใช้และบทบาท
               </DialogDescription>
             </DialogHeader>
             {editingUser && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="edit-user-name">ชื่อ-นามสกุล</Label>
                     <Input 
                       id="edit-user-name" 
                       value={editingUser.name}
                       onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="edit-user-email">อีเมล</Label>
                     <Input 
                       id="edit-user-email" 
                       value={editingUser.email}
                       onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="edit-user-role">บทบาท</Label>
                   <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
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
                 <div className="flex space-x-2">
                   <Button className="flex-1" onClick={handleUpdateUser}>อัปเดตข้อมูล</Button>
                   <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ยกเลิก</Button>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>

         {/* Delete User Confirmation Dialog */}
         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
               <DialogDescription>
                 คุณแน่ใจหรือไม่ที่จะลบบัญชีผู้ใช้นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
               </DialogDescription>
             </DialogHeader>
             {userToDelete && (
               <div className="space-y-4">
                 <div className="p-4 bg-muted rounded-lg">
                   <div className="flex items-center space-x-3">
                     <Avatar className="h-10 w-10">
                       <AvatarImage src={userToDelete.profilePicture} alt={userToDelete.name} />
                       <AvatarFallback>
                         {userToDelete.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                     <div>
                       <div className="font-medium">{userToDelete.name}</div>
                       <div className="text-sm text-muted-foreground">{userToDelete.email}</div>
                       <Badge variant={getRoleBadgeVariant(userToDelete.role)} className="mt-1">
                         {getRoleDisplayName(userToDelete.role)}
                       </Badge>
                     </div>
                   </div>
                 </div>
                 <div className="flex space-x-2">
                   <Button variant="destructive" className="flex-1" onClick={confirmDeleteUser}>
                     <Trash2 className="w-4 h-4 mr-2" />
                     ลบผู้ใช้
                   </Button>
                   <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ยกเลิก</Button>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>

       </div>
     </div>
   );
 };
 
 export default AdminDashboard;