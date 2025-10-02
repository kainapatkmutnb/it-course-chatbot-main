import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  ref,
  get,
  set,
  update,
  push,
  child
} from 'firebase/database';
import { User, AuthContextType, RegisterData, getRoleFromEmail } from '@/types/auth';
import { auth, googleProvider, db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user exists in Realtime Database
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            // User exists, get their data
            const userData = userSnapshot.val() as User;
            setUser(userData);
            
            // Update last login
            await update(userRef, {
              lastLoginAt: new Date().toISOString()
            });
          } else {
            // New user, create profile
            const role = getRoleFromEmail(firebaseUser.email!);
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || 'ผู้ใช้ใหม่',
              role,
              profilePicture: firebaseUser.photoURL || undefined,
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            
            await set(userRef, newUser);
            setUser(newUser);
            
            // Log audit for new user creation
            const auditRef = push(ref(db, 'auditLogs'));
            await set(auditRef, {
              action: 'user_created',
              userId: firebaseUser.uid,
              userEmail: firebaseUser.email,
              timestamp: new Date().toISOString(),
              details: { role }
            });
          }
        } catch (error: any) {
          console.error('Error handling user authentication:', error);
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
            variant: 'destructive',
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Check if email domain is allowed
      const allowedDomains = ['@kmutnb.ac.th', '@email.kmutnb.ac.th'];
      const isAllowedDomain = allowedDomains.some(domain => email.endsWith(domain));
      
      if (!isAllowedDomain) {
        throw new Error('Only @kmutnb.ac.th and @email.kmutnb.ac.th email addresses are allowed');
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role from database after successful login
      const userRef = ref(db, `users/${result.user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : null;
      
      // Log successful login
      const auditRef = push(ref(db, 'auditLogs'));
      await set(auditRef, {
        action: 'user_login',
        userId: result.user.uid,
        userEmail: result.user.email,
        loginMethod: 'email_password',
        timestamp: new Date().toISOString(),
        ipAddress: 'localhost',
        category: 'authentication',
        details: {
          success: true,
          userRole: userData?.role || 'unknown',
          userName: userData?.name || result.user.displayName || 'Unknown User',
          userAgent: navigator.userAgent
        }
      });
      
      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: 'ยินดีต้อนรับเข้าสู่ระบบ',
      });
    } catch (error: any) {
      console.error('Email/password sign-in error:', error);
      
      // Log failed login attempt
      try {
        const auditRef = push(ref(db, 'auditLogs'));
        await set(auditRef, {
          action: 'user_login_failed',
          userEmail: email,
          loginMethod: 'email_password',
          timestamp: new Date().toISOString(),
          ipAddress: 'localhost',
          category: 'authentication',
          details: {
            success: false,
            errorCode: error.code,
            errorMessage: error.message,
            userAgent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }
      
      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'ไม่พบผู้ใช้งานนี้ในระบบ';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'รหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้ (network-request-failed)';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'API key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'วิธีการเข้าสู่ระบบนี้ยังไม่เปิดใช้งานใน Firebase Console';
      } else if (typeof error.message === 'string' && error.message.includes('ERR_ABORTED')) {
        errorMessage = 'การเชื่อมต่อบริการ Identity Toolkit ถูกยกเลิก (net::ERR_ABORTED). โปรดตรวจสอบการตั้งค่าและเครือข่าย';
      }
      
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if email domain is allowed
      const allowedDomains = ['@kmutnb.ac.th', '@email.kmutnb.ac.th'];
      const isAllowedDomain = allowedDomains.some(domain => result.user.email?.endsWith(domain));
      
      if (!isAllowedDomain) {
        await signOut(auth);
        
        // Log failed Google login due to domain restriction
        const auditRef = push(ref(db, 'auditLogs'));
        await set(auditRef, {
          action: 'user_login_failed',
          userEmail: result.user.email,
          loginMethod: 'google',
          timestamp: new Date().toISOString(),
          ipAddress: 'localhost',
          category: 'authentication',
          details: {
            success: false,
            reason: 'domain_not_allowed',
            userAgent: navigator.userAgent
          }
        });
        
        throw new Error('Only @kmutnb.ac.th and @email.kmutnb.ac.th email addresses are allowed');
      }

      // Log successful Google login
      // Get user role from database after successful login
      const userRef = ref(db, `users/${result.user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : null;
      
      const auditRef = push(ref(db, 'auditLogs'));
      await set(auditRef, {
        action: 'user_login',
        userId: result.user.uid,
        userEmail: result.user.email,
        loginMethod: 'google',
        timestamp: new Date().toISOString(),
        ipAddress: 'localhost',
        category: 'authentication',
        details: {
          success: true,
          userRole: userData?.role || 'unknown',
          userName: userData?.name || result.user.displayName || 'Unknown User',
          userAgent: navigator.userAgent
        }
      });

      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: `ยินดีต้อนรับ ${result.user.displayName}`,
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Log failed Google login attempt (for other errors)
      try {
        const auditRef = push(ref(db, 'auditLogs'));
        await set(auditRef, {
          action: 'user_login_failed',
          loginMethod: 'google',
          timestamp: new Date().toISOString(),
          ipAddress: 'localhost',
          category: 'authentication',
          details: {
            success: false,
            errorCode: error.code,
            errorMessage: error.message,
            userAgent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.error('Failed to log Google login attempt:', logError);
      }
      
      let errorMessage = error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

      // Network/config related
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้ (network-request-failed)';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'API key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'วิธีการเข้าสู่ระบบนี้ยังไม่เปิดใช้งานใน Firebase Console';
      } else if (typeof error.message === 'string' && error.message.includes('ERR_ABORTED')) {
        errorMessage = 'การเชื่อมต่อบริการ Identity Toolkit ถูกยกเลิก (net::ERR_ABORTED). โปรดตรวจสอบการตั้งค่าและเครือข่าย';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน';
      }

      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Log audit before signing out
      if (user) {
        const auditRef = push(ref(db, 'auditLogs'));
        await set(auditRef, {
          action: 'user_logout',
          userId: user.id,
          details: {
            userEmail: user.email,
            userName: user.name,
            role: user.role
          },
          ipAddress: 'localhost',
          category: 'authentication',
          timestamp: new Date().toISOString()
        });
      }
      
      await signOut(auth);
      toast({
        title: 'ออกจากระบบสำเร็จ',
        description: 'แล้วพบกันใหม่',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถออกจากระบบได้',
        variant: 'destructive',
      });
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Check if email domain is allowed
      const allowedDomains = ['@kmutnb.ac.th', '@email.kmutnb.ac.th'];
      const isAllowedDomain = allowedDomains.some(domain => userData.email.endsWith(domain));
      
      if (!isAllowedDomain) {
        throw new Error('Only @kmutnb.ac.th and @email.kmutnb.ac.th email addresses are allowed');
      }

      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Determine role from email
      const role = getRoleFromEmail(userData.email);
      
      // Create user profile in Realtime Database
      const newUser: User = {
        id: result.user.uid,
        email: userData.email,
        name: userData.name,
        role,
        studentId: userData.studentId,
        employeeId: userData.employeeId,
        department: userData.department,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const userRef = ref(db, `users/${result.user.uid}`);
      await set(userRef, newUser);
      
      // Log audit for new user creation
      const auditRef = push(ref(db, 'auditLogs'));
      await set(auditRef, {
        action: 'user_registered',
        userId: result.user.uid,
        userEmail: userData.email,
        timestamp: new Date().toISOString(),
        details: { role, registrationMethod: 'email_password' }
      });
      
      toast({
        title: 'สมัครสมาชิกสำเร็จ',
        description: `ยินดีต้อนรับ ${userData.name}`,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
      
      toast({
        title: 'สมัครสมาชิกไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedUser = { ...user, ...userData };
      const userRef = ref(db, `users/${user.id}`);
      
      // Update user profile in Realtime Database
      await update(userRef, userData);
      setUser(updatedUser);
      
      // Log audit for profile update
      const auditRef = push(ref(db, 'auditLogs'));
      await set(auditRef, {
        action: 'profile_updated',
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        details: userData
      });
      
      toast({
        title: 'อัปเดตโปรไฟล์สำเร็จ',
        description: 'ข้อมูลของคุณถูกบันทึกแล้ว',
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'อัปเดตโปรไฟล์ไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      register,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};