import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Users,
  ShieldAlert,
  Clock,
  Search,
  Filter,
  BarChart3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  PlusCircle,
  MinusCircle,
  Eye,
  Check,
  Briefcase,
  ExternalLink,
  Flame,
  Award,
  Layers,
  Database,
  Camera,
  Bell,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  apiGetTeacherExams,
  apiGetAllTeacherAttempts,
  apiCreateExam,
  apiTogglePublishExam,
  apiDeleteExam,
  apiGetExamAnalytics,
  apiGetAttemptProctoringEvents,
} from '../../services/api';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sub-route path detection
  const path = location.pathname;
  const isCreateExamView = path === '/teacher/create-exam';
  const isExamsView = path === '/teacher/exams';
  const isResultsView = path === '/teacher/results';
  const isReportsView = path === '/teacher/reports';
  const isProfileView = path === '/teacher/profile';
  const isOverview = !isCreateExamView && !isExamsView && !isResultsView && !isReportsView && !isProfileView;

  // Proctoring Report Audit Modal State
  const [selectedAuditAttempt, setSelectedAuditAttempt] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Creation form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [newExamForm, setNewExamForm] = useState({
    title: '',
    courseCode: '',
    creatorEmail: user?.email || 'teacher@university.edu',
    assignedStudentEmails: '',
    description: '',
    durationMinutes: 45,
    passingMarks: 10,
    questions: [
      {
        text: 'What primary role does an Operating System kernel perform?',
        options: [
          'Direct hardware abstraction and resource scheduling',
          'Rendering graphic web pages in browser engines',
          'Formatting text documents into PDF files',
          'Managing electrical power to wall sockets',
        ],
        correctOptionIndex: 0,
        marks: 5,
      },
    ],
  });

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [examsRes, attemptsRes] = await Promise.all([
        apiGetTeacherExams().catch(() => ({ data: { exams: [] } })),
        apiGetAllTeacherAttempts().catch(() => ({ data: { attempts: [] } })),
      ]);

      if (examsRes.data?.exams) {
        setExams(examsRes.data.exams);
      }
      if (attemptsRes.data?.attempts) {
        setAttempts(attemptsRes.data.attempts);
      }
    } catch (err) {
      setError(err.message || 'Unable to load teacher workspace data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Publish / Draft Toggle
  const handleTogglePublish = async (examId, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await apiTogglePublishExam(examId, nextStatus);
      if (res.success) {
        setExams((prev) =>
          prev.map((e) => (e._id === examId ? { ...e, status: nextStatus } : e))
        );
      }
    } catch (err) {
      console.error('Failed to update exam status:', err);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this examination?')) return;
    try {
      const res = await apiDeleteExam(examId);
      if (res.success) {
        setExams((prev) => prev.filter((e) => e._id !== examId));
      }
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  // Open Proctoring Audit Modal
  const handleOpenAuditModal = async (attemptItem) => {
    setSelectedAuditAttempt(attemptItem);
    setIsAuditLoading(true);

    // Initialize with existing proctoring events on the attempt item so events (such as mobile device detections) are immediately available
    const initialEvents = Array.isArray(attemptItem.proctoringEvents) && attemptItem.proctoringEvents.length > 0
      ? attemptItem.proctoringEvents
      : (Array.isArray(attemptItem.events) ? attemptItem.events : []);
    setAuditEvents(initialEvents);

    try {
      const res = await apiGetAttemptProctoringEvents(attemptItem._id);
      const fetchedEvents = res.data?.events || [];
      if (fetchedEvents.length > 0) {
        // Merge fetched and initial events without dropping any recorded telemetry
        const seen = new Set();
        const merged = [];
        [...fetchedEvents, ...initialEvents].forEach((ev) => {
          const type = ev.eventType || ev.type || 'EVENT';
          const time = new Date(ev.timestamp || ev.time || 0).getTime();
          const key = `${type}_${Math.floor(time / 1000)}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(ev);
          }
        });
        merged.sort((a, b) => new Date(a.timestamp || a.time || 0) - new Date(b.timestamp || b.time || 0));
        setAuditEvents(merged);
      }
    } catch (err) {
      console.error('Failed to load telemetry events:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Exam authoring question management
  const handleAddQuestion = () => {
    setNewExamForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          marks: 5,
        },
      ],
    }));
  };

  const handleRemoveQuestion = (idx) => {
    if (newExamForm.questions.length <= 1) return;
    setNewExamForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...newExamForm.questions];
    updated[idx][field] = value;
    setNewExamForm((prev) => ({ ...prev, questions: updated }));
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...newExamForm.questions];
    updated[qIdx].options[optIdx] = val;
    setNewExamForm((prev) => ({ ...prev, questions: updated }));
  };

  // Submit Exam Creation
  const handleCreateExamSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormSuccess('');

    try {
      const res = await apiCreateExam(newExamForm);
      if (res.success) {
        setFormSuccess('Examination created and published successfully!');
        setNewExamForm({
          title: '',
          courseCode: '',
          creatorEmail: user?.email || 'teacher@university.edu',
          assignedStudentEmails: '',
          description: '',
          durationMinutes: 45,
          passingMarks: 10,
          questions: [
            {
              text: '',
              options: ['', '', '', ''],
              correctOptionIndex: 0,
              marks: 5,
            },
          ],
        });
        await fetchTeacherData();
        setTimeout(() => {
          navigate('/teacher/exams');
        }, 1200);
      }
    } catch (err) {
      console.error('Create exam error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculated Stats
  const totalExams = exams.length;
  const activeExams = exams.filter((e) => e.status === 'published').length;
  const totalAttempts = attempts.length;
  const reviewFlagsCount = attempts.filter((a) => (a.riskScore || 0) >= 30).length;

  return (
    <div className="space-y-6">
      {/* Top Header Row with Terracotta Aesthetics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEEE7] border border-[#F5D7CD] text-[#D96B4C] text-[11px] font-bold mb-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instructor Portal · AWS Serverless AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A26]">
            Faculty Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[#8C827A] mt-0.5">
            Manage course examinations, review live candidate telemetry, and inspect AWS Rekognition evidence.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTeacherData}
            disabled={isLoading}
            className="btn-warm-secondary text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D96B4C]' : 'text-[#8C827A]'}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/teacher/create-exam"
            className="btn-terracotta text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs Styled as Warm Pills */}
      <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-2 overflow-x-auto text-xs font-semibold scrollbar-none">
        <Link
          to="/teacher"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isOverview
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/teacher/exams"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isExamsView
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          My Exams ({exams.length})
        </Link>
        <Link
          to="/teacher/create-exam"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isCreateExamView
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          Create Exam
        </Link>
        <Link
          to="/teacher/results"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isResultsView
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          Student Results ({attempts.length})
        </Link>
        <Link
          to="/teacher/reports"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isReportsView
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          Proctoring Reports ({reviewFlagsCount} flagged)
        </Link>
        <Link
          to="/teacher/profile"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isProfileView
              ? 'bg-[#D96B4C] text-white shadow-md shadow-[#D96B4C]/25 font-bold scale-[1.02]'
              : 'bg-white/80 text-[#5C554E] hover:bg-white hover:text-[#2D2A26] border border-[#EFE7DE]'
          }`}
        >
          Faculty Profile
        </Link>
      </div>

      {/* OVERVIEW TAB: Inspired by user's reference with Hero Banner, pastel status pills, and right side widget */}
      {isOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Area (8 Columns on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* HERO BANNER: Inspired by Autumn Day card */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#E07253] via-[#D96B4C] to-[#C55C3E] text-white p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-[#D96B4C]/20">
              {/* Subtle decorative background circles */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-black/10 blur-xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time AI Proctoring Arena Live</span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Adaptive AI Proctoring Workspace
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 max-w-xl font-normal leading-relaxed">
                    Hello {user?.name || 'Instructor'}! Monitoring {attempts.length} candidate attempts across {exams.length} active course assessments with non-punitive multi-signal risk calibration.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    to="/teacher/create-exam"
                    className="px-5 py-2.5 rounded-full bg-white text-[#D96B4C] hover:bg-[#FDF1ED] text-xs font-bold shadow-md transition-all hover:scale-105 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Author New Assessment</span>
                  </Link>

                  <Link
                    to="/teacher/reports"
                    className="px-5 py-2.5 rounded-full bg-black/20 hover:bg-black/30 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all inline-flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>View Telemetry Audit Queue ({reviewFlagsCount})</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 4 PASTEL TILES: Inspired by the 4 pastel icons on the right of the inspiration card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#EAF3ED] border border-[#D1E6D8] space-y-1.5 transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#2C6246] flex items-center justify-center shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#2C6246]/70">AWS DynamoDB</div>
                <div className="text-base font-extrabold text-[#2C6246]">ACTIVE</div>
                <div className="text-[10px] text-[#2C6246]/80 font-medium">5 Free Tier Tables</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FDF0EB] border border-[#F6D7CC] space-y-1.5 transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#D96B4C] flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#D96B4C]/70">AWS Rekognition</div>
                <div className="text-base font-extrabold text-[#D96B4C]">99.2%</div>
                <div className="text-[10px] text-[#D96B4C]/80 font-medium">Face & Object Vision</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FDF7E7] border border-[#F7E7BD] space-y-1.5 transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#B58525] flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#B58525]/70">Amazon SNS</div>
                <div className="text-base font-extrabold text-[#B58525]">Alerts Live</div>
                <div className="text-[10px] text-[#B58525]/80 font-medium">High Risk Notification</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#EEF5FB] border border-[#D5E6F6] space-y-1.5 transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#2C679B] flex items-center justify-center shadow-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#2C679B]/70">Risk Engine</div>
                <div className="text-base font-extrabold text-[#2C679B]">Adaptive</div>
                <div className="text-[10px] text-[#2C679B]/80 font-medium">Non-Punitive HUD</div>
              </div>
            </div>

            {/* Course Examinations Grid (Matching the bottom "Day Schedule" cards from the inspiration photo) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2D2A26]">Course Examinations</h3>
                  <p className="text-xs text-[#8C827A]">Active question sets and published candidate rosters.</p>
                </div>
                <Link to="/teacher/exams" className="text-xs font-bold text-[#D96B4C] hover:underline flex items-center gap-1">
                  <span>View all ({exams.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {exams.length === 0 ? (
                <div className="card-clay p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FCEEE7] text-[#D96B4C] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#8C827A]">No examinations created yet. Click below to author your first assessment.</p>
                  <Link to="/teacher/create-exam" className="btn-terracotta text-xs">
                    <Plus className="w-4 h-4" />
                    <span>Create Examination</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {exams.slice(0, 4).map((exam, idx) => {
                    // Soft color variations matching the warm clay cards in the photo
                    const cardGradients = [
                      'from-[#FDF3EE] to-[#FAF0E8] border-[#F6D7CC]',
                      'from-[#EEF5FB] to-[#E5EFF8] border-[#D5E6F6]',
                      'from-[#EAF3ED] to-[#E2ECE5] border-[#D1E6D8]',
                      'from-[#FDF7E7] to-[#FAF1D9] border-[#F7E7BD]',
                    ];
                    const grad = cardGradients[idx % cardGradients.length];

                    return (
                      <div
                        key={exam._id}
                        className={`rounded-[24px] bg-gradient-to-br ${grad} border p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all hover:-translate-y-1 hover:shadow-md`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#D96B4C] text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-[#EFE7DE]">
                              {exam.courseCode || 'GENERAL'}
                            </span>
                            <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-[#2D2A26] line-clamp-1">{exam.title}</h4>
                            <p className="text-xs text-[#5C554E] line-clamp-2 mt-0.5">
                              {exam.description || 'Verified automated proctoring enabled for this evaluation.'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#5C554E] pt-2 border-t border-black/5 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#D96B4C]" />
                              <span>{exam.durationMinutes} mins</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-[#D96B4C]" />
                              <span>{exam.questions?.length || 0} Items</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-black/5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam._id, exam.status)}
                            className="text-xs font-bold text-[#D96B4C] hover:underline"
                          >
                            {exam.status === 'published' ? 'Unpublish' : 'Publish to Students'}
                          </button>

                          <Link
                            to="/teacher/exams"
                            className="p-1.5 rounded-xl bg-white text-[#2D2A26] hover:bg-[#D96B4C] hover:text-white transition-colors shadow-xs"
                            title="View Exam Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Inspired by Jack's Profile & October Holidays */}
          <div className="lg:col-span-4 space-y-6">
            {/* Instructor Profile Card Widget */}
            <div className="rounded-[28px] bg-white border border-[#EFE7DE] p-6 shadow-sm space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-[#FCEEE7] text-[#D96B4C] flex items-center justify-center font-extrabold text-2xl border-2 border-[#F5D7CD] shadow-sm">
                  {(user?.name || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <h3 className="text-base font-extrabold text-[#2D2A26] truncate">
                    {user?.name || 'Faculty Proctor'}
                  </h3>
                  <p className="text-xs font-semibold text-[#D96B4C]">Lead Proctor & Examiner</p>
                  <p className="text-[11px] text-[#8C827A] truncate">{user?.department || 'Department of Computing'}</p>
                </div>
              </div>

              <Link
                to="/teacher/profile"
                className="w-full btn-terracotta text-xs"
              >
                <span>View Full Faculty Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Candidate Telemetry Watch Widget (Matching October Holidays list in the inspiration image!) */}
            <div className="rounded-[28px] bg-white border border-[#EFE7DE] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#2D2A26]">Telemetry Watch</h3>
                  <p className="text-[11px] text-[#8C827A]">Recent candidate risk audits</p>
                </div>
                <Link to="/teacher/reports" className="text-xs font-bold text-[#D96B4C] hover:underline">
                  All ({attempts.length})
                </Link>
              </div>

              {attempts.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C827A]">
                  No candidate submissions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.slice(0, 5).map((att) => {
                    const riskVal = att.riskScore || 0;
                    const isHigh = riskVal >= 50;
                    const isMed = riskVal >= 25 && riskVal < 50;

                    return (
                      <div
                        key={att._id}
                        className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] flex items-center justify-between gap-3 transition-colors hover:bg-white"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                            isHigh
                              ? 'bg-rose-100 text-rose-700'
                              : isMed
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isHigh ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#2D2A26] truncate">
                              {att.studentName || att.student?.name || 'Candidate'}
                            </p>
                            <p className="text-[11px] font-semibold text-[#8C827A]">
                              <span className={isHigh ? 'text-rose-600 font-bold' : isMed ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                                {riskVal}%
                              </span>{' '}
                              Calibrated Risk
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAuditModal(att)}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#D96B4C] hover:text-white text-[#2D2A26] border border-[#EFE7DE] shadow-xs transition-all shrink-0 cursor-pointer"
                        >
                          Audit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY EXAMS TAB */}
      {isExamsView && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2D2A26]">All Authored Examinations</h2>
              <p className="text-xs text-[#8C827A]">Manage publication status, view analytics, and remove examinations.</p>
            </div>
            <Link
              to="/teacher/create-exam"
              className="btn-terracotta text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="card-clay p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#FCEEE7] text-[#D96B4C] border border-[#F5D7CD]">
                      {exam.courseCode || 'COURSE'}
                    </span>
                    <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#2D2A26] line-clamp-1">{exam.title}</h3>
                    <p className="text-xs text-[#5C554E] line-clamp-2 mt-1">{exam.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#5C554E] pt-3 border-t border-[#EFE7DE] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D96B4C]" />
                      <span>{exam.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#D96B4C]" />
                      <span>{exam.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE7DE] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(exam._id, exam.status)}
                    className="text-xs font-bold text-[#D96B4C] hover:underline"
                  >
                    {exam.status === 'published' ? 'Unpublish' : 'Publish to Students'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteExam(exam._id)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE EXAM TAB */}
      {isCreateExamView && (
        <div className="card-clay p-6 sm:p-8 max-w-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#2D2A26]">Create New Examination</h2>
            <p className="text-xs text-[#8C827A]">Fill in examination parameters and author question items.</p>
          </div>

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateExamSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A26]">Examination Title</label>
                <input
                  type="text"
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  placeholder="e.g. Distributed Computing & Cloud Systems"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EFE7DE] bg-[#FAF7F2] text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A26]">Course Code</label>
                <input
                  type="text"
                  value={newExamForm.courseCode}
                  onChange={(e) => setNewExamForm({ ...newExamForm, courseCode: e.target.value })}
                  placeholder="e.g. CS-402"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EFE7DE] bg-[#FAF7F2] text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C] focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A26]">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={newExamForm.durationMinutes}
                  onChange={(e) => setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EFE7DE] bg-[#FAF7F2] text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C] focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2D2A26]">Passing Marks</label>
                <input
                  type="number"
                  min="1"
                  value={newExamForm.passingMarks}
                  onChange={(e) => setNewExamForm({ ...newExamForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EFE7DE] bg-[#FAF7F2] text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C] focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2D2A26]">Description</label>
              <textarea
                value={newExamForm.description}
                onChange={(e) => setNewExamForm({ ...newExamForm, description: e.target.value })}
                placeholder="Brief summary of examination topics and competencies."
                rows="2"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EFE7DE] bg-[#FAF7F2] text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C] focus:bg-white"
              />
            </div>

            {/* Questions Authoring Section */}
            <div className="space-y-4 pt-4 border-t border-[#EFE7DE]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2D2A26]">Questions ({newExamForm.questions.length})</h3>
                  <p className="text-[11px] text-[#8C827A]">Add multiple-choice items and mark the correct option.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-warm-secondary text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D96B4C]" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {newExamForm.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#2D2A26]">Item #{qIdx + 1}</span>
                      {newExamForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIdx, 'text', e.target.value)}
                      placeholder="Enter question text here..."
                      className="w-full px-4 py-2 rounded-xl border border-[#EFE7DE] bg-white text-xs text-[#2D2A26] focus:outline-none focus:border-[#D96B4C]"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-[#EFE7DE]">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                            className="text-[#D96B4C] focus:ring-[#D96B4C] w-4 h-4 cursor-pointer"
                            title="Select as correct option"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="w-full px-2 py-1 text-xs text-[#2D2A26] focus:outline-none"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EFE7DE] flex justify-end gap-3">
              <Link
                to="/teacher/exams"
                className="btn-warm-secondary text-xs"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-terracotta text-xs"
              >
                {isSubmitting ? 'Saving Examination...' : 'Publish Examination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STUDENT RESULTS TAB */}
      {isResultsView && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#2D2A26]">Candidate Results Overview</h2>
            <p className="text-xs text-[#8C827A]">All completed student examination submissions across your course roster.</p>
          </div>

          {attempts.length === 0 ? (
            <div className="card-clay p-12 text-center space-y-2">
              <p className="text-xs text-[#8C827A]">No candidate submissions recorded yet.</p>
            </div>
          ) : (
            <div className="card-clay overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE7DE] text-[#8C827A] font-bold">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Passing Result</th>
                    <th className="py-3 px-4">Proctoring Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE]">
                  {attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#2D2A26]">
                        <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                        <span className="text-[11px] text-[#8C827A] font-normal">{att.student?.email || 'candidate@university.edu'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2A26] font-medium">
                        {att.exam?.title || 'Examination'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#2D2A26]">
                        {att.score} / {att.exam?.totalMarks || 20}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          att.isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {att.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={att.riskLevel || 'LOW'} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROCTORING REPORTS TAB */}
      {isReportsView && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#2D2A26]">Proctoring Reports & Risk Review</h2>
            <p className="text-xs text-[#8C827A]">
              Objective telemetry logs and calibrated risk indicators to support manual instructor reviews.
            </p>
          </div>

          {attempts.length === 0 ? (
            <div className="card-clay p-12 text-center space-y-2">
              <p className="text-xs text-[#8C827A]">No proctoring reports available yet.</p>
            </div>
          ) : (
            <div className="card-clay overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE7DE] text-[#8C827A] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Student & Exam</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Telemetry Violations</th>
                    <th className="py-3.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE]">
                  {attempts.map((att) => {
                    const riskVal = att.riskScore || 0;
                    const tabSwitches = att.tabSwitchCount || 0;
                    const multiFaces = att.multiFaceCount || att.multipleFaceCount || 0;
                    const phones = att.phoneDetectedCount || att.phoneDetectionCount || 0;
                    const audioAnomalies = att.audioAnomalyCount || (att.proctoringEvents || []).filter((e) => (e.eventType || e.type) === 'AUDIO_ANOMALY').length;

                    return (
                      <tr key={att._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#2D2A26]">
                          <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                          <span className="text-[11px] text-[#8C827A] font-normal">{att.exam?.title || 'Exam'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-[#2D2A26]">
                          <span className={riskVal >= 50 ? 'text-rose-600' : riskVal >= 25 ? 'text-amber-600' : 'text-emerald-600'}>
                            {riskVal}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={riskVal >= 50 ? 'HIGH' : riskVal >= 25 ? 'MEDIUM' : 'LOW'} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-[#5C554E] font-medium">
                          <span>Tab Switches: {tabSwitches}</span>
                          {multiFaces > 0 && <span className="ml-2 font-bold text-amber-700">• Multiple Faces: {multiFaces}</span>}
                          {phones > 0 && <span className="ml-2 font-bold text-rose-700">• Mobile Device: {phones}</span>}
                          {audioAnomalies > 0 && <span className="ml-2 font-bold text-amber-600">• Audio Anomaly: {audioAnomalies}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAuditModal(att)}
                            className="btn-warm-secondary text-xs cursor-pointer py-1.5 px-3.5"
                          >
                            Audit Telemetry
                          </button>
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

      {/* PROFILE TAB */}
      {isProfileView && (
        <div className="card-clay p-6 sm:p-8 max-w-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#2D2A26]">Instructor Profile</h2>
            <p className="text-xs text-[#8C827A]">Faculty credential & institutional details</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-bold text-[#8C827A] block">Faculty Name</span>
              <span className="text-sm font-extrabold text-[#2D2A26]">{user?.name || 'Faculty Member'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-bold text-[#8C827A] block">Email Address</span>
              <span className="text-sm font-extrabold text-[#2D2A26]">{user?.email || 'teacher@university.edu'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] space-y-1">
              <span className="text-[11px] font-bold text-[#8C827A] block">Department</span>
              <span className="text-sm font-extrabold text-[#2D2A26]">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Event Audit Drawer/Modal Styled with Warm Claymorphism */}
      {selectedAuditAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="rounded-[32px] bg-white border border-[#EFE7DE] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#2D2A26]">
                  Telemetry Audit: {selectedAuditAttempt.student?.name || selectedAuditAttempt.studentName || 'Candidate'}
                </h3>
                <p className="text-xs text-[#8C827A]">
                  {selectedAuditAttempt.exam?.title || 'Exam Session'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditAttempt(null)}
                className="p-2 rounded-full text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#FAF7F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DE] grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#8C827A] font-bold block">Calibrated Risk Score</span>
                <span className={`text-base font-extrabold ${
                  (selectedAuditAttempt.riskScore || 0) >= 50
                    ? 'text-rose-600'
                    : (selectedAuditAttempt.riskScore || 0) >= 25
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {selectedAuditAttempt.riskScore || 0}%
                </span>
              </div>
              <div>
                <span className="text-[#8C827A] font-bold block">Assessment Status</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {selectedAuditAttempt.isPassed ? 'Passed' : 'Completed'}
                </span>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#2D2A26] uppercase tracking-wider">Telemetry Incident Log</h4>

              {isAuditLoading ? (
                <div className="py-8 text-center text-xs text-[#8C827A]">Loading timeline events...</div>
              ) : auditEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C827A] bg-[#FAF7F2] rounded-2xl border border-[#EFE7DE]">
                  No suspicious violations recorded during this examination session.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {auditEvents.map((evt, idx) => {
                    const eventName = evt.eventType || evt.type || 'Telemetry Signal';
                    const eventDesc = evt.details || evt.description || 'Verified proctoring signal';
                    const severity = evt.severity || (evt.riskScoreImpact > 15 ? 'critical' : 'warning');
                    
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          severity === 'critical'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                            : severity === 'warning'
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                            : 'bg-[#FAF7F2] border-[#EFE7DE] text-[#2D2A26]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              severity === 'critical' ? 'bg-rose-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <span className="font-extrabold">{eventName}</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#8C827A]">
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recorded'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C554E] leading-relaxed">{eventDesc}</p>
                        {(evt.evidenceUrl || evt.presignedSnapshotUrl || evt.snapshotUrl) && (
                          <div className="pt-1.5">
                            <a
                              href={evt.evidenceUrl || evt.presignedSnapshotUrl || evt.snapshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-warm-secondary text-[10px] py-1 px-3 inline-flex items-center gap-1.5"
                            >
                              <span>View Captured Frame Evidence (S3)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EFE7DE] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditAttempt(null)}
                className="btn-terracotta text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
