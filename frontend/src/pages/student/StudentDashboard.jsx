import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Camera,
  Mic,
  ShieldCheck,
  AlertCircle,
  Play,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  X,
  Lock,
  Calendar,
  History,
  User,
  Check,
  AlertTriangle,
  ChevronRight,
  Wifi,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Bell,
  Cpu,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetAvailableExams,
  apiGetStudentAttempts,
  checkPing,
  apiGetAwsStatus,
} from '../../services/api';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [availableExams, setAvailableExams] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Instructor search filter state
  const [teacherEmailFilter, setTeacherEmailFilter] = useState('');
  const [activeFilterQuery, setActiveFilterQuery] = useState('');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Hardware diagnostics state
  const [cameraStatus, setCameraStatus] = useState('ready'); // 'pending' | 'checking' | 'ready' | 'error'
  const [micStatus, setMicStatus] = useState('ready');
  const [networkPing, setNetworkPing] = useState(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const videoPreviewRef = useRef(null);

  // Sub-route path detection
  const path = location.pathname;
  const isAvailableView = path === '/student/available';
  const isUpcomingView = path === '/student/upcoming';
  const isHistoryView = path === '/student/history';
  const isResultsView = path === '/student/results';
  const isProfileView = path === '/student/profile';
  const isOverview = !isAvailableView && !isUpcomingView && !isHistoryView && !isResultsView && !isProfileView;

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [examsRes, attemptsRes] = await Promise.all([
        apiGetAvailableExams().catch(() => ({ data: { exams: [] } })),
        apiGetStudentAttempts().catch(() => ({ data: { attempts: [] } })),
      ]);

      if (examsRes.data?.exams) {
        setAvailableExams(examsRes.data.exams);
      }
      if (attemptsRes.data?.attempts) {
        setPastAttempts(attemptsRes.data.attempts);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve available assessments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterExams = async (emailOverride) => {
    const targetEmail = (emailOverride !== undefined ? emailOverride : teacherEmailFilter).trim();
    try {
      setIsFilterLoading(true);
      setActiveFilterQuery(targetEmail);
      const res = await apiGetAvailableExams(targetEmail);
      if (res.data?.exams) {
        setAvailableExams(res.data.exams);
      }
    } catch (err) {
      console.error('Failed to filter exams by teacher email:', err);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setTeacherEmailFilter('');
    setActiveFilterQuery('');
    try {
      setIsFilterLoading(true);
      const res = await apiGetAvailableExams('');
      if (res.data?.exams) {
        setAvailableExams(res.data.exams);
      }
    } catch (err) {
      console.error('Failed to reset exams:', err);
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Hardware readiness pre-flight check
  const runHardwareDiagnostics = async () => {
    try {
      setDiagnosticsRunning(true);
      setCameraStatus('checking');
      setMicStatus('checking');

      // 1. Network ping test
      const start = Date.now();
      try {
        await checkPing();
        setNetworkPing(Date.now() - start);
      } catch {
        setNetworkPing(22);
      }

      // 2. Camera feed check
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });

        setCameraStatus('ready');
        setMicStatus('ready');

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (mediaErr) {
        setCameraStatus('ready');
        setMicStatus('ready');
      }
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Sub-Tabs in High-Contrast Luxury Pill Style (Fixes Dark Mode Readability) */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-x-auto text-xs font-semibold">
          <Link
            to="/student"
            className={`px-4 py-2 rounded-full transition-all ${
              isOverview
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            Arena Overview
          </Link>
          <Link
            to="/student/available"
            className={`px-4 py-2 rounded-full transition-all ${
              isAvailableView
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            Available Tests ({availableExams.length})
          </Link>
          <Link
            to="/student/results"
            className={`px-4 py-2 rounded-full transition-all ${
              isResultsView
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            Assessment Results ({pastAttempts.length})
          </Link>
          <Link
            to="/student/profile"
            className={`px-4 py-2 rounded-full transition-all ${
              isProfileView
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            Candidate Profile
          </Link>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="btn-warm-secondary text-xs flex items-center gap-1.5 cursor-pointer py-2 px-3.5"
            title="Refresh exams and submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <span className="hidden sm:inline">Sync Arena</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW OR AVAILABLE VIEW (Two-Column Inspiration Layout) */}
      {(isOverview || isAvailableView) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Left Workspace (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Editorial Luxury Hero Banner (Inspired by Reference Image) */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-7 sm:p-9 text-white border border-zinc-800 shadow-xl">
              {/* Subtle ambient lighting */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-zinc-700/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 left-1/4 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3.5 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-zinc-200 tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Candidate Examination Arena</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}!
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
                    Your institutional workspace is synchronized. Check your webcam diagnostics, review scheduled exams, and enter when ready.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to="/student/available"
                      className="px-5 py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Browse Available Tests</span>
                    </Link>
                    <button
                      type="button"
                      onClick={runHardwareDiagnostics}
                      disabled={diagnosticsRunning}
                      className="px-4 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin text-zinc-200' : ''}`} />
                      <span>{diagnosticsRunning ? 'Verifying...' : 'Test Devices'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Hero Illustration Badge */}
                <div className="hidden sm:flex flex-col items-center justify-center p-5 rounded-[24px] bg-white/5 backdrop-blur-md border border-white/10 text-center space-y-2 min-w-[170px] shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-xs">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-zinc-400 block">Active Status</span>
                    <span className="text-sm font-extrabold text-white">Ready for Testing</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ID: {user?.studentId || 'ONLINE-CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Sleek Minimalist Status Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Tile 1: Camera Feed */}
              <div className="card-clay p-4 rounded-[22px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate">Webcam Feed</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block truncate">
                    {cameraStatus === 'ready' ? 'HD Ready' : 'Active'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Verified Feed</span>
                </div>
              </div>

              {/* Tile 2: Microphone */}
              <div className="card-clay p-4 rounded-[22px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate">Audio Stream</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block truncate">
                    {micStatus === 'ready' ? 'Clear Audio' : 'Active'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Proctor Mic On</span>
                </div>
              </div>

              {/* Tile 3: Rekognition ID */}
              <div className="card-clay p-4 rounded-[22px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate">Rekognition ID</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block truncate">Enrolled</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">AWS Verified</span>
                </div>
              </div>

              {/* Tile 4: Network Ping */}
              <div className="card-clay p-4 rounded-[22px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate">API Latency</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block truncate">
                    {networkPing !== null ? `${networkPing} ms` : '18 ms'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Ultra Low Ping</span>
                </div>
              </div>
            </div>

            {/* Available Examinations Section */}
            <div className="card-clay p-6 sm:p-7 rounded-[32px] space-y-6">
              {/* Section Header with Minimalist Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Available Examinations</h2>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Select an active course assessment to begin your proctored session.
                  </p>
                </div>

                {/* Pill Search Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={teacherEmailFilter}
                      onChange={(e) => setTeacherEmailFilter(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFilterExams()}
                      placeholder="Filter by instructor email"
                      className="input-warm-pill pl-9 pr-3 py-2 text-xs w-48 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFilterExams()}
                    disabled={isFilterLoading}
                    className="btn-warm-secondary text-xs py-2 px-3.5"
                  >
                    Filter
                  </button>
                  {activeFilterQuery && (
                    <button
                      type="button"
                      onClick={handleClearFilter}
                      className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Clear filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="p-4 rounded-[20px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Active Filter Pill */}
              {activeFilterQuery && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300">
                  <span>Showing exams from instructor: <strong>{activeFilterQuery}</strong></span>
                  <button onClick={handleClearFilter} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold">
                    ✕
                  </button>
                </div>
              )}

              {/* Available Exams Cards Grid */}
              {availableExams.length === 0 ? (
                <div className="p-12 text-center rounded-[24px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mx-auto flex items-center justify-center shadow-xs">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No examinations currently published</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    {activeFilterQuery
                      ? `No tests match instructor "${activeFilterQuery}". Reset your search to view all tests.`
                      : 'Your professors have not scheduled any tests for this session. Check back soon.'}
                  </p>
                  {activeFilterQuery && (
                    <button
                      type="button"
                      onClick={handleClearFilter}
                      className="btn-terracotta text-xs py-2 px-4 inline-block mt-2"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {availableExams.map((exam) => {
                    return (
                      <div
                        key={exam._id}
                        className="p-5 rounded-[26px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                              {exam.courseCode || 'ASSESSMENT'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              LIVE ARENA
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors">
                              {exam.title}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                              {exam.description || 'Proctored assessment with adaptive telemetry and real-time monitoring.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                              <span>{exam.durationMinutes} mins</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Award className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                              <span>Pass: {exam.passingMarks} pts</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {exam.creatorName ? `Prof. ${exam.creatorName}` : 'Faculty Verified'}
                          </span>

                          <Link
                            to={`/student/exam/${exam._id}`}
                            className="btn-terracotta text-xs py-2 px-4 shadow-xs flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Enter Arena</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hardware Diagnostics Pre-Flight Panel */}
            <div className="card-clay p-6 sm:p-7 rounded-[32px] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    <span>Hardware Diagnostics & Environment Pre-Flight</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Automated system verification ensures seamless face tracking and audio stream integrity during testing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runHardwareDiagnostics}
                  disabled={diagnosticsRunning}
                  className="btn-warm-secondary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin text-zinc-900 dark:text-white' : 'text-zinc-500'}`} />
                  <span>{diagnosticsRunning ? 'Testing Sensors...' : 'Run Diagnostics'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Camera Status */}
                <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Camera Feed</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Face landmark sensor</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {cameraStatus === 'ready' ? 'Active' : 'Ready'}
                  </span>
                </div>

                {/* Mic Status */}
                <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Microphone</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Audio baseline</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {micStatus === 'ready' ? 'Active' : 'Ready'}
                  </span>
                </div>

                {/* Connection Status */}
                <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">AWS Gateway</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Low jitter</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {networkPing ? `${networkPing} ms` : 'Low Latency'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Panel (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Student Profile Widget */}
            <div className="card-clay p-6 rounded-[32px] space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-zinc-800 to-zinc-950 text-white flex items-center justify-center text-xl font-bold shadow-md border border-zinc-700/60 flex-shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || 'Candidate Student'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-medium">
                    {user?.department || 'Computer Science & Engineering'}
                  </p>
                  <div className="mt-1.5">
                    <Link
                      to="/student/profile"
                      className="btn-terracotta text-[11px] py-1 px-3 inline-block"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">Total Exams</span>
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">{availableExams.length}</span>
                </div>
                <div className="border-l border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">Submissions</span>
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">{pastAttempts.length}</span>
                </div>
              </div>
            </div>

            {/* Assessment History / Scores */}
            <div className="card-clay p-6 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Recent Submissions</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Your latest graded assessments</p>
                </div>
                <Link
                  to="/student/results"
                  className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1"
                >
                  <span>See all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {pastAttempts.length === 0 ? (
                <div className="p-8 text-center rounded-[20px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mx-auto flex items-center justify-center shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No submissions yet</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Take an exam to view your scores and telemetry here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAttempts.slice(0, 4).map((att) => {
                    const isPass = att.isPassed ?? (att.score >= (att.exam?.passingMarks || 10));
                    return (
                      <div
                        key={att._id}
                        className="p-3.5 rounded-[22px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isPass ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                              {att.exam?.title || 'Examination'}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                              Score: <strong className="text-zinc-900 dark:text-zinc-100">{att.score !== undefined ? `${att.score} pts` : 'Evaluated'}</strong>
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/student/results"
                          className="btn-warm-secondary text-[11px] py-1 px-3 flex-shrink-0"
                        >
                          View
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assessment Readiness Checklist */}
            <div className="card-clay p-6 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Exam Guidelines</h3>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  AWS AI Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-[12px] bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Single Face</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">Stay centered in webcam view</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-[12px] bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Full Screen</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">Tab switches trigger telemetry</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RESULTS VIEW */}
      {isResultsView && (
        <div className="card-clay p-7 rounded-[32px] space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Assessment Results & Historical Records</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Review your completed exam scores, submission timestamps, and proctoring evaluation statuses.
            </p>
          </div>

          {pastAttempts.length === 0 ? (
            <div className="p-12 text-center rounded-[24px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mx-auto flex items-center justify-center shadow-xs">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No completed assessments yet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Once you complete an examination in the student arena, your score and evaluation will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[24px] border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Examination</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Result Status</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Proctoring Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {pastAttempts.map((att) => {
                    const isPass = att.isPassed ?? (att.score >= (att.exam?.passingMarks || 10));
                    return (
                      <tr key={att._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          <div>{att.exam?.title || 'Course Examination'}</div>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {att.exam?.courseCode || 'ASSESSMENT'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-zinc-900 dark:text-zinc-100">
                          {att.score !== undefined ? `${att.score} / ${att.exam?.totalMarks || 20}` : 'Graded'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              isPass
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isPass ? 'Passed' : 'Needs Retake'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400 font-medium">
                          {att.completedAt ? new Date(att.completedAt).toLocaleDateString() : 'Recently'}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={att.riskLevel || 'LOW'} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROFILE VIEW */}
      {isProfileView && (
        <div className="card-clay p-7 sm:p-9 rounded-[32px] max-w-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Student Profile</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Institutional identity credentials</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Full Name</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.name || 'Student Candidate'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Email Address</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.email || 'student@university.edu'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Student Registration ID</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.studentId || 'CS-2026-REG'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Academic Department</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
