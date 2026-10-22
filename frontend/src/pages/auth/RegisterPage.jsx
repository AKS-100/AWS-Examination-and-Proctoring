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
  ArrowRight,
  Info,
  Sparkles,
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
      return 'An account with this email address already exists. Please sign in or verify your existing account.';
    }
    if (rawError.includes('InvalidPasswordException')) {
      return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.';
    }
    if (rawError.includes('CodeMismatchException')) {
      return 'Invalid verification code. Please check the code in your email and try again.';
    }
    if (rawError.includes('ExpiredCodeException')) {
      return 'Verification code has expired. Please click Resend Code to receive a new one.';
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
        // Already confirmed by directory
        navigate('/login', { replace: true });
      } else {
        // Transition to dedicated verification step
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
      setVerificationSuccess('Account confirmed successfully! Redirecting to sign in...');
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
      setVerificationSuccess('A fresh verification code has been dispatched to your email.');
    } else {
      setVerificationError(sanitizeErrorMessage(res.error));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">

        {/* Page Title & Subtitle */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#D96B4C] to-[#B84E31] text-white shadow-md shadow-[#D96B4C]/25 mx-auto">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A26]">
            {isVerificationStep ? 'Verify Your Email' : 'Create an Account'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8C827A]">
            {isVerificationStep
              ? `Enter the 6-digit code dispatched to ${email}`
              : 'Join the Adaptive AI examination arena'}
          </p>
        </div>

        {/* Main Card */}
        <div className="card-clay p-7 sm:p-9 rounded-[36px] space-y-6">

          {!isVerificationStep ? (
            <>
              {/* Account Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C827A] block">
                  Institutional Role
                </label>
                <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] rounded-full border border-[#EFE7DE]">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'bg-[#D96B4C] text-white shadow-xs'
                        : 'text-[#8C827A] hover:text-[#2D2A26]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'bg-[#D96B4C] text-white shadow-xs'
                        : 'text-[#8C827A] hover:text-[#2D2A26]'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Teacher</span>
                  </button>
                </div>
              </div>

              {/* Informational Note for Teachers */}
              {role === 'teacher' && (
                <div className="p-3.5 rounded-[18px] bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">
                    Faculty accounts are enabled for real-time exam creation and live AWS telemetry dashboards.
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {formError && (
                <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold flex-1">{formError}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2A26] block">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="input-warm-pill pl-11 pr-4 py-3 text-xs sm:text-sm w-full"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="name@university.edu"
                      className="input-warm-pill pl-11 pr-4 py-3 text-xs sm:text-sm w-full"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Optional Student ID for students */}
                {role === 'student' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2D2A26] block">
                      Student ID (optional)
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="CS-2026-001"
                        className="input-warm-pill pl-11 pr-4 py-3 text-xs sm:text-sm w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2A26] block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="input-warm-pill pl-11 pr-11 py-3 text-xs sm:text-sm w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2D2A26]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2A26] block">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C827A] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="input-warm-pill pl-11 pr-4 py-3 text-xs sm:text-sm w-full"
                      required
                    />
                  </div>
                </div>

                {/* Submit Terracotta Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-terracotta w-full py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* Link back to Sign In */}
              <div className="text-center pt-2 text-xs sm:text-sm text-[#8C827A] border-t border-[#EFE7DE]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#D96B4C] hover:text-[#B84E31] font-bold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Dedicated Verification Screen */
            <div className="space-y-5">
              <div className="p-4 rounded-[20px] bg-[#FAF7F2] border border-[#EFE7DE] text-[#2D2A26] text-xs flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#D96B4C] flex-shrink-0 mt-0.5" />
                <span>
                  A 6-digit confirmation code was sent to <strong className="text-[#2D2A26]">{email}</strong>. Enter it below to activate your account.
                </span>
              </div>

              {verificationSuccess && (
                <div className="p-3.5 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{verificationSuccess}</span>
                </div>
              )}

              {verificationError && (
                <div className="p-3.5 rounded-[18px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D2A26] block">
                    6-digit confirmation code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="input-warm-pill w-full px-4 py-3 text-base text-[#2D2A26] font-mono tracking-widest text-center"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="btn-terracotta w-full py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {verificationLoading ? 'Confirming...' : 'Confirm Email'}
                </button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-[#EFE7DE] text-xs">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={verificationLoading}
                  className="text-[#D96B4C] hover:underline flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${verificationLoading ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>

                <Link
                  to="/login"
                  className="text-[#8C827A] hover:text-[#2D2A26] hover:underline font-medium"
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
