import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Shield,
  Sparkles,
  ArrowRight,
  MessageCircle,
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

  // Only redirect if user came from login/register, not from navigation
  // Remove automatic redirect to allow users to visit home page when logged in

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'AI Chatbot',
      description: 'แชทบอทอัจฉริยะตอบคำถามเรื่องหลักสูตรและการเรียน',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'จัดการหลักสูตร',
      description: 'ระบบจัดการรายวิชาและหลักสูตรแบบครบวงจร',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'วางแผนการเรียน',
      description: 'วางแผนและติดตามความก้าวหน้าการเรียนของคุณ',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'ระบบสิทธิ์',
      description: 'การจัดการสิทธิ์การเข้าถึงตามบทบาทผู้ใช้',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  const roles = [
    {
      role: 'student',
      icon: <GraduationCap className="w-6 h-6" />,
      title: 'นักศึกษา',
      description: 'ดูแผนการเรียน ตรวจสอบผลการเรียน วางแผนการลงทะเบียน',
      features: ['ดูแผนการเรียน', 'ตรวจสอบเงื่อนไขวิชา', 'วางแผนการลงทะเบียน']
    },
    {
      role: 'instructor',
      icon: <UserCheck className="w-6 h-6" />,
      title: 'อาจารย์',
      description: 'ดูข้อมูลนักศึกษา ติดตามความก้าวหน้าการเรียน',
      features: ['ดูรายชื่อนักศึกษา', 'ติดตามผลการเรียน', 'สถิติการเรียน']
    },
    {
      role: 'staff',
      icon: <Users className="w-6 h-6" />,
      title: 'บุคลากร',
      description: 'จัดการเงื่อนไขรายวิชาและความต่อเนื่องของหลักสูตร',
      features: ['ตั้งค่าเงื่อนไขวิชา', 'จัดการ Prerequisite', 'อัปเดตหลักสูตร']
    },
    {
      role: 'admin',
      icon: <Shield className="w-6 h-6" />,
      title: 'ผู้ดูแลระบบ',
      description: 'จัดการระบบทั้งหมด ผู้ใช้ หลักสูตร และการตั้งค่า',
      features: ['จัดการผู้ใช้', 'จัดการหลักสูตร', 'Audit Log', 'การตั้งค่าระบบ']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  <Sparkles className="w-4 h-4 mr-1" />
                  ระบบแนะนำหลักสูตร
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                  IT Assistant
                  <span className="block text-primary-light">
                    Professional IT Guidance
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed font-light">
                  ระบบให้คำปรึกษาหลักสูตรเทคโนโลยีสารสนเทศแบบครบวงจร 
                  ด้วยเทคโนโลยี AI ที่ทันสมัย เพื่อการวางแผนการเรียนที่มีประสิทธิภาพ
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                      <Link to="/register">
                        เริ่มใช้งาน
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                    <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                      <Link to="/login">เข้าสู่ระบบ</Link>
                    </Button>
                  </>
                ) : (
                  <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                    <Link to={`/dashboard/${user?.role}`}>
                      ไปยังแดชบอร์ด
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>

              {isAuthenticated && (
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">ยินดีต้อนรับ {user?.name}</p>
                    <p className="text-sm text-white/70">บทบาท: {user?.role}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image/Illustration */}
            <div className="lg:ml-8 flex justify-center">
              <div className="relative">
                <div className="w-96 h-96 gradient-primary rounded-2xl shadow-elegant flex items-center justify-center">
                  <div className="text-center text-white">
                    <Bot className="w-24 h-24 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium opacity-90">AI-Powered Assistance</p>
                    <p className="text-sm opacity-70">Available 24/7</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-xl shadow-medium flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              ฟีเจอร์หลักของระบบ
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ระบบครบครันสำหรับการจัดการหลักสูตรและการเรียนการสอน
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="text-center hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <div className={feature.color}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              บทบาทผู้ใช้งาน
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ระบบรองรับผู้ใช้หลากหลายบทบาทด้วยสิทธิ์การเข้าถึงที่เหมาะสม
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {roles.map((roleData, index) => (
              <Card key={roleData.role} className="hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 gradient-primary rounded-lg text-white">
                      {roleData.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{roleData.title}</CardTitle>
                      <CardDescription>{roleData.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">ฟีเจอร์เฉพาะ:</h4>
                    <ul className="space-y-1">
                      {roleData.features.map((feature, featureIndex) => (
                        <li key={feature} className="flex items-center text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
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
      <section className="py-20 px-4 gradient-primary text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">
              พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
            </h2>
            <p className="text-xl text-white/90">
              เข้าร่วมกับเราวันนี้และสัมผัสประสบการณ์การเรียนรู้ที่ดีขึ้น
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                  <Link to="/register">
                    สมัครสมาชิกฟรี
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                  <Link to="/courses">ดูหลักสูตร</Link>
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