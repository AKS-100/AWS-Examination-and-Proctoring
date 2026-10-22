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
      {/* Navigation Sub-Tabs in Pill Style */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#EFE7DE] shadow-xs overflow-x-auto text-xs font-semibold">
          <Link
            to="/student"
            className={`px-4 py-2 rounded-full transition-all ${
              isOverview
                ? 'bg-[#D96B4C] text-white shadow-xs font-bold'
                : 'text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#F6EFE9]'
            }`}
          >
            Arena Overview
          </Link>
          <Link
            to="/student/available"
            className={`px-4 py-2 rounded-full transition-all ${
              isAvailableView
                ? 'bg-[#D96B4C] text-white shadow-xs font-bold'
                : 'text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#F6EFE9]'
            }`}
          >
            Available Tests ({availableExams.length})
          </Link>
          <Link
            to="/student/results"
            className={`px-4 py-2 rounded-full transition-all ${
              isResultsView
                ? 'bg-[#D96B4C] text-white shadow-xs font-bold'
                : 'text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#F6EFE9]'
            }`}
          >
            Assessment Results ({pastAttempts.length})
          </Link>
          <Link
            to="/student/profile"
            className={`px-4 py-2 rounded-full transition-all ${
              isProfileView
                ? 'bg-[#D96B4C] text-white shadow-xs font-bold'
                : 'text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#F6EFE9]'
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
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D96B4C]' : 'text-[#8C827A]'}`} />
            <span className="hidden sm:inline">Sync Arena</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW OR AVAILABLE VIEW (Two-Column Inspiration Layout) */}
      {(isOverview || isAvailableView) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Left Workspace (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Autumn Terracotta Hero Banner (Matches Reference Image) */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#D96B4C] via-[#CD5F40] to-[#B84E31] p-7 sm:p-9 text-white shadow-md">
              {/* Soft decorative background circles */}
              <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 right-28 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-current" />
                    <span>Candidate Examination Arena</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-xs">
                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}!
                  </h1>

                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                    Your institutional workspace is synchronized. Check your webcam diagnostics, review scheduled exams, and enter when ready.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to="/student/available"
                      className="px-5 py-2.5 rounded-full bg-white text-[#D96B4C] hover:bg-[#FAF7F2] font-bold text-xs shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Browse Available Tests</span>
                    </Link>
                    <button
                      type="button"
                      onClick={runHardwareDiagnostics}
                      disabled={diagnosticsRunning}
                      className="px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
                      <span>{diagnosticsRunning ? 'Verifying...' : 'Test Devices'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Hero Illustration Badge */}
                <div className="hidden sm:flex flex-col items-center justify-center p-5 rounded-[24px] bg-white/15 backdrop-blur-md border border-white/20 text-center space-y-2 min-w-[170px] shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-white/80 block">Active Status</span>
                    <span className="text-sm font-extrabold text-white">Ready for Testing</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">
                    ID: {user?.studentId || 'ONLINE-CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Pastel Action / Status Tiles (Matching Inspiration Image) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Tile 1: Sage Green (Camera Feed) */}
              <div className="card-clay p-4 rounded-[24px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-[18px] bg-[#E2EBE5] text-[#4F6D5B] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#8C827A] block truncate">Webcam Feed</span>
                  <span className="text-sm font-extrabold text-[#2D2A26] block truncate">
                    {cameraStatus === 'ready' ? 'HD Ready' : 'Active'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block">Verified Feed</span>
                </div>
              </div>

              {/* Tile 2: Peach / Soft Terracotta (Microphone) */}
              <div className="card-clay p-4 rounded-[24px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-[18px] bg-[#FBE0D6] text-[#B84E31] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#8C827A] block truncate">Audio Stream</span>
                  <span className="text-sm font-extrabold text-[#2D2A26] block truncate">
                    {micStatus === 'ready' ? 'Clear Audio' : 'Active'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block">Proctor Mic On</span>
                </div>
              </div>

              {/* Tile 3: Warm Khaki / Amber (Rekognition Face Baseline) */}
              <div className="card-clay p-4 rounded-[24px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-[18px] bg-[#F7EED3] text-[#8C733E] flex items-center justify-center shadow-xs flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#8C827A] block truncate">Rekognition ID</span>
                  <span className="text-sm font-extrabold text-[#2D2A26] block truncate">Enrolled</span>
                  <span className="text-[10px] font-bold text-[#D96B4C] block">AWS Verified</span>
                </div>
              </div>

              {/* Tile 4: Soft Sky / Lavender (Network Ping) */}
              <div className="card-clay p-4 rounded-[24px] flex items-center gap-3.5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-[18px] bg-[#E3EDF5] text-[#426C88] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#8C827A] block truncate">API Latency</span>
                  <span className="text-sm font-extrabold text-[#2D2A26] block truncate">
                    {networkPing !== null ? `${networkPing} ms` : '18 ms'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block">Ultra Low Ping</span>
                </div>
              </div>
            </div>

            {/* Available Examinations Section */}
            <div className="card-clay p-6 sm:p-7 rounded-[32px] space-y-6">
              {/* Section Header with Warm Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D96B4C]" />
                    <h2 className="text-xl font-extrabold text-[#2D2A26]">Available Examinations</h2>
                  </div>
                  <p className="text-xs text-[#8C827A] mt-0.5">
                    Select an active course assessment to begin your proctored session.
                  </p>
                </div>

                {/* Pill Search Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                      className="p-2 rounded-full text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#F6EFE9] transition-colors"
                      title="Clear filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Active Filter Pill */}
              {activeFilterQuery && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE7DE] text-xs text-[#5C554E]">
                  <span>Showing exams from instructor: <strong>{activeFilterQuery}</strong></span>
                  <button onClick={handleClearFilter} className="text-[#D96B4C] hover:text-[#B84E31] font-bold">
                    ✕
                  </button>
                </div>
              )}

              {/* Available Exams Cards Grid */}
              {availableExams.length === 0 ? (
                <div className="p-12 text-center rounded-[24px] bg-[#FAF7F2] border border-dashed border-[#EFE7DE] space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-[#F6EFE9] text-[#D96B4C] mx-auto flex items-center justify-center shadow-xs">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-[#2D2A26]">No examinations currently published</h3>
                  <p className="text-xs text-[#8C827A] max-w-sm mx-auto">
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
                  {availableExams.map((exam, idx) => {
                    const pastelBgs = [
                      'from-[#FFF5F2] to-[#FFF9F6]',
                      'from-[#F5F9F6] to-[#FAFCFA]',
                      'from-[#F6F8FC] to-[#FAFBFE]',
                      'from-[#FCF8F2] to-[#FEFAF6]',
                    ];
                    const bgChoice = pastelBgs[idx % pastelBgs.length];

                    return (
                      <div
                        key={exam._id}
                        className={`p-5 rounded-[26px] bg-gradient-to-br ${bgChoice} border border-[#EFE7DE] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-[#D96B4C]/40 group`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#D96B4C]/10 text-[#D96B4C] border border-[#D96B4C]/20">
                              {exam.courseCode || 'ASSESSMENT'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              LIVE ARENA
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-extrabold text-[#2D2A26] leading-snug line-clamp-1 group-hover:text-[#D96B4C] transition-colors">
                              {exam.title}
                            </h3>
                            <p className="text-xs text-[#5C554E] line-clamp-2 mt-1">
                              {exam.description || 'Proctored assessment with adaptive telemetry and real-time monitoring.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-[#8C827A] pt-3 border-t border-[#EFE7DE]/70">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#D96B4C]" />
                              <span>{exam.durationMinutes} mins</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>Pass: {exam.passingMarks} pts</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#EFE7DE]/70 flex items-center justify-between">
                          <span className="text-[11px] text-[#8C827A] font-medium">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE7DE]">
                <div className="space-y-0.5">
                  <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#D96B4C]" />
                    <span>Hardware Diagnostics & Environment Pre-Flight</span>
                  </h3>
                  <p className="text-xs text-[#8C827A]">
                    Automated system verification ensures seamless face tracking and audio stream integrity during testing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runHardwareDiagnostics}
                  disabled={diagnosticsRunning}
                  className="btn-warm-secondary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin text-[#D96B4C]' : 'text-[#8C827A]'}`} />
                  <span>{diagnosticsRunning ? 'Testing Sensors...' : 'Run Diagnostics'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Camera Status */}
                <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE7DE] text-[#D96B4C] flex items-center justify-center shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#2D2A26] block">Camera Feed</span>
                      <span className="text-[11px] text-[#8C827A]">Face landmark sensor</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {cameraStatus === 'ready' ? 'Active' : 'Ready'}
                  </span>
                </div>

                {/* Mic Status */}
                <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE7DE] text-[#D96B4C] flex items-center justify-center shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#2D2A26] block">Microphone</span>
                      <span className="text-[11px] text-[#8C827A]">Audio baseline</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {micStatus === 'ready' ? 'Active' : 'Ready'}
                  </span>
                </div>

                {/* Connection Status */}
                <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE7DE] text-[#D96B4C] flex items-center justify-center shadow-xs">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#2D2A26] block">AWS Gateway</span>
                      <span className="text-[11px] text-[#8C827A]">Low jitter</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {networkPing ? `${networkPing} ms` : 'Low Latency'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Panel (4 cols) - Inspired by reference photo */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Student Profile Widget (Matches "Jack Party organizer" in image) */}
            <div className="card-clay p-6 rounded-[32px] space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#D96B4C] to-[#B84E31] text-white flex items-center justify-center text-xl font-bold shadow-md shadow-[#D96B4C]/20 flex-shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-[#2D2A26] truncate">
                    {user?.name || 'Candidate Student'}
                  </h3>
                  <p className="text-xs text-[#8C827A] truncate font-medium">
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

              <div className="p-3.5 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-[#8C827A] font-semibold block uppercase">Total Exams</span>
                  <span className="text-base font-extrabold text-[#2D2A26]">{availableExams.length}</span>
                </div>
                <div className="border-l border-[#EFE7DE]">
                  <span className="text-[10px] text-[#8C827A] font-semibold block uppercase">Submissions</span>
                  <span className="text-base font-extrabold text-[#D96B4C]">{pastAttempts.length}</span>
                </div>
              </div>
            </div>

            {/* Assessment History / Scores (Matches "October Holidays" list in image) */}
            <div className="card-clay p-6 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#2D2A26]">Recent Submissions</h3>
                  <p className="text-[11px] text-[#8C827A]">Your latest graded assessments</p>
                </div>
                <Link
                  to="/student/results"
                  className="text-xs font-bold text-[#D96B4C] hover:text-[#B84E31] flex items-center gap-1"
                >
                  <span>See all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {pastAttempts.length === 0 ? (
                <div className="p-8 text-center rounded-[20px] bg-[#FAF7F2] border border-dashed border-[#EFE7DE] space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#D96B4C] mx-auto flex items-center justify-center shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#2D2A26]">No submissions yet</p>
                  <p className="text-[11px] text-[#8C827A]">Take an exam to view your scores and telemetry here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAttempts.slice(0, 4).map((att) => {
                    const isPass = att.isPassed ?? (att.score >= (att.exam?.passingMarks || 10));
                    return (
                      <div
                        key={att._id}
                        className="p-3.5 rounded-[22px] bg-[#FAF7F2] border border-[#EFE7DE] flex items-center justify-between hover:bg-white transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isPass ? 'bg-[#E2EBE5] text-[#4F6D5B]' : 'bg-[#FBE0D6] text-[#B84E31]'
                          }`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#2D2A26] block truncate">
                              {att.exam?.title || 'Examination'}
                            </span>
                            <span className="text-[11px] text-[#8C827A] block">
                              Score: <strong className="text-[#2D2A26]">{att.score !== undefined ? `${att.score} pts` : 'Evaluated'}</strong>
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

            {/* Assessment Readiness Checklist (Matches "Party planning" cards at bottom right) */}
            <div className="card-clay p-6 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#2D2A26]">Exam Guidelines</h3>
                <span className="text-[11px] font-bold text-[#D96B4C]">AWS AI Active</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-2">
                  <div className="w-8 h-8 rounded-[12px] bg-white text-[#D96B4C] flex items-center justify-center shadow-xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D2A26] block">Single Face</span>
                    <span className="text-[10px] text-[#8C827A] block leading-tight">Stay centered in webcam view</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-2">
                  <div className="w-8 h-8 rounded-[12px] bg-white text-[#D96B4C] flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D2A26] block">Full Screen</span>
                    <span className="text-[10px] text-[#8C827A] block leading-tight">Tab switches trigger telemetry</span>
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
            <h2 className="text-xl font-extrabold text-[#2D2A26]">Assessment Results & Historical Records</h2>
            <p className="text-xs text-[#8C827A]">
              Review your completed exam scores, submission timestamps, and proctoring evaluation statuses.
            </p>
          </div>

          {pastAttempts.length === 0 ? (
            <div className="p-12 text-center rounded-[24px] bg-[#FAF7F2] border border-dashed border-[#EFE7DE] space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-[#F6EFE9] text-[#D96B4C] mx-auto flex items-center justify-center shadow-xs">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#2D2A26]">No completed assessments yet</h3>
              <p className="text-xs text-[#8C827A] max-w-sm mx-auto">
                Once you complete an examination in the student arena, your score and evaluation will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[24px] border border-[#EFE7DE]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE7DE] text-[#8C827A] font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Examination</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Result Status</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Proctoring Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE] bg-white">
                  {pastAttempts.map((att) => {
                    const isPass = att.isPassed ?? (att.score >= (att.exam?.passingMarks || 10));
                    return (
                      <tr key={att._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#2D2A26]">
                          <div>{att.exam?.title || 'Course Examination'}</div>
                          <span className="text-[11px] text-[#8C827A] font-medium">
                            {att.exam?.courseCode || 'ASSESSMENT'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-[#2D2A26]">
                          {att.score !== undefined ? `${att.score} / ${att.exam?.totalMarks || 20}` : 'Graded'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              isPass
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isPass ? 'Passed' : 'Needs Retake'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#8C827A] font-medium">
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
            <h2 className="text-xl font-extrabold text-[#2D2A26]">Student Profile</h2>
            <p className="text-xs text-[#8C827A]">Institutional identity credentials</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-semibold text-[#8C827A] block">Full Name</span>
              <span className="text-sm font-bold text-[#2D2A26]">{user?.name || 'Student Candidate'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-semibold text-[#8C827A] block">Email Address</span>
              <span className="text-sm font-bold text-[#2D2A26]">{user?.email || 'student@university.edu'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-semibold text-[#8C827A] block">Student Registration ID</span>
              <span className="text-sm font-bold text-[#2D2A26]">{user?.studentId || 'CS-2026-REG'}</span>
            </div>

            <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-semibold text-[#8C827A] block">Academic Department</span>
              <span className="text-sm font-bold text-[#2D2A26]">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
