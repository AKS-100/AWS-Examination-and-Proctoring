import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  KeyRound,
  RotateCw,
  X,
  ArrowRight,
} from 'lucide-react';

export const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'teacher'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Unconfirmed Account / Verification Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    confirmAccount,
    resendCode,
    requestPasswordReset,
    resetPassword,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname;

  // Auto-redirect if already authenticated
  if (isAuthenticated && user) {
    const dest =
      redirectPath ||
      (user.role === 'teacher' || user.role === 'proctor' ? '/teacher' : '/student');
    return <Navigate to={dest} replace />;
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setFormError('');
    setFormSuccess('');
  };

  const sanitizeErrorMessage = (rawError) => {
    if (!rawError) return "We couldn't sign you in. Please try again.";
    if (typeof rawError !== 'string') return "We couldn't sign you in. Please try again.";

    // Never expose raw OAuth error codes or low-level grant messages to users
    if (
      rawError.includes('invalid_grant') ||
      rawError.includes('invalid authorization code') ||
      rawError.includes('Code mismatch') ||
      rawError.includes('INVALID_GRANT')
    ) {
      return "We couldn't sign you in. Please check your email and password and try again.";
    }

    if (rawError.includes('UserNotConfirmedException') || rawError.includes('not confirmed')) {
      return 'Your email address has not been confirmed yet. Please verify your email using the confirmation code sent by Amazon Cognito.';
    }

    if (rawError.includes('NotAuthorizedException') || rawError.includes('Incorrect username or password')) {
      return 'Incorrect email or password. Please verify your credentials and try again.';
    }

    if (rawError.includes('UserNotFoundException')) {
      return 'No account was found with this email address. Please register for an account.';
    }

    if (rawError.includes('Access Denied') || rawError.includes('Access restricted')) {
      return rawError;
    }

    return rawError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password, selectedRole);
    setIsSubmitting(false);

    if (result.success && result.user) {
      const dest =
        redirectPath || (result.user.role === 'teacher' || result.user.role === 'proctor' ? '/teacher' : '/student');
      navigate(dest, { replace: true });
    } else {
      if (result.isUnconfirmed) {
        setConfirmEmail(email.trim());
        setShowConfirmModal(true);
        setFormError('Account unconfirmed. Please enter the 6-digit verification code sent to your email.');
      } else {
        setFormError(sanitizeErrorMessage(result.error));
      }
    }
  };

  // Handle Account Confirmation
  const handleConfirmAccount = async (e) => {
    e.preventDefault();
    setConfirmError('');
    setConfirmMsg('');

    if (!confirmEmail || !confirmCode) {
      setConfirmError('Please provide both email address and 6-digit confirmation code.');
      return;
    }

    setConfirmLoading(true);
    const res = await confirmAccount(confirmEmail.trim(), confirmCode.trim());
    setConfirmLoading(false);

    if (res.success) {
      setConfirmMsg('Your email has been verified successfully! You can now sign in.');
      setFormSuccess('Email verified successfully! Please enter your password to sign in.');
      setTimeout(() => {
        setShowConfirmModal(false);
      }, 1500);
    } else {
      setConfirmError(sanitizeErrorMessage(res.error || 'Verification failed. Please check the code.'));
    }
  };

  const handleResendConfirmCode = async () => {
    setConfirmError('');
    setConfirmMsg('');

    if (!confirmEmail) {
      setConfirmError('Please enter your email to receive a new code.');
      return;
    }

    setConfirmLoading(true);
    const res = await resendCode(confirmEmail.trim());
    setConfirmLoading(false);

    if (res.success) {
      setConfirmMsg('A new verification code has been dispatched to your email.');
    } else {
      setConfirmError(sanitizeErrorMessage(res.error || 'Failed to dispatch code.'));
    }
  };

  // Handle Forgot Password Flows
  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    const res = await requestPasswordReset(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotMsg('Verification code sent to your email inbox.');
      setForgotStep(2);
    } else {
      setForgotError(sanitizeErrorMessage(res.error || 'Failed to send reset code.'));
    }
  };

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotCode || !forgotNewPassword) {
      setForgotError('Please fill in all fields.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }

    setForgotLoading(true);
    const res = await resetPassword(forgotEmail.trim(), forgotCode.trim(), forgotNewPassword);
    setForgotLoading(false);

    if (res.success) {
      setForgotMsg('Password updated successfully!');
      setFormSuccess('Password updated successfully! Please sign in with your new password.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
      }, 1500);
    } else {
      setForgotError(sanitizeErrorMessage(res.error || 'Failed to update password.'));
    }
  };

  const isTeacher = selectedRole === 'teacher';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-[420px] space-y-6">

        {/* Page Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white mx-auto shadow-lg shadow-orange-500/25 ring-4 ring-orange-500/10 transition-transform hover:scale-105">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#FAF7F2] tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-[#999] dark:text-[#8C827A]">
            Sign in to your account to continue.
          </p>
        </div>

        {/* Main Card */}
        <div className="card-clay p-6 sm:p-8 space-y-5 bg-white dark:bg-[#1C1A18] border border-[#E8E8E8] dark:border-[#332F2B]">

          {/* Role Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#999] dark:text-[#8C827A] block">
              I am a
            </label>
            <div className="grid grid-cols-2 p-1.5 bg-[#F5F5F5] dark:bg-[#221F1C] rounded-xl border border-[#E8E8E8] dark:border-[#332F2B]">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  !isTeacher
                    ? 'bg-white dark:bg-[#2A2622] text-[#1A1A1A] dark:text-[#FAF7F2] shadow-sm dark:shadow-md border border-black/5 dark:border-white/10'
                    : 'text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2]'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  !isTeacher
                    ? 'bg-orange-500/15 text-[#E8612D] dark:text-[#F06E3B]'
                    : 'bg-black/5 dark:bg-white/5 text-[#999] dark:text-[#8C827A]'
                }`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  isTeacher
                    ? 'bg-white dark:bg-[#2A2622] text-[#1A1A1A] dark:text-[#FAF7F2] shadow-sm dark:shadow-md border border-black/5 dark:border-white/10'
                    : 'text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2]'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  isTeacher
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-black/5 dark:bg-white/5 text-[#999] dark:text-[#8C827A]'
                }`}>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <span>Teacher</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <span>{formError}</span>
                {formError.includes('unconfirmed') && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmEmail(email);
                      setShowConfirmModal(true);
                    }}
                    className="block mt-1 font-semibold text-[#E8612D] dark:text-[#F06E3B] underline underline-offset-2 hover:opacity-80 text-xs"
                  >
                    Enter confirmation code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Alert */}
          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">
                Email
              </label>
              <div className="relative group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#8C827A] group-focus-within:text-[#E8612D] dark:group-focus-within:text-[#F06E3B] group-focus-within:bg-orange-500/10 transition-colors pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isTeacher ? 'teacher@university.edu' : 'student@university.edu'}
                  className="input-warm-pill pl-11 py-2.5 text-sm w-full dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotStep(1);
                    setForgotError('');
                    setForgotMsg('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-[#E8612D] dark:text-[#F06E3B] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#8C827A] group-focus-within:text-[#E8612D] dark:group-focus-within:text-[#F06E3B] group-focus-within:bg-orange-500/10 transition-colors pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-warm-pill pl-11 pr-11 py-2.5 text-sm w-full dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-terracotta w-full py-2.5 text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Link to Registration */}
          <div className="text-center text-sm text-[#999] dark:text-[#8C827A] pt-1">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-[#E8612D] dark:text-[#F06E3B] hover:underline font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>

      </div>

      {/* Account Email Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="card-clay rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 bg-white dark:bg-[#1C1A18] border border-[#E8E8E8] dark:border-[#332F2B] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] dark:text-[#FAF7F2]">
                    Verify Email
                  </h3>
                  <p className="text-xs text-[#999] dark:text-[#8C827A]">
                    Enter the code sent to your email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-xl text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{confirmMsg}</span>
              </div>
            )}

            {confirmError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{confirmError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">Email</label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="input-warm-pill w-full px-4 py-2.5 text-sm dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">Confirmation code</label>
                <input
                  type="text"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="input-warm-pill w-full px-4 py-2.5 text-sm font-mono tracking-widest text-center dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmCode}
                  disabled={confirmLoading}
                  className="text-xs text-[#E8612D] dark:text-[#F06E3B] hover:underline flex items-center gap-1.5 font-semibold disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${confirmLoading ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>

                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="btn-terracotta text-sm py-2 px-5 shadow-sm shadow-orange-500/20 disabled:opacity-50"
                >
                  {confirmLoading ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="card-clay rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 bg-white dark:bg-[#1C1A18] border border-[#E8E8E8] dark:border-[#332F2B] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E8612D] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] dark:text-[#FAF7F2]">
                    Reset Password
                  </h3>
                  <p className="text-xs text-[#999] dark:text-[#8C827A]">
                    Step {forgotStep} of 2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-2 rounded-xl text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <p className="text-sm text-[#555] dark:text-[#C4BCB5]">
                  Enter your email to receive a password reset code.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="input-warm-pill w-full px-4 py-2.5 text-sm dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-warm-secondary text-sm py-2 px-4 dark:border-[#332F2B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-terracotta text-sm py-2 px-5 flex items-center gap-1.5 shadow-sm shadow-orange-500/20 disabled:opacity-50"
                  >
                    <span>{forgotLoading ? 'Sending...' : 'Send Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                <p className="text-sm text-[#555] dark:text-[#C4BCB5]">
                  Enter the code sent to <strong className="text-[#1A1A1A] dark:text-[#FAF7F2]">{forgotEmail}</strong> and your new password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">6-digit code</label>
                  <input
                    type="text"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="input-warm-pill w-full px-4 py-2.5 text-sm font-mono tracking-widest text-center dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">New password</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-warm-pill w-full px-4 py-2.5 text-sm dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF7F2] block">Confirm password</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-warm-pill w-full px-4 py-2.5 text-sm dark:bg-[#221F1C] dark:border-[#332F2B] dark:text-[#FAF7F2]"
                    required
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs font-semibold text-[#999] dark:text-[#8C827A] hover:text-[#1A1A1A] dark:hover:text-[#FAF7F2]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-terracotta text-sm py-2 px-5 shadow-sm shadow-orange-500/20 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
