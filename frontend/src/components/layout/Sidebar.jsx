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

  // Teacher navigation
  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, exact: true },
    { name: 'My Exams', path: '/teacher/exams', icon: FileText },
    { name: 'Create Exam', path: '/teacher/create-exam', icon: PlusCircle },
    { name: 'Student Results', path: '/teacher/results', icon: BarChart3 },
    { name: 'Proctoring Reports', path: '/teacher/reports', icon: ShieldAlert },
    { name: 'Profile', path: '/teacher/profile', icon: User },
  ];

  // Student navigation
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-60 bg-white border-r border-[#E8E8E8] transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-3">
          <div className="space-y-1">
            {/* Workspace label */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2">
              <div className="h-8 w-8 rounded-lg bg-[#F5F5F5] text-[#E8612D] flex items-center justify-center">
                {isTeacher ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#999]">
                  Workspace
                </p>
                <p className="text-xs font-semibold text-[#1A1A1A]">
                  {isTeacher ? 'Instructor' : 'Student'}
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-0.5">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#FFF4F0] text-[#E8612D] font-semibold'
                        : 'text-[#555] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User footer */}
          <div className="border-t border-[#E8E8E8] pt-3 space-y-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#E8612D] text-white flex items-center justify-center font-semibold text-xs">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#999] truncate">{user?.email || ''}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#999] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
