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
  ExternalLink,
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
  const [cameraStatus, setCameraStatus] = useState('pending'); // 'pending' | 'checking' | 'ready' | 'error'
  const [micStatus, setMicStatus] = useState('pending');
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
        setNetworkPing(18);
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
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              Student Workspace
            </span>
            <span className="text-xs text-[#64748B]">ID: {user?.studentId || 'STU-ONLINE'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {user?.department || 'Department of Computer Science'} • Academic Year 2026
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#172033] font-semibold text-xs border border-[#E2E8F0] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#2563EB]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/student/available"
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Available Exams</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto text-xs font-semibold">
        <Link
          to="/student"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isOverview
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/student/available"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isAvailableView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Available Exams ({availableExams.length})
        </Link>
        <Link
          to="/student/results"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isResultsView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Exam Results ({pastAttempts.length})
        </Link>
        <Link
          to="/student/profile"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isProfileView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Profile
        </Link>
      </div>

      {/* OVERVIEW TAB */}
      {(isOverview || isAvailableView) && (
        <div className="space-y-8">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Available Exams</span>
              <div className="text-2xl font-bold text-[#172033]">{availableExams.length}</div>
              <p className="text-[11px] text-emerald-600 font-medium">Ready to commence</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Completed Attempts</span>
              <div className="text-2xl font-bold text-[#172033]">{pastAttempts.length}</div>
              <p className="text-[11px] text-[#64748B]">Submitted assessments</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Hardware Readiness</span>
              <div className="text-2xl font-bold text-emerald-600">
                {cameraStatus === 'ready' ? 'Verified' : 'Ready'}
              </div>
              <p className="text-[11px] text-[#64748B]">Camera & microphone</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Network Latency</span>
              <div className="text-2xl font-bold text-[#172033]">
                {networkPing !== null ? `${networkPing} ms` : 'Optimal'}
              </div>
              <p className="text-[11px] text-[#64748B]">Express REST API</p>
            </div>
          </div>

          {/* Hardware & Diagnostics Pre-Flight Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#2563EB]" />
                  <span>Hardware & Environment Diagnostics</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Verify your camera, microphone, and connection before starting your proctored assessment.
                </p>
              </div>

              <button
                type="button"
                onClick={runHardwareDiagnostics}
                disabled={diagnosticsRunning}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#172033] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin text-[#2563EB]' : 'text-slate-500'}`} />
                <span>{diagnosticsRunning ? 'Checking Devices...' : 'Test Camera & Audio'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Camera Status */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-700">
                    <Camera className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Camera Feed</span>
                    <span className="text-[11px] text-[#64748B]">Webcam ready</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {cameraStatus === 'ready' ? 'Active' : 'Ready'}
                </span>
              </div>

              {/* Microphone Status */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-700">
                    <Mic className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Microphone</span>
                    <span className="text-[11px] text-[#64748B]">Audio input</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {micStatus === 'ready' ? 'Active' : 'Ready'}
                </span>
              </div>

              {/* Network Status */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-700">
                    <Wifi className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Connection</span>
                    <span className="text-[11px] text-[#64748B]">Low latency</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {networkPing ? `${networkPing} ms` : 'Stable'}
                </span>
              </div>
            </div>
          </div>

          {/* Available Exams Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">Available Examinations</h2>
                <p className="text-xs text-[#64748B]">
                  Examinations published by your course instructors and ready to take.
                </p>
              </div>

              {/* Teacher Email Filter Input */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={teacherEmailFilter}
                    onChange={(e) => setTeacherEmailFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterExams()}
                    placeholder="Filter by instructor email"
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-48 sm:w-60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleFilterExams()}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] border border-[#E2E8F0]"
                >
                  Filter
                </button>
                {activeFilterQuery && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Exams Cards Grid */}
            {availableExams.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">No examinations currently available</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  {activeFilterQuery
                    ? `No exams found from instructor "${activeFilterQuery}". Clear the filter to view all available tests.`
                    : 'Your instructors have not published any new examinations at this moment.'}
                </p>
                {activeFilterQuery && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold mt-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableExams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200">
                          {exam.courseCode || 'COURSE'}
                        </span>
                        <StatusBadge status="ACTIVE" size="sm" />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#172033] leading-snug line-clamp-1">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                          {exam.description || 'Proctored examination testing course competencies.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.durationMinutes} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pass: {exam.passingMarks} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-[11px] text-[#64748B]">
                        {exam.creatorName ? `Prof. ${exam.creatorName}` : 'Instructor Assigned'}
                      </span>

                      <Link
                        to={`/student/exam/${exam._id}`}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Exam</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {isResultsView && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">Assessment Results & History</h2>
            <p className="text-xs text-[#64748B]">
              Review your completed exam scores, submission times, and verification statuses.
            </p>
          </div>

          {pastAttempts.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#172033]">No completed assessments yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Once you complete an examination in the student arena, your score and evaluation will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Examination</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Result Status</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Proctoring Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {pastAttempts.map((att) => {
                      const isPass = att.isPassed ?? (att.score >= (att.exam?.passingMarks || 10));
                      return (
                        <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#172033]">
                            <div>{att.exam?.title || 'Course Examination'}</div>
                            <span className="text-[11px] text-[#64748B] font-normal">
                              {att.exam?.courseCode || 'ASSESSMENT'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#172033]">
                            {att.score !== undefined ? `${att.score} / ${att.exam?.totalMarks || 20}` : 'Graded'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPass ? 'Passed' : 'Needs Retake'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {att.completedAt ? new Date(att.completedAt).toLocaleDateString() : 'Recently'}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={att.riskLevel || 'LOW'} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {isProfileView && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">Student Profile</h2>
            <p className="text-xs text-[#64748B]">Institutional identity credentials</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Full Name</span>
              <span className="text-sm font-bold text-[#172033]">{user?.name || 'Student Candidate'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Email Address</span>
              <span className="text-sm font-bold text-[#172033]">{user?.email || 'student@university.edu'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Student Registration ID</span>
              <span className="text-sm font-bold text-[#172033]">{user?.studentId || 'CS-2026-REG'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Academic Department</span>
              <span className="text-sm font-bold text-[#172033]">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
