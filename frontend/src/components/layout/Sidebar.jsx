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
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-60 bg-[#fdf6e3] dark:bg-[#16161e] border-r border-[#dfd5be] dark:border-[#292e42] transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-3.5">
          <div className="space-y-3">
            {/* Minimalist Workspace Card */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#eee8d5]/70 dark:bg-[#1f2335] border border-[#dfd5be] dark:border-[#292e42]">
              <div className="h-8 w-8 rounded-xl bg-[#dfd5be] dark:bg-[#292e42] text-[#073642] dark:text-[#7aa2f7] flex items-center justify-center flex-shrink-0 shadow-xs">
                {isTeacher ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#839496] dark:text-[#565f89]">
                  Workspace
                </p>
                <p className="text-xs font-bold text-[#073642] dark:text-[#c0caf5] truncate">
                  {isTeacher ? 'Instructor Portal' : 'Student Arena'}
                </p>
              </div>
            </div>

            {/* Navigation items */}
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
                        ? 'bg-[#073642] text-[#fdf6e3] dark:bg-[#24283b] dark:text-[#7aa2f7] dark:border dark:border-[#3b4261] shadow-xs'
                        : 'text-[#586e75] dark:text-[#a9b1d6] hover:text-[#073642] dark:hover:text-[#c0caf5] hover:bg-[#eee8d5] dark:hover:bg-[#1f2335]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-[#fdf6e3] dark:text-[#7aa2f7]'
                          : 'text-[#839496] dark:text-[#565f89] group-hover:text-[#073642] dark:group-hover:text-[#c0caf5]'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User profile footer */}
          <div className="border-t border-[#dfd5be] dark:border-[#292e42] pt-3 space-y-2">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[#eee8d5]/70 dark:bg-[#1f2335] border border-[#dfd5be] dark:border-[#292e42]">
              <div className="h-7 w-7 rounded-full bg-[#073642] text-[#fdf6e3] dark:bg-[#7aa2f7] dark:text-[#1a1b26] flex items-center justify-center font-bold text-[11px] shadow-xs flex-shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-bold text-[#073642] dark:text-[#c0caf5] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#839496] dark:text-[#787c99] truncate">{user?.email || ''}</p>
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
