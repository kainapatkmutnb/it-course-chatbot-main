import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  LogOut, 
  GraduationCap,
  UserCheck,
  Users,
  Shield
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'instructor': return <UserCheck className="w-4 h-4" />;
      case 'staff': return <Users className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'student': return 'role-student';
      case 'instructor': return 'role-instructor';
      case 'staff': return 'role-staff';
      case 'admin': return 'role-admin';
      default: return '';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'นักศึกษา';
      case 'instructor': return 'อาจารย์';
      case 'staff': return 'บุคลากร';
      case 'admin': return 'ผู้ดูแลระบบ';
      default: return 'ผู้เยี่ยมชม';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-soft">
      <div className="container mx-auto px-6 flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="p-2.5 gradient-primary rounded-xl shadow-elegant">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              IT Assistant
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Professional IT Guidance
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2 px-1 border-b-2 border-transparent hover:border-primary/30"
          >
            หน้าหลัก
          </Link>
          <Link 
            to="/courses" 
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2 px-1 border-b-2 border-transparent hover:border-primary/30"
          >
            หลักสูตร
          </Link>
          {isAuthenticated && (
            <Link 
              to={`/dashboard/${user?.role}`} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2 px-1 border-b-2 border-transparent hover:border-primary/30"
            >
              แดชบอร์ด
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {(user.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleBadgeClass(user.role)}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{getRoleDisplayName(user.role)}</span>
                      </Badge>
                      {user.studentId && (
                        <Badge variant="outline">{user.studentId}</Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Note: Role switching removed - roles are now determined by email domain */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  บทบาทถูกกำหนดโดยอีเมลของคุณ
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild className="text-sm font-medium">
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button asChild className="gradient-primary shadow-elegant text-sm font-medium">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;