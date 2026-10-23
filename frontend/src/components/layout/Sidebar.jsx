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

  // Teacher navigation with lively distinct colors
  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, exact: true, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
    { name: 'My Exams', path: '/teacher/exams', icon: FileText, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-500/20' },
    { name: 'Create Exam', path: '/teacher/create-exam', icon: PlusCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
    { name: 'Student Results', path: '/teacher/results', icon: BarChart3, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 dark:bg-sky-500/20' },
    { name: 'Proctoring Reports', path: '/teacher/reports', icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
    { name: 'Profile', path: '/teacher/profile', icon: User, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
  ];

  // Student navigation with lively distinct colors
  const studentNav = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard, exact: true, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
    { name: 'My Exams', path: '/student/available', icon: BookOpen, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-500/20' },
    { name: 'Results', path: '/student/results', icon: Award, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
    { name: 'Profile', path: '/student/profile', icon: User, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-60 bg-white dark:bg-[#1C1A18] border-r border-[#E8E8E8] dark:border-[#332F2B] transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-3">
          <div className="space-y-1">
            {/* Workspace label */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-[#F5F5F5]/60 dark:bg-[#262320]/60 border border-[#E8E8E8] dark:border-[#332F2B]">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white flex items-center justify-center shadow-xs">
                {isTeacher ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#999] dark:text-[#8C827A]">
                  Workspace
                </p>
                <p className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2]">
                  {isTeacher ? 'Instructor' : 'Student'}
                </p>
              </div>
            </div>

            {/* Navigation links */}
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
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FFF4F0] to-[#FAF7F2] dark:from-[#2A1A14] dark:to-[#221B17] text-[#E8612D] dark:text-[#F06E3B] font-semibold border-l-2 border-[#E8612D] dark:border-[#F06E3B] shadow-xs'
                        : 'text-[#555] dark:text-[#C4BCB5] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-[#F5F5F5] dark:hover:bg-[#262320]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white shadow-sm shadow-orange-500/30'
                          : `${item.bg} ${item.color} group-hover:scale-110`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8612D] dark:bg-[#F06E3B]" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User footer */}
          <div className="border-t border-[#E8E8E8] dark:border-[#332F2B] pt-3 space-y-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#999] dark:text-[#8C827A] truncate">{user?.email || ''}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#999] dark:text-[#8C827A] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
