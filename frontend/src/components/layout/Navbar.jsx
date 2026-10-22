import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar = ({ healthStatus, onRefreshHealth, isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const isTeacher = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/proctor');
  const isStudent = location.pathname.startsWith('/student');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/' || location.pathname === '/overview';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#1C1A18] border-b border-[#E8E8E8] dark:border-[#332F2B] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {(isTeacher || isStudent) && !isAuthPage && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#999] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-[#F5F5F5] dark:hover:bg-[#262320] lg:hidden focus:outline-none transition-colors"
              aria-label="Toggle navigation sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8612D] text-white transition-transform group-hover:scale-105 shadow-xs">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold text-[15px] text-[#1A1A1A] dark:text-[#FAF7F2] tracking-tight transition-colors">
              Adaptive<span className="text-[#E8612D]">Exam</span>
            </span>
          </Link>
        </div>

        {/* Center: Search bar on dashboard pages */}
        {!isLandingPage && !isAuthPage && (
          <div className="hidden md:flex flex-1 max-w-sm mx-4 relative items-center">
            <Search className="w-4 h-4 text-[#999] dark:text-[#8C827A] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search exams, students..."
              className="w-full bg-[#F5F5F5] dark:bg-[#262320] border border-transparent dark:border-[#332F2B] rounded-lg pl-10 pr-4 py-2 text-sm text-[#1A1A1A] dark:text-[#FAF7F2] placeholder-[#999] dark:placeholder-[#8C827A] focus:outline-none focus:border-[#E8E8E8] dark:focus:border-[#47423D] focus:bg-white dark:focus:bg-[#1C1A18] transition-colors"
              readOnly
              onClick={() => {
                if (isTeacher) navigate('/teacher/exams');
                else if (isStudent) navigate('/student/available');
              }}
            />
          </div>
        )}

        {/* Center: Public navigation links */}
        {(isLandingPage || isAuthPage) && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#555] dark:text-[#C4BCB5]">
            <Link to="/" className="text-[#E8612D] hover:text-[#D4551F] transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] transition-colors">
              About
            </a>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-[#555] dark:text-[#C4BCB5] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-[#F5F5F5] dark:hover:bg-[#262320] transition-colors"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle dark/light theme"
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px] text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-[#555] hover:text-[#1A1A1A] animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Notification bell */}
          {isAuthenticated && (
            <button
              type="button"
              className="relative flex items-center justify-center h-9 w-9 rounded-lg text-[#555] dark:text-[#C4BCB5] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-[#F5F5F5] dark:hover:bg-[#262320] transition-colors"
              title="Notifications"
              onClick={() => {
                if (isTeacher) navigate('/teacher/reports');
              }}
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-[#1C1A18]" />
            </button>
          )}

          {/* System status indicator */}
          {healthStatus && (
            <button
              onClick={onRefreshHealth}
              title="System Status"
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#555] dark:text-[#C4BCB5] hover:bg-[#F5F5F5] dark:hover:bg-[#262320] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus.state === 'healthy'
                    ? 'bg-emerald-500'
                    : healthStatus.state === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span>{healthStatus.state === 'healthy' ? 'Online' : 'Checking'}</span>
            </button>
          )}

          {/* User controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#262320]">
                <div className="h-7 w-7 rounded-lg bg-[#E8612D] text-white flex items-center justify-center font-semibold text-xs">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#999] dark:text-[#8C827A] capitalize leading-tight">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-[#999] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#555] dark:text-[#C4BCB5] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-[#F5F5F5] dark:hover:bg-[#262320] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-terracotta text-sm py-2 px-4"
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
