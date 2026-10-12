import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowRight, LogIn } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400">Verifying security credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRole =
    allowedRoles.length === 0 ||
    allowedRoles.includes(user.role) ||
    (allowedRoles.includes('teacher') && user.role === 'proctor') ||
    (allowedRoles.includes('proctor') && user.role === 'teacher');

  if (!hasRole) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Access Restricted (RBAC)</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account is registered as a <span className="font-semibold text-rose-400 uppercase">{user.role}</span>.
              This area is restricted strictly to <span className="font-semibold text-slate-200 uppercase">{allowedRoles.join(', ')}</span> personnel.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to={user.role === 'teacher' ? '/teacher' : '/student'}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              Go to Your {user.role === 'teacher' ? 'Teacher' : 'Student'} Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with another account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
