import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  KeyRound,
  RotateCw,
  Info,
} from 'lucide-react';

export const RegisterPage = () => {
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Step 2: Dedicated Verification Step
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  const { register, confirmAccount, resendCode } = useAuth();
  const navigate = useNavigate();

  const sanitizeErrorMessage = (rawError) => {
    if (!rawError) return 'An unexpected registration error occurred.';
    if (typeof rawError !== 'string') return rawError.message || 'Error occurred.';

    if (rawError.includes('UsernameExistsException') || rawError.includes('already exists')) {
      return 'An account with this email already exists. Please sign in or verify your existing account.';
    }
    if (rawError.includes('InvalidPasswordException')) {
      return 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.';
    }
    if (rawError.includes('CodeMismatchException')) {
      return 'Invalid verification code. Please check the code in your email and try again.';
    }
    if (rawError.includes('ExpiredCodeException')) {
      return 'Code has expired. Please click Resend Code to receive a new one.';
    }

    return rawError;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      studentId: role === 'student' ? studentId.trim() : null,
      department: department.trim() || null,
    });
    setIsSubmitting(false);

    if (result.success) {
      if (result.isConfirmed) {
        navigate('/login', { replace: true });
      } else {
        setIsVerificationStep(true);
      }
    } else {
      setFormError(sanitizeErrorMessage(result.error));
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationSuccess('');

    if (!verificationCode.trim()) {
      setVerificationError('Please enter the 6-digit confirmation code.');
      return;
    }

    setVerificationLoading(true);
    const res = await confirmAccount(email.trim(), verificationCode.trim());
    setVerificationLoading(false);

    if (res.success) {
      setVerificationSuccess('Account confirmed! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } else {
      setVerificationError(sanitizeErrorMessage(res.error));
    }
  };

  const handleResendCode = async () => {
    setVerificationError('');
    setVerificationSuccess('');

    setVerificationLoading(true);
    const res = await resendCode(email.trim());
    setVerificationLoading(false);

    if (res.success) {
      setVerificationSuccess('A new code has been sent to your email.');
    } else {
      setVerificationError(sanitizeErrorMessage(res.error));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-[420px] space-y-6">

        {/* Page Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8612D] text-white mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {isVerificationStep ? 'Verify your email' : 'Create an account'}
          </h1>
          <p className="text-sm text-[#999]">
            {isVerificationStep
              ? `Enter the code sent to ${email}`
              : 'Get started with AdaptiveExam'}
          </p>
        </div>

        {/* Main Card */}
        <div className="card-clay p-6 sm:p-8 space-y-5">

          {!isVerificationStep ? (
            <>
              {/* Role Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#999] block">
                  I am a
                </label>
                <div className="grid grid-cols-2 p-1 bg-[#F5F5F5] rounded-lg border border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'bg-white text-[#1A1A1A] shadow-sm'
                        : 'text-[#999] hover:text-[#555]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'bg-white text-[#1A1A1A] shadow-sm'
                        : 'text-[#999] hover:text-[#555]'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Teacher</span>
                  </button>
                </div>
              </div>

              {/* Teacher info */}
              {role === 'teacher' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Teacher accounts can create exams and view proctoring dashboards.</span>
                </div>
              )}

              {/* Error */}
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A] block">Full name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="input-warm-pill py-2.5 text-sm w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A] block">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="input-warm-pill py-2.5 text-sm w-full"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#1A1A1A] block">
                      Student ID <span className="text-[#999] font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="CS-2026-001"
                        className="input-warm-pill py-2.5 text-sm w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A] block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-warm-pill pl-11 pr-11 py-2.5 text-sm w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A] block">Confirm password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="input-warm-pill py-2.5 text-sm w-full"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-terracotta w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              <div className="text-center text-sm text-[#999] pt-1">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#E8612D] hover:text-[#D4551F] font-semibold"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Verification Screen */
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#F5F5F5] border border-[#E8E8E8] text-[#1A1A1A] text-sm flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#E8612D] flex-shrink-0 mt-0.5" />
                <span>
                  A 6-digit code was sent to <strong>{email}</strong>. Enter it below to activate your account.
                </span>
              </div>

              {verificationSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationSuccess}</span>
                </div>
              )}

              {verificationError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A] block">
                    Confirmation code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="input-warm-pill w-full px-4 py-2.5 text-base font-mono tracking-widest text-center"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="btn-terracotta w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {verificationLoading ? 'Confirming...' : 'Confirm Email'}
                </button>
              </form>

              <div className="flex items-center justify-between pt-1 border-t border-[#E8E8E8] text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={verificationLoading}
                  className="text-[#E8612D] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${verificationLoading ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>

                <Link
                  to="/login"
                  className="text-[#999] hover:text-[#1A1A1A] font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
