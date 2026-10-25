import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Command,
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
    <header className="sticky top-0 z-40 w-full bg-[#fdf6e3]/90 dark:bg-[#16161e]/90 backdrop-blur-md border-b border-[#dfd5be] dark:border-[#292e42] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand Wordmark (No icon, clean typography inspired by reference) */}
        <div className="flex items-center gap-3">
          {(isTeacher || isStudent) && !isAuthPage && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 lg:hidden focus:outline-none transition-colors"
              aria-label="Toggle navigation sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-1.5 group select-none">
            <span className="font-extrabold text-xl tracking-tight text-[#073642] dark:text-[#c0caf5] transition-colors">
              Adaptive<span className="font-semibold text-[#581c87] dark:text-[#7aa2f7] ml-0.5 transition-colors">Exam</span>
            </span>
          </Link>
        </div>

        {/* Center: Search pill bar (Matches Reference Image with shortcut badge) */}
        {!isLandingPage && !isAuthPage && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={() => {
                if (isTeacher) navigate('/teacher/exams');
                else if (isStudent) navigate('/student/available');
              }}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <span className="font-medium text-zinc-500 dark:text-zinc-400">Search examinations, candidates...</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 shadow-xs">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>
        )}

        {/* Center: Public navigation links */}
        {(isLandingPage || isAuthPage) && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link to="/" className="text-zinc-900 dark:text-white font-semibold transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
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
            className="flex items-center justify-center h-8 w-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle dark/light theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:text-zinc-900" />
            )}
          </button>

          {/* Notification bell */}
          {isAuthenticated && (
            <button
              type="button"
              className="relative flex items-center justify-center h-8 w-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Notifications"
              onClick={() => {
                if (isTeacher) navigate('/teacher/reports');
              }}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#fdf6e3] dark:ring-[#16161e]" />
            </button>
          )}

          {/* System status indicator */}
          {healthStatus && (
            <button
              onClick={onRefreshHealth}
              title="System Status"
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 transition-colors"
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
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-[11px] shadow-xs">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize leading-tight">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center h-8 w-8 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold shadow-xs transition-all"
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
