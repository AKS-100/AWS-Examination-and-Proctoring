import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { checkHealth } from '../../services/api';

export const AppShell = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState({
    state: 'checking',
    data: null,
    latencyMs: null,
    error: null,
  });

  const location = useLocation();

  const fetchHealth = async () => {
    setHealthStatus((prev) => ({ ...prev, state: 'checking' }));
    const startTime = performance.now();

    try {
      const response = await checkHealth();
      const latency = Math.round(performance.now() - startTime);

      setHealthStatus({
        state: 'healthy',
        data: response.data,
        latencyMs: latency,
        error: null,
      });
    } catch (err) {
      setHealthStatus({
        state: 'error',
        data: null,
        latencyMs: null,
        error: err.message || 'Cannot connect to backend server',
      });
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll gently every 45s
    const interval = setInterval(fetchHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  // Determine if sidebar should be shown
  const isTeacher = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/proctor');
  const isStudent = location.pathname.startsWith('/student');
  const isExamArena = location.pathname.startsWith('/student/exam/');
  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/overview';

  // Only show sidebar on dashboard pages, not in full exam arena or public/auth pages
  const showSidebar = (isTeacher || isStudent) && !isExamArena && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172033] font-sans">
      {/* Top Navigation */}
      <Navbar
        healthStatus={healthStatus}
        onRefreshHealth={fetchHealth}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Role Sidebar */}
        {showSidebar && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}

        {/* Content Container */}
        <main
          className={`flex-1 transition-all duration-200 ${
            showSidebar ? 'lg:pl-64' : ''
          }`}
        >
          <div className={isExamArena || isAuthPage ? 'w-full' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}>
            <Outlet context={{ healthStatus, refetchHealth: fetchHealth }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
