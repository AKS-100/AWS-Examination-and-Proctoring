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
  Loader2,
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
  apiGetS3PresignedViewUrl,
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
  const [openingEvidenceId, setOpeningEvidenceId] = useState(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState(null);

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
    setExpandedPreviewId(null);
    setOpeningEvidenceId(null);

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

  const handleViewEvidence = async (evt, evtIndex) => {
    const rawUrl = evt.presignedSnapshotUrl || evt.evidenceUrl || evt.snapshotUrl;
    const key = evt.evidenceS3Key || rawUrl;
    if (!key && !rawUrl) return;

    // If the URL already contains an active AWS signature, open directly
    if (rawUrl && (rawUrl.includes('X-Amz-Signature=') || rawUrl.includes('Signature='))) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise, request an on-demand presigned URL from the backend
    setOpeningEvidenceId(evtIndex);
    try {
      const res = await apiGetS3PresignedViewUrl(key);
      const downloadUrl = res.data?.data?.downloadUrl || res.data?.downloadUrl;
      if (downloadUrl) {
        setAuditEvents((prev) =>
          prev.map((e, idx) =>
            idx === evtIndex
              ? { ...e, presignedSnapshotUrl: downloadUrl, evidenceUrl: downloadUrl, snapshotUrl: downloadUrl }
              : e
          )
        );
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Unable to generate secure S3 evidence link.');
      }
    } catch (err) {
      console.error('Failed to get presigned evidence link:', err);
      alert('Failed to load secure evidence frame from Amazon S3.');
    } finally {
      setOpeningEvidenceId(null);
    }
  };

  const handleTogglePreview = async (evt, evtIndex) => {
    if (expandedPreviewId === evtIndex) {
      setExpandedPreviewId(null);
      return;
    }

    setExpandedPreviewId(evtIndex);
    const curUrl = evt.presignedSnapshotUrl || evt.evidenceUrl || evt.snapshotUrl;
    if (!curUrl || !curUrl.includes('X-Amz-Signature=')) {
      try {
        const key = evt.evidenceS3Key || curUrl;
        const res = await apiGetS3PresignedViewUrl(key);
        const downloadUrl = res.data?.data?.downloadUrl || res.data?.downloadUrl;
        if (downloadUrl) {
          setAuditEvents((prev) =>
            prev.map((e, idx) =>
              idx === evtIndex
                ? { ...e, presignedSnapshotUrl: downloadUrl, evidenceUrl: downloadUrl, snapshotUrl: downloadUrl }
                : e
            )
          );
        }
      } catch (err) {
        console.error('Failed to preview evidence image:', err);
      }
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
      {/* Top Header Row with Luxury Monochrome Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold mb-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Instructor Portal · AWS Serverless AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Faculty Workspace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage course examinations, review live candidate telemetry, and inspect AWS Rekognition evidence.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTeacherData}
            disabled={isLoading}
            className="btn-warm-secondary text-xs cursor-pointer py-2 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-900 dark:text-white' : 'text-zinc-500'}`} />
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

      {/* Navigation Sub-Tabs in High-Contrast Luxury Pill Style (Fixes Dark Mode Readability) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-x-auto text-xs font-semibold scrollbar-none">
        <Link
          to="/teacher"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isOverview
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/teacher/exams"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isExamsView
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          My Exams ({exams.length})
        </Link>
        <Link
          to="/teacher/create-exam"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isCreateExamView
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          Create Exam
        </Link>
        <Link
          to="/teacher/results"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isResultsView
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          Student Results ({attempts.length})
        </Link>
        <Link
          to="/teacher/reports"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isReportsView
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          Proctoring Reports ({reviewFlagsCount} flagged)
        </Link>
        <Link
          to="/teacher/profile"
          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
            isProfileView
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs border border-zinc-200/80 dark:border-zinc-700/60'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          Faculty Profile
        </Link>
      </div>

      {/* OVERVIEW TAB */}
      {isOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Area (8 Columns on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Editorial Luxury Hero Banner */}
            <div className="rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white p-7 sm:p-9 relative overflow-hidden border border-zinc-800 shadow-xl">
              {/* Subtle ambient lighting */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-zinc-700/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 left-1/4 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time AI Proctoring Arena Live</span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Adaptive AI Proctoring Workspace
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-normal leading-relaxed">
                    Hello {user?.name || 'Instructor'}! Monitoring {attempts.length} candidate attempts across {exams.length} active course assessments with non-punitive multi-signal risk calibration.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    to="/teacher/create-exam"
                    className="px-5 py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold shadow-md transition-all hover:scale-105 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Author New Assessment</span>
                  </Link>

                  <Link
                    to="/teacher/reports"
                    className="px-5 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-700 transition-all inline-flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>View Telemetry Audit Queue ({reviewFlagsCount})</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 4 Sleek Status Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 transition-all hover:-translate-y-0.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">AWS DynamoDB</div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">ACTIVE</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">5 Free Tier Tables</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 transition-all hover:-translate-y-0.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">AWS Rekognition</div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">99.2%</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Face & Object Vision</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 transition-all hover:-translate-y-0.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">Amazon SNS</div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Alerts Live</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">High Risk Notification</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 transition-all hover:-translate-y-0.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">Risk Engine</div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Adaptive</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Non-Punitive HUD</div>
              </div>
            </div>

            {/* Course Examinations Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Course Examinations</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active question sets and published candidate rosters.</p>
                </div>
                <Link to="/teacher/exams" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1">
                  <span>View all ({exams.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {exams.length === 0 ? (
                <div className="card-clay p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No examinations created yet. Click below to author your first assessment.</p>
                  <Link to="/teacher/create-exam" className="btn-terracotta text-xs">
                    <Plus className="w-4 h-4" />
                    <span>Create Examination</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {exams.slice(0, 4).map((exam) => {
                    return (
                      <div
                        key={exam._id}
                        className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-extrabold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                              {exam.courseCode || 'GENERAL'}
                            </span>
                            <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{exam.title}</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                              {exam.description || 'Verified automated proctoring enabled for this evaluation.'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{exam.durationMinutes} mins</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{exam.questions?.length || 0} Items</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam._id, exam.status)}
                            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                          >
                            {exam.status === 'published' ? 'Unpublish' : 'Publish to Students'}
                          </button>

                          <Link
                            to="/teacher/exams"
                            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
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

          {/* Right Column: Instructor Profile & Telemetry Watch */}
          <div className="lg:col-span-4 space-y-6">
            {/* Instructor Profile Card Widget */}
            <div className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-extrabold text-2xl shadow-sm border border-zinc-700/60 flex-shrink-0">
                  {(user?.name || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || 'Faculty Proctor'}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Lead Proctor & Examiner</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user?.department || 'Department of Computing'}</p>
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

            {/* Candidate Telemetry Watch Widget */}
            <div className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Telemetry Watch</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Recent candidate risk audits</p>
                </div>
                <Link to="/teacher/reports" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300">
                  All ({attempts.length})
                </Link>
              </div>

              {attempts.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
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
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 transition-colors hover:bg-white dark:hover:bg-zinc-800/80"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                            isHigh
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : isMed
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isHigh ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {att.studentName || att.student?.name || 'Candidate'}
                            </p>
                            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                              <span className={isHigh ? 'text-rose-600 dark:text-rose-400 font-bold' : isMed ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                {riskVal}%
                              </span>{' '}
                              Calibrated Risk
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAuditModal(att)}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all shrink-0 cursor-pointer"
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
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">All Authored Examinations</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage publication status, view analytics, and remove examinations.</p>
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
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {exam.courseCode || 'COURSE'}
                    </span>
                    <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{exam.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">{exam.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{exam.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{exam.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(exam._id, exam.status)}
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                  >
                    {exam.status === 'published' ? 'Unpublish' : 'Publish to Students'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteExam(exam._id)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Create New Examination</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Fill in examination parameters and author question items.</p>
          </div>

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateExamSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Examination Title</label>
                <input
                  type="text"
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  placeholder="e.g. Distributed Computing & Cloud Systems"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Course Code</label>
                <input
                  type="text"
                  value={newExamForm.courseCode}
                  onChange={(e) => setNewExamForm({ ...newExamForm, courseCode: e.target.value })}
                  placeholder="e.g. CS-402"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={newExamForm.durationMinutes}
                  onChange={(e) => setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Passing Marks</label>
                <input
                  type="number"
                  min="1"
                  value={newExamForm.passingMarks}
                  onChange={(e) => setNewExamForm({ ...newExamForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Description</label>
              <textarea
                value={newExamForm.description}
                onChange={(e) => setNewExamForm({ ...newExamForm, description: e.target.value })}
                placeholder="Brief summary of examination topics and competencies."
                rows="2"
                className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900"
              />
            </div>

            {/* Questions Authoring Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Questions ({newExamForm.questions.length})</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Add multiple-choice items and mark the correct option.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-warm-secondary text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {newExamForm.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">Item #{qIdx + 1}</span>
                      {newExamForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
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
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                            className="accent-zinc-900 dark:accent-white w-4 h-4 cursor-pointer"
                            title="Select as correct option"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="w-full px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none bg-transparent"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
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
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Candidate Results Overview</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">All completed student examination submissions across your course roster.</p>
          </div>

          {attempts.length === 0 ? (
            <div className="card-clay p-12 text-center space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No candidate submissions recorded yet.</p>
            </div>
          ) : (
            <div className="card-clay overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Passing Result</th>
                    <th className="py-3 px-4">Proctoring Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">{att.student?.email || 'candidate@university.edu'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-900 dark:text-zinc-100 font-medium">
                        {att.exam?.title || 'Examination'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {att.score} / {att.exam?.totalMarks || 20}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          att.isPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
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
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Proctoring Reports & Risk Review</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Objective telemetry logs and calibrated risk indicators to support manual instructor reviews.
            </p>
          </div>

          {attempts.length === 0 ? (
            <div className="card-clay p-12 text-center space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No proctoring reports available yet.</p>
            </div>
          ) : (
            <div className="card-clay overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Student & Exam</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Telemetry Violations</th>
                    <th className="py-3.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {attempts.map((att) => {
                    const riskVal = att.riskScore || 0;
                    const tabSwitches = att.tabSwitchCount || 0;
                    const multiFaces = att.multiFaceCount || att.multipleFaceCount || 0;
                    const phones = att.phoneDetectedCount || att.phoneDetectionCount || 0;
                    const audioAnomalies = att.audioAnomalyCount || (att.proctoringEvents || []).filter((e) => (e.eventType || e.type) === 'AUDIO_ANOMALY').length;

                    return (
                      <tr key={att._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">{att.exam?.title || 'Exam'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          <span className={riskVal >= 50 ? 'text-rose-600' : riskVal >= 25 ? 'text-amber-600' : 'text-emerald-600'}>
                            {riskVal}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={riskVal >= 50 ? 'HIGH' : riskVal >= 25 ? 'MEDIUM' : 'LOW'} size="sm" />
                        </td>
                        <td className="text-zinc-600 dark:text-zinc-400 py-3.5 px-4 font-medium">
                          <span>Tab Switches: {tabSwitches}</span>
                          {multiFaces > 0 && <span className="ml-2 font-bold text-amber-600">• Multiple Faces: {multiFaces}</span>}
                          {phones > 0 && <span className="ml-2 font-bold text-rose-600">• Mobile Device: {phones}</span>}
                          {audioAnomalies > 0 && <span className="ml-2 font-bold text-amber-500">• Audio Anomaly: {audioAnomalies}</span>}
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
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Instructor Profile</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Faculty credential & institutional details</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block">Faculty Name</span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{user?.name || 'Faculty Member'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block">Email Address</span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{user?.email || 'teacher@university.edu'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block">Department</span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Event Audit Drawer/Modal */}
      {selectedAuditAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  Telemetry Audit: {selectedAuditAttempt.student?.name || selectedAuditAttempt.studentName || 'Candidate'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedAuditAttempt.exam?.title || 'Exam Session'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditAttempt(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Calibrated Risk Score</span>
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
                <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Assessment Status</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {selectedAuditAttempt.isPassed ? 'Passed' : 'Completed'}
                </span>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Telemetry Incident Log</h4>

              {isAuditLoading ? (
                <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">Loading timeline events...</div>
              ) : auditEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/70 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
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
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200'
                            : severity === 'warning'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200'
                            : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              severity === 'critical' ? 'bg-rose-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <span className="font-extrabold">{eventName}</span>
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recorded'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{eventDesc}</p>
                        {(evt.evidenceUrl || evt.presignedSnapshotUrl || evt.snapshotUrl || evt.evidenceS3Key) && (
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewEvidence(evt, idx)}
                              disabled={openingEvidenceId === idx}
                              className="btn-warm-secondary text-[10px] py-1 px-3 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              {openingEvidenceId === idx ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Authorizing S3 Link...</span>
                                </>
                              ) : (
                                <>
                                  <span>View Captured Frame Evidence (S3)</span>
                                  <ExternalLink className="w-3 h-3" />
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePreview(evt, idx)}
                              className="text-[10px] text-zinc-900 dark:text-zinc-100 hover:underline font-bold px-2 py-1 cursor-pointer"
                            >
                              {expandedPreviewId === idx ? 'Hide Snapshot' : 'Inline Preview'}
                            </button>
                          </div>
                        )}

                        {expandedPreviewId === idx && (
                          <div className="mt-2.5 p-2 bg-black rounded-xl overflow-hidden shadow-inner border border-zinc-800">
                            {evt.presignedSnapshotUrl && evt.presignedSnapshotUrl.includes('X-Amz-Signature=') ? (
                              <img
                                src={evt.presignedSnapshotUrl}
                                alt="S3 Proctoring Evidence Frame"
                                className="w-full max-h-56 object-contain rounded-lg border border-zinc-800 bg-black/40"
                                loading="lazy"
                              />
                            ) : (
                              <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Authorizing AWS S3 evidence frame...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
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
