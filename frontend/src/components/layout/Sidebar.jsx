import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BarChart3,
  ShieldAlert,
  User,
  BookOpen,
  Award,
  LogOut,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isTeacher = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/proctor');
  const isStudent = location.pathname.startsWith('/student');

  // Clean, modern navigation items with elegant Lucide icons (no clunky colored boxes)
  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, exact: true },
    { name: 'My Exams', path: '/teacher/exams', icon: FileText },
    { name: 'Create Exam', path: '/teacher/create-exam', icon: PlusCircle },
    { name: 'Student Results', path: '/teacher/results', icon: BarChart3 },
    { name: 'Proctoring Reports', path: '/teacher/reports', icon: ShieldAlert },
    { name: 'Profile', path: '/teacher/profile', icon: User },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard, exact: true },
    { name: 'My Exams', path: '/student/available', icon: BookOpen },
    { name: 'Results', path: '/student/results', icon: Award },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  const currentNav = isTeacher ? teacherNav : isStudent ? studentNav : null;

  if (!currentNav) return null;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sleek Minimalist Sidebar */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-60 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800/80 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-3.5">
          <div className="space-y-3">
            {/* Minimalist Workspace Card */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                {isTeacher ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                  Workspace
                </p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {isTeacher ? 'Instructor Portal' : 'Student Arena'}
                </p>
              </div>
            </div>

            {/* Navigation items (Clean strokes, no tacky rainbow square backgrounds) */}
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-white dark:text-zinc-950'
                          : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-950 opacity-90" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User profile footer */}
          <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-3 space-y-2">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="h-7 w-7 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-[11px] shadow-xs flex-shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email || ''}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
