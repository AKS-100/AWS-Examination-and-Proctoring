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
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isTeacher = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/proctor');
  const isStudent = location.pathname.startsWith('/student');

  // Teacher navigation
  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, exact: true },
    { name: 'My Exams', path: '/teacher/exams', icon: FileText },
    { name: 'Create Exam', path: '/teacher/create-exam', icon: PlusCircle },
    { name: 'Student Results', path: '/teacher/results', icon: BarChart3 },
    { name: 'Proctoring Reports', path: '/teacher/reports', icon: ShieldAlert },
    { name: 'Faculty Profile', path: '/teacher/profile', icon: User },
  ];

  // Student navigation
  const studentNav = [
    { name: 'Arena Dashboard', path: '/student', icon: LayoutDashboard, exact: true },
    { name: 'My Examinations', path: '/student/available', icon: BookOpen },
    { name: 'Exam Results', path: '/student/results', icon: Award },
    { name: 'Candidate Profile', path: '/student/profile', icon: User },
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
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Terracotta Navigation Rail (Inspired by user's reference) */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#D96B4C] text-white shadow-xl shadow-[#D96B4C]/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-4 sm:p-5">
          <div className="space-y-6">
            {/* Active Workspace Pill */}
            <div className="p-3.5 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white text-[#D96B4C] flex items-center justify-center shadow-xs">
                {isTeacher ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/70 block">
                  Workspace
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {isTeacher ? 'Instructor Portal' : 'Student Arena'}
                </span>
              </div>
            </div>

            {/* Navigation links with inspiration-styled squircle active pills */}
            <nav className="space-y-1.5">
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
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-white text-[#D96B4C] shadow-lg shadow-black/10 font-bold scale-[1.02]'
                        : 'text-white/80 hover:text-white hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-xl transition-colors ${
                        isActive ? 'bg-[#FCEEE7] text-[#D96B4C]' : 'group-hover:bg-white/10'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D96B4C]" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Sign Out footer with soft rounded styling */}
          <div className="pt-4 border-t border-white/15 space-y-3">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-2xl bg-white/10 border border-white/10">
              <div className="h-8 w-8 rounded-xl bg-white text-[#D96B4C] flex items-center justify-center font-extrabold text-xs shadow-xs">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-white/70 truncate">{user?.email || ''}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-white bg-black/15 hover:bg-black/25 transition-colors border border-white/10 cursor-pointer"
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
