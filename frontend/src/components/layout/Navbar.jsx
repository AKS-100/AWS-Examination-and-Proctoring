import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

export const Navbar = ({ healthStatus, onRefreshHealth, isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isTeacher = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/proctor');
  const isStudent = location.pathname.startsWith('/student');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/' || location.pathname === '/overview';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {/* Show sidebar toggle only on authenticated dashboard routes */}
          {(isTeacher || isStudent) && !isAuthPage && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Toggle navigation sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base sm:text-lg text-[#172033]">
                AdaptiveExam
              </span>
              <span className="text-[11px] text-[#64748B] font-medium leading-none hidden sm:inline">
                Assessment & Proctoring Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Public Links on Landing / Overview */}
        {(isLandingPage || isAuthPage) && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <Link to="/" className="text-[#172033] hover:text-[#2563EB] transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-[#172033] transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-[#172033] transition-colors">
              About
            </a>
          </nav>
        )}

        {/* Center: Authenticated Portal Switcher */}
        {isAuthenticated && !isLandingPage && !isAuthPage && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B]">Workspace:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              {user?.role === 'teacher' || user?.role === 'proctor' ? 'Teacher Portal' : 'Student Arena'}
            </span>
          </div>
        )}

        {/* Right: Health Badge & Auth Controls */}
        <div className="flex items-center gap-3">
          {/* Subtle System Status Pill */}
          {healthStatus && (
            <button
              onClick={onRefreshHealth}
              title="API Health Status"
              type="button"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthStatus.state === 'healthy'
                      ? 'bg-emerald-500'
                      : healthStatus.state === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <span>{healthStatus.state === 'healthy' ? 'System Online' : 'Checking'}</span>
            </button>
          )}

          {/* User Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#172033] leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-[#64748B] capitalize">
                  {user.role}
                </span>
              </div>

              <div className="h-8 w-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs border border-blue-200">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#172033] hover:text-[#2563EB] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 shadow-xs transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
