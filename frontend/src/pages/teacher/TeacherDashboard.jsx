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
    status: 'published',
    questions: [
      {
        text: 'What is the primary function of an operating system kernel?',
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
    setAuditEvents([]);

    try {
      const res = await apiGetAttemptProctoringEvents(attemptItem._id);
      if (res.data?.events) {
        setAuditEvents(res.data.events);
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

  const handleQuestionChange = (qIndex, field, value) => {
    setNewExamForm((prev) => {
      const qs = [...prev.questions];
      qs[qIndex] = { ...qs[qIndex], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setNewExamForm((prev) => {
      const qs = [...prev.questions];
      const opts = [...qs[qIndex].options];
      opts[optIndex] = value;
      qs[qIndex] = { ...qs[qIndex], options: opts };
      return { ...prev, questions: qs };
    });
  };

  // Create Exam Form Submission
  const handleCreateExamSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormSuccess('');

    try {
      const res = await apiCreateExam({
        ...newExamForm,
        creatorEmail: user?.email || newExamForm.creatorEmail,
      });

      if (res.success && res.data?.exam) {
        setFormSuccess('Examination created and published successfully!');
        setExams((prev) => [res.data.exam, ...prev]);
        setTimeout(() => {
          navigate('/teacher/exams');
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics calculation
  const totalExams = exams.length;
  const activeExams = exams.filter((e) => e.status === 'published').length;
  const totalAttempts = attempts.length;
  const reviewFlagsCount = attempts.filter((a) => (a.riskScore || 0) >= 30).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              Instructor Portal
            </span>
            <span className="text-xs text-[#64748B]">Role: Certified Instructor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Teacher Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage courses, author adaptive assessments, and review transparent proctoring reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTeacherData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#172033] font-semibold text-xs border border-[#E2E8F0] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#2563EB]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/teacher/create-exam"
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto text-xs font-semibold">
        <Link
          to="/teacher"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isOverview
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/teacher/exams"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isExamsView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          My Exams ({exams.length})
        </Link>
        <Link
          to="/teacher/create-exam"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isCreateExamView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Create Exam
        </Link>
        <Link
          to="/teacher/results"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isResultsView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Student Results ({attempts.length})
        </Link>
        <Link
          to="/teacher/reports"
          className={`px-3.5 py-2 rounded-xl transition-colors ${
            isReportsView
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
          }`}
        >
          Proctoring Reports ({reviewFlagsCount} flagged)
        </Link>
        <Link
          to="/teacher/profile"
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
      {isOverview && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Total Exams</span>
              <div className="text-2xl font-bold text-[#172033]">{totalExams}</div>
              <p className="text-[11px] text-[#64748B]">Authored assessments</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Active Exams</span>
              <div className="text-2xl font-bold text-emerald-600">{activeExams}</div>
              <p className="text-[11px] text-[#64748B]">Published to roster</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Student Attempts</span>
              <div className="text-2xl font-bold text-[#2563EB]">{totalAttempts}</div>
              <p className="text-[11px] text-[#64748B]">Total test submissions</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Review Flags</span>
              <div className="text-2xl font-bold text-amber-600">{reviewFlagsCount}</div>
              <p className="text-[11px] text-[#64748B]">Requires teacher review</p>
            </div>
          </div>

          {/* Quick Create CTA Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172033]">Author a New Examination</h3>
              <p className="text-xs text-[#64748B] max-w-lg">
                Create structured multiple-choice questions, set custom pass criteria, and configure AI proctoring thresholds.
              </p>
            </div>
            <Link
              to="/teacher/create-exam"
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Exam</span>
            </Link>
          </div>

          {/* Recent Activity / Exams Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Recent Examinations</h3>
                <p className="text-xs text-[#64748B]">Overview of course exams and candidate submissions.</p>
              </div>
              <Link to="/teacher/exams" className="text-xs font-semibold text-[#2563EB] hover:underline">
                View all exams →
              </Link>
            </div>

            {exams.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center space-y-2">
                <p className="text-xs text-[#64748B]">No examinations created yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Exam Title</th>
                      <th className="py-3 px-4">Course Code</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {exams.slice(0, 5).map((exam) => (
                      <tr key={exam._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#172033]">{exam.title}</td>
                        <td className="py-3.5 px-4 text-[#64748B]">{exam.courseCode}</td>
                        <td className="py-3.5 px-4 text-[#64748B]">{exam.durationMinutes} mins</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam._id, exam.status)}
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY EXAMS TAB */}
      {isExamsView && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">All Authored Examinations</h2>
              <p className="text-xs text-[#64748B]">Manage publication status, view analytics, and remove examinations.</p>
            </div>
            <Link
              to="/teacher/create-exam"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Exam</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200">
                      {exam.courseCode || 'COURSE'}
                    </span>
                    <StatusBadge status={exam.status === 'published' ? 'PUBLISHED' : 'DRAFT'} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#172033] line-clamp-1">{exam.title}</h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1">{exam.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(exam._id, exam.status)}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    {exam.status === 'published' ? 'Unpublish' : 'Publish to Students'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteExam(exam._id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#172033]">Create New Examination</h2>
            <p className="text-xs text-[#64748B]">Fill in examination parameters and author question items.</p>
          </div>

          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateExamSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033]">Examination Title</label>
                <input
                  type="text"
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  placeholder="e.g. Distributed Computing & Cloud Systems"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033]">Course Code</label>
                <input
                  type="text"
                  value={newExamForm.courseCode}
                  onChange={(e) => setNewExamForm({ ...newExamForm, courseCode: e.target.value })}
                  placeholder="e.g. CS-402"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033]">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={newExamForm.durationMinutes}
                  onChange={(e) => setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033]">Passing Marks</label>
                <input
                  type="number"
                  min="1"
                  value={newExamForm.passingMarks}
                  onChange={(e) => setNewExamForm({ ...newExamForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#172033]">Description</label>
              <textarea
                value={newExamForm.description}
                onChange={(e) => setNewExamForm({ ...newExamForm, description: e.target.value })}
                placeholder="Brief summary of examination topics and competencies."
                rows="2"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Questions Authoring Section */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Questions ({newExamForm.questions.length})</h3>
                  <p className="text-[11px] text-[#64748B]">Add multiple-choice items and mark the correct option.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-blue-100 font-semibold text-xs border border-blue-200 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {newExamForm.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">Item #{qIdx + 1}</span>
                      {newExamForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                            className="text-[#2563EB] focus:ring-[#2563EB]"
                            title="Select as correct option"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
              <Link
                to="/teacher/exams"
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
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
            <h2 className="text-lg font-bold text-[#172033]">Candidate Results Overview</h2>
            <p className="text-xs text-[#64748B]">All completed student examination submissions across your course roster.</p>
          </div>

          {attempts.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-2">
              <p className="text-xs text-[#64748B]">No candidate submissions recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Passing Result</th>
                    <th className="py-3 px-4">Proctoring Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#172033]">
                        <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                        <span className="text-[11px] text-[#64748B] font-normal">{att.student?.email || 'candidate@university.edu'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#172033]">
                        {att.exam?.title || 'Examination'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#172033]">
                        {att.score} / {att.exam?.totalMarks || 20}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
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
            <h2 className="text-lg font-bold text-[#172033]">Proctoring Reports & Risk Review</h2>
            <p className="text-xs text-[#64748B]">
              Objective telemetry logs and calibrated risk indicators to support manual instructor reviews.
            </p>
          </div>

          {attempts.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-2">
              <p className="text-xs text-[#64748B]">No proctoring reports available yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student & Exam</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Telemetry Violations</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {attempts.map((att) => {
                    const riskVal = att.riskScore || 0;
                    const tabSwitches = att.tabSwitchCount || 0;
                    const multiFaces = att.multiFaceCount || 0;

                    return (
                      <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#172033]">
                          <div>{att.student?.name || att.studentName || 'Student Candidate'}</div>
                          <span className="text-[11px] text-[#64748B] font-normal">{att.exam?.title || 'Exam'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                          {riskVal}%
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={riskVal >= 50 ? 'HIGH' : riskVal >= 25 ? 'MEDIUM' : 'LOW'} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          <span>Tab Switches: {tabSwitches}</span>
                          {multiFaces > 0 && <span className="ml-2 font-semibold text-amber-700">• Multiple Faces: {multiFaces}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAuditModal(att)}
                            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#2563EB] transition-colors cursor-pointer"
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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">Instructor Profile</h2>
            <p className="text-xs text-[#64748B]">Faculty credential details</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Faculty Name</span>
              <span className="text-sm font-bold text-[#172033]">{user?.name || 'Faculty Member'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Email Address</span>
              <span className="text-sm font-bold text-[#172033]">{user?.email || 'teacher@university.edu'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-semibold text-[#64748B] block">Department</span>
              <span className="text-sm font-bold text-[#172033]">{user?.department || 'Department of Computer Science'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Event Audit Drawer/Modal */}
      {selectedAuditAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Telemetry Audit: {selectedAuditAttempt.student?.name || selectedAuditAttempt.studentName || 'Candidate'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedAuditAttempt.exam?.title || 'Exam Session'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditAttempt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block">Calibrated Risk Score</span>
                <span className="text-sm font-bold text-[#172033]">{selectedAuditAttempt.riskScore || 0}%</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Assessment Status</span>
                <span className="text-sm font-bold text-emerald-600">
                  {selectedAuditAttempt.isPassed ? 'Passed' : 'Completed'}
                </span>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#172033]">Event Timeline</h4>

              {isAuditLoading ? (
                <div className="py-8 text-center text-xs text-[#64748B]">Loading timeline events...</div>
              ) : auditEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  No suspicious violations recorded during this examination session.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {auditEvents.map((evt, idx) => {
                    const eventName = evt.eventType || evt.type || 'Telemetry Signal';
                    const eventDesc = evt.details || evt.description || 'Verified proctoring signal';
                    const severity = evt.severity || (evt.riskScoreImpact > 15 ? 'critical' : 'warning');
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          severity === 'critical'
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : severity === 'warning'
                            ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                            : 'bg-white border-[#E2E8F0] text-[#172033]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              severity === 'critical' ? 'bg-rose-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <span>{eventName}</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#64748B]">
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recorded'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">{eventDesc}</p>
                        {evt.evidenceUrl && (
                          <div className="pt-1">
                            <a
                              href={evt.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>View Captured Frame Evidence (S3)</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditAttempt(null)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold shadow-xs"
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
