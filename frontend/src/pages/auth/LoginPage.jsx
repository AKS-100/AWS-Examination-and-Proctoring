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
  Sparkles,
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
      <div className="w-full max-w-md space-y-6">

        {/* Page Title & Subtitle */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#D96B4C] to-[#B84E31] text-white shadow-md shadow-[#D96B4C]/25 mx-auto">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A26]">
            Welcome to AdaptiveExam
          </h1>
          <p className="text-xs sm:text-sm text-[#8C827A]">
            Sign in to continue to your AI-proctored workspace.
          </p>
        </div>

        {/* Main Clay Card */}
        <div className="card-clay p-7 sm:p-9 rounded-[36px] space-y-6">

          {/* Role Selector Pill Switch */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8C827A] block">
              Workspace Destination
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] rounded-full border border-[#EFE7DE]">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isTeacher
                    ? 'bg-[#D96B4C] text-white shadow-xs'
                    : 'text-[#8C827A] hover:text-[#2D2A26]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isTeacher
                    ? 'bg-[#D96B4C] text-white shadow-xs'
                    : 'text-[#8C827A] hover:text-[#2D2A26]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Teacher</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {formError && (
            <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{formError}</span>
                {formError.includes('unconfirmed') && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmEmail(email);
                      setShowConfirmModal(true);
                    }}
                    className="block mt-1 font-bold text-[#D96B4C] underline underline-offset-2 hover:text-[#B84E31]"
                  >
                    Enter 6-digit confirmation code now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Alert */}
          {formSuccess && (
            <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{formSuccess}</span>
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2D2A26] block">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isTeacher ? 'teacher@university.edu' : 'student@university.edu'}
                  className="input-warm-pill pl-11 pr-4 py-3 text-xs sm:text-sm w-full"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D2A26]">
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
                  className="text-xs text-[#D96B4C] hover:text-[#B84E31] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-warm-pill pl-11 pr-11 py-3 text-xs sm:text-sm w-full"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2D2A26] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Terracotta Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-terracotta w-full py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Arena</span>
                </>
              )}
            </button>
          </form>

          {/* Link to Registration */}
          <div className="text-center pt-2 text-xs sm:text-sm text-[#8C827A] border-t border-[#EFE7DE]">
            Don't have an institutional account?{' '}
            <Link
              to="/register"
              className="text-[#D96B4C] hover:text-[#B84E31] font-bold hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>

        {/* Quiet Trust Footer */}
        <p className="text-center text-xs text-[#8C827A] flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#D96B4C]" />
          <span>Secured by Amazon Cognito & Adaptive Rekognition</span>
        </p>

      </div>

      {/* Account Email Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="card-clay rounded-[32px] max-w-md w-full p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#FBE0D6] text-[#B84E31] flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#2D2A26]">
                    Verify Email Address
                  </h3>
                  <p className="text-xs text-[#8C827A]">
                    Enter the confirmation code sent to your email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmMsg && (
              <div className="p-3.5 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{confirmMsg}</span>
              </div>
            )}

            {confirmError && (
              <div className="p-3.5 rounded-[18px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2A26]">Email address</label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="input-warm-pill w-full px-4 py-2.5 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2A26]">6-digit confirmation code</label>
                <input
                  type="text"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="input-warm-pill w-full px-4 py-2.5 text-xs font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmCode}
                  disabled={confirmLoading}
                  className="text-xs text-[#D96B4C] hover:underline flex items-center gap-1 font-bold disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${confirmLoading ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>

                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="btn-terracotta text-xs py-2 px-4 disabled:opacity-50"
                >
                  {confirmLoading ? 'Verifying...' : 'Confirm & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="card-clay rounded-[32px] max-w-md w-full p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#FBE0D6] text-[#B84E31] flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#2D2A26]">
                    Reset Password
                  </h3>
                  <p className="text-xs text-[#8C827A]">
                    Step {forgotStep} of 2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-full text-[#8C827A] hover:text-[#2D2A26] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotMsg && (
              <div className="p-3.5 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-3.5 rounded-[18px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <p className="text-xs text-[#8C827A]">
                  Enter your registered email address to receive a 6-digit password reset code.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A26]">Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="input-warm-pill w-full px-4 py-2.5 text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-warm-secondary text-xs py-2 px-3.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-terracotta text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{forgotLoading ? 'Sending...' : 'Send Reset Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                <p className="text-xs text-[#8C827A]">
                  Enter the 6-digit code received at <strong className="text-[#2D2A26]">{forgotEmail}</strong> and your new password.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A26]">6-digit code</label>
                  <input
                    type="text"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="input-warm-pill w-full px-4 py-2.5 text-xs font-mono tracking-widest text-center"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A26]">New password</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-warm-pill w-full px-4 py-2.5 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A26]">Confirm new password</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-warm-pill w-full px-4 py-2.5 text-xs"
                    required
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs font-semibold text-[#8C827A] hover:text-[#2D2A26]"
                  >
                    Back to Email
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-terracotta text-xs py-2 px-4 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating...' : 'Set New Password'}
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
