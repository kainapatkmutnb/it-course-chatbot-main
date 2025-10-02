import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user account is active
  if (!user.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">บัญชีถูกระงับ</h2>
          <p className="text-gray-600">บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }

  // Redirect to appropriate dashboard based on role
  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'student':
        return '/dashboard/student';
      case 'instructor':
        return '/dashboard/instructor';
      case 'staff':
        return '/dashboard/staff';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/student';
    }
  };

  // If children are provided, render them (for custom role-based content)
  if (children) {
    return <>{children}</>;
  }

  // Otherwise, redirect to appropriate dashboard
  return <Navigate to={getDashboardPath(user.role)} replace />;
};

export default RoleBasedRoute;