import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/types/auth';
import { 
  Bot, 
  AlertCircle,
  Chrome,
  Mail,
  Lock,
  User,
  IdCard,
  Loader2
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, register, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    studentId: '',
    employeeId: '',
    department: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  // Determine if user is likely a student based on email
  const isStudentEmail = formData.email.includes('@email.kmutnb.ac.th');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">IT Course Chatbot</h1>
          <p className="text-gray-600 mt-2">ระบบแนะนำหลักสูตรและวางแผนการเรียน</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">สมัครสมาชิก</CardTitle>
            <CardDescription className="text-center">
              สมัครสมาชิกด้วยบัญชี Google ของมหาวิทยาลัย
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign-up Button */}
            <Button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
              variant="outline"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกด้วย Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@kmutnb.ac.th"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="ชื่อ นามสกุล"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Student ID field for student emails */}
              {isStudentEmail && (
                <div className="space-y-2">
                  <Label htmlFor="studentId">รหัสนักศึกษา</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="รหัสนักศึกษา 13 หลัก"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}





              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  'สมัครสมาชิก'
                )}
              </Button>
            </form>

            {/* Domain Info */}
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">สำหรับบุคลากรและนักศึกษา KMUTNB เท่านั้น</p>
              <p>ใช้อีเมล @kmutnb.ac.th หรือ @email.kmutnb.ac.th</p>
            </div>

            {/* Registration Info */}
            {/* <div className="text-center text-xs text-gray-500 space-y-2">
              <p className="font-medium">การสมัครสมาชิกจะทำการ:</p>
              <ul className="text-left space-y-1 bg-gray-50 p-3 rounded-lg">
                <li>• สร้างโปรไฟล์ผู้ใช้อัตโนมัติ</li>
                <li>• กำหนดบทบาทตามอีเมล</li>
                <li>• เข้าสู่ระบบทันที</li>
                <li>• เริ่มใช้งานระบบได้ทันที</li>
              </ul>
            </div> */}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;