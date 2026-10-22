import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronDown,
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
    <header className="sticky top-0 z-40 w-full bg-[#FAF7F2] border-b border-[#EFE7DE] px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {(isTeacher || isStudent) && !isAuthPage && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-[#5C554E] hover:text-[#2D2A26] hover:bg-[#EFE7DE] lg:hidden focus:outline-none transition-colors"
              aria-label="Toggle navigation sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E07253] to-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#2D2A26]">
                Adaptive<span className="text-[#D96B4C]">Exam</span>
              </span>
              <span className="text-[11px] text-[#8C827A] font-medium leading-none hidden sm:inline">
                AI Proctoring & Risk Engine
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search pill bar (styled like the inspiration image) */}
        {!isLandingPage && !isAuthPage && (
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center">
            <Search className="w-4 h-4 text-[#8C827A] absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search examinations, students, or proctor logs..."
              className="w-full input-warm-pill text-xs focus:ring-2 focus:ring-[#D96B4C]/20"
              readOnly
              onClick={() => {
                if (isTeacher) navigate('/teacher/exams');
                else if (isStudent) navigate('/student/available');
              }}
            />
          </div>
        )}

        {/* Center: Public Links on Landing / Overview */}
        {(isLandingPage || isAuthPage) && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#5C554E]">
            <Link to="/" className="text-[#D96B4C] hover:text-[#C55C3E] transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-[#2D2A26] transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-[#2D2A26] transition-colors">
              Architecture
            </a>
          </nav>
        )}

        {/* Right: Notification Bell, System Health & Auth Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Inspiration Bell Pill with Alert indicator dot */}
          {isAuthenticated && (
            <button
              type="button"
              className="relative flex items-center justify-center h-9 w-9 rounded-full bg-white border border-[#EFE7DE] text-[#5C554E] hover:text-[#D96B4C] hover:border-[#D96B4C]/40 shadow-xs transition-all hover:scale-105"
              title="Real-time Proctor Alerts"
              onClick={() => {
                if (isTeacher) navigate('/teacher/reports');
              }}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
            </button>
          )}

          {/* Subtle System Status Pill */}
          {healthStatus && (
            <button
              onClick={onRefreshHealth}
              title="AWS Serverless Stack Health"
              type="button"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#EFE7DE] bg-white text-[#5C554E] hover:bg-[#F3EAE2] transition-colors shadow-xs"
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
              <span>{healthStatus.state === 'healthy' ? 'System Live' : 'Checking'}</span>
            </button>
          )}

          {/* User Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#2D2A26] leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D96B4C]">
                  {user.role}
                </span>
              </div>

              {/* Inspiration Avatar */}
              <div className="h-9 w-9 rounded-2xl bg-[#FCEEE7] text-[#D96B4C] flex items-center justify-center font-extrabold text-xs border border-[#F5D7CD] shadow-xs">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-full border border-[#EFE7DE] bg-white text-[#5C554E] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
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
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#2D2A26] hover:text-[#D96B4C] hover:bg-white border border-[#EFE7DE] transition-all shadow-xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-terracotta text-xs"
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
