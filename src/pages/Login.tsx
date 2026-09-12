import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  LogIn,
  AlertCircle,
  Chrome,
  Mail,
  Lock,
  Loader2
} from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Auto-dismiss error alert after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      // Navigate to dashboard without specific role, let RoleBasedRoute handle the redirect
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    
    try {
      await loginWithGoogle();
      // Navigate to dashboard without specific role, let RoleBasedRoute handle the redirect
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="academic-auth min-h-[calc(100vh-14rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">IT Course Chatbot</h1>
          <p className="text-sm text-muted-foreground mt-1">ระบบแนะนำหลักสูตรและวางแผนการเรียน</p>
        </div>

        {/* Login Card */}
        <Card className="academic-panel">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center text-xs">
              ระบบวางแผนการเรียน มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign-in Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full academic-control bg-background hover:bg-muted text-foreground border border-input shadow-none"
              variant="outline"
            >
              <Chrome className="w-5 h-5 mr-3 text-primary" />
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@kmutnb.ac.th"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="academic-control pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="academic-control pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full academic-control" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            {/* Domain Info */}
            <div className="text-center text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
              <p className="font-medium text-foreground">สำหรับบุคลากรและนักศึกษา KMUTNB เท่านั้น</p>
              <p className="mt-0.5">ใช้อีเมล @kmutnb.ac.th หรือ @email.kmutnb.ac.th</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;