import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HomeOverview from '@/components/home/HomeOverview';

import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Shield,
  Sparkles,
  ArrowRight,
  UserCheck,
  Target
} from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log('Home component state:', { isAuthenticated, user: user?.role, isLoading });
  }, [isAuthenticated, user, isLoading]);

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Chatbot',
      description: 'แชทบอทอัจฉริยะตอบคำถามเรื่องหลักสูตรและการเรียนอย่างตรงจุด'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'จัดการหลักสูตร',
      description: 'ระบบจัดการรายวิชาและหลักสูตรแบบครบวงจร 5 สาขาวิชา 13 หลักสูตร'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'วางแผนการเรียน',
      description: 'วางแผนและติดตามความก้าวหน้าการเรียน 4 ปี พร้อมคำนวณหน่วยกิตและ GPA'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'ระบบสิทธิ์การใช้งาน',
      description: 'การจัดการสิทธิ์การเข้าถึงแยกตามบทบาท นักศึกษา อาจารย์ บุคลากร และผู้ดูแล'
    }
  ];

  const roles = [
    {
      role: 'student',
      icon: <GraduationCap className="w-6 h-6" />,
      title: 'นักศึกษา',
      description: 'ดูแผนการเรียน ตรวจสอบผลการเรียน และวางแผนการลงทะเบียนล่วงหน้า',
      features: ['ดูแผนการเรียน 4 ปี', 'ตรวจสอบเงื่อนไขวิชาบังคับก่อน', 'ส่งออกรายงาน PDF / Excel']
    },
    {
      role: 'instructor',
      icon: <UserCheck className="w-6 h-6" />,
      title: 'อาจารย์ที่ปรึกษา',
      description: 'ติดตามและให้คำปรึกษาแผนการเรียนของนักศึกษาในความดูแล',
      features: ['ดูรายชื่อนักศึกษาในความดูแล', 'ตรวจสอบผลการเรียนรายบุคคล', 'สถิติการเรียนและคำแนะนำ']
    },
    {
      role: 'staff',
      icon: <Users className="w-6 h-6" />,
      title: 'บุคลากรภาควิชา',
      description: 'จัดการเงื่อนไขรายวิชา โครงสร้างหลักสูตร และความต่อเนื่องทางการศึกษา',
      features: ['ตั้งค่าเงื่อนไขวิชา', 'จัดการ Prerequisite & Corequisite', 'อัปเดตข้อมูลหลักสูตร']
    },
    {
      role: 'admin',
      icon: <Shield className="w-6 h-6" />,
      title: 'ผู้ดูแลระบบ',
      description: 'จัดการระบบทั้งหมด บัญชีผู้ใช้ การกำหนดสิทธิ์ และตรวจสอบสถิติแชทบอท',
      features: ['จัดการผู้ใช้งานและสิทธิ์', 'จัดการฐานข้อมูลหลักสูตร', 'Chat Analytics Dashboard']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="academic-home-hero border-b border-border">
        <div className="container mx-auto">
          <div className="grid items-center gap-8 lg:grid-cols-[5fr_7fr] lg:gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="font-medium text-xs px-3 py-1">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  ระบบแนะนำและวางแผนหลักสูตร
                </Badge>
                <h1 className="academic-hero-title font-bold tracking-tight">
                  IT Assistant
                  <span className="academic-hero-subtitle block font-normal">
                    Professional IT Guidance · KMUTNB
                  </span>
                </h1>
                <p className="academic-copy font-normal">
                  ระบบให้คำปรึกษาหลักสูตรเทคโนโลยีสารสนเทศแบบครบวงจร
                  ด้วยเทคโนโลยี AI เพื่อการวางแผนการเรียนที่มีประสิทธิภาพ ตรวจสอบเงื่อนไขหน่วยกิตและหลักสูตรได้ทันที
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Button size="lg" asChild className="academic-control">
                      <Link to="/register">
                        เริ่มใช้งาน
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="academic-control">
                      <Link to="/login">เข้าสู่ระบบ</Link>
                    </Button>
                  </>
                ) : (
                  <Button size="lg" asChild className="academic-control">
                    <Link to={`/dashboard/${user?.role}`}>
                      ไปยังแดชบอร์ด
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>

              {isAuthenticated && (
                <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted p-3 text-foreground">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {(user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">ยินดีต้อนรับ {user?.name}</p>
                    <p className="text-xs text-muted-foreground">บทบาท: {user?.role}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image / Authentic Screenshot */}
            <div className="flex justify-center">
              <HomeOverview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="academic-home-section">
        <div className="container mx-auto">
          <div className="mb-8 text-left">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
              ฟีเจอร์หลักของระบบ
            </h2>
            <p className="academic-copy">
              ระบบครบครันสำหรับการจัดการหลักสูตรและการวางแผนการเรียนการสอนภาควิชาเทคโนโลยีสารสนเทศ
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="academic-feature academic-panel p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg font-bold mb-1.5">{feature.title}</CardTitle>
                <CardDescription className="academic-copy text-sm">
                  {feature.description}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="academic-home-section border-t border-border">
        <div className="container mx-auto">
          <div className="mb-8 text-left">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
              บทบาทผู้ใช้งานในระบบ
            </h2>
            <p className="academic-copy">
              ระบบรองรับผู้ใช้งานตามโครงสร้างจริงของภาควิชา ด้วยสิทธิ์การเข้าถึงข้อมูลที่เหมาะสม
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((roleData) => (
              <Card key={roleData.role} className="academic-panel p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      {roleData.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{roleData.title}</CardTitle>
                      <CardDescription className="text-sm">{roleData.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">ฟีเจอร์เฉพาะบทบาท:</h4>
                    <ul className="space-y-1.5">
                      {roleData.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-foreground/90">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="academic-home-cta">
        <div className="container mx-auto text-left">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
            </h2>
            <p className="academic-copy">
              เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มต้นสำรวจหลักสูตรและจัดทำแผนการเรียนของตนเอง
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button size="lg" asChild className="academic-control">
                  <Link to="/register">
                    สมัครสมาชิก
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="academic-control">
                  <Link to="/courses">สืบค้นหลักสูตร</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;