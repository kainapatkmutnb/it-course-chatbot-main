import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Bot, 
  LogOut, 
  GraduationCap,
  UserCheck,
  Users,
  Shield,
  Menu,
  User,
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { to: '/', label: 'หน้าหลัก' },
    { to: '/courses', label: 'หลักสูตร' },
    ...(isAuthenticated && user
      ? [{ to: `/dashboard/${user.role}`, label: 'แดชบอร์ด' }]
      : []),
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const closeMenuOnDesktop = () => {
      if (desktopQuery.matches) setMobileMenuOpen(false);
    };

    desktopQuery.addEventListener('change', closeMenuOnDesktop);
    window.addEventListener('resize', closeMenuOnDesktop);
    return () => {
      desktopQuery.removeEventListener('change', closeMenuOnDesktop);
      window.removeEventListener('resize', closeMenuOnDesktop);
    };
  }, []);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-soft print:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:px-6">
        {/* Logo and Brand */}
        <Link to="/" className="flex min-w-0 items-center gap-2 hover:opacity-80 transition-opacity sm:gap-3">
          <div className="shrink-0 rounded-xl p-2 sm:p-2.5 gradient-primary shadow-elegant">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-xl">
              IT Assistant
            </span>
            <span className="hidden text-xs font-medium text-muted-foreground lg:block">
              Professional IT Guidance
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-4 md:flex lg:gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-sm border-b-2 px-1 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground/80 hover:border-primary/30 hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
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
              <DropdownMenuContent className="w-80 max-w-[calc(100vw-2rem)]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="break-words text-sm font-medium leading-snug">{user.name}</p>
                    <p className="break-all text-xs leading-snug text-muted-foreground">{user.email}</p>
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
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild className="text-sm font-medium">
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button asChild className="gradient-primary shadow-elegant text-sm font-medium">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 md:hidden"
                aria-label="เปิดเมนูหลัก"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,100vw)] overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle>เมนูหลัก</SheetTitle>
                <SheetDescription>เลือกหน้าที่ต้องการใช้งาน</SheetDescription>
              </SheetHeader>

              {isAuthenticated && user && (
                <div className="mt-6 flex min-w-0 items-center gap-3 border-b pb-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {(user.name || '').split(' ').map((namePart) => namePart[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{user.name}</p>
                    <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {getRoleIcon(user.role)}
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                </div>
              )}

              <nav aria-label="เมนูหลักบนมือถือ" className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center rounded-lg px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 grid gap-3 border-t pt-4">
                {isAuthenticated && user ? (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="min-h-11">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>เข้าสู่ระบบ</Link>
                    </Button>
                    <Button asChild className="min-h-11">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>สมัครสมาชิก</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
