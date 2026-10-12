import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  Activity,
  Lock,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Camera,
  Users,
  Award,
  ChevronRight,
  Check,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-[#172033] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Copy, Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trusted Institutional Examination Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#172033] leading-tight">
                Secure Exams.<br />
                <span className="text-[#2563EB]">Fair Assessments.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
                An intelligent examination platform with real-time proctoring, secure assessments, and transparent exam monitoring.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#features"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#172033] font-semibold text-sm border border-[#E2E8F0] shadow-xs transition-colors"
                >
                  Explore Features
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E2E8F0] max-w-lg">
                <div>
                  <div className="text-xl font-bold text-[#172033]">99.9%</div>
                  <div className="text-xs text-[#64748B]">Platform Reliability</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#172033]">Zero</div>
                  <div className="text-xs text-[#64748B]">False-Positive Bans</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#172033]">Role-Based</div>
                  <div className="text-xs text-[#64748B]">Institutional Security</div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Online Examination Interface Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-md p-5 space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      CS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172033]">CS-301: Systems & Architecture</h4>
                      <p className="text-[10px] text-[#64748B]">Question 4 of 20 • Midterm Examination</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-[#172033] border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>38:42</span>
                  </div>
                </div>

                {/* Subtle Proctoring Status Badge */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-[#172033]">Proctoring Active</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Face Verified
                  </span>
                </div>

                {/* Simulated Question */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-semibold text-[#172033] leading-relaxed">
                    Which CPU scheduling algorithm provides strict non-preemptive execution by default?
                  </p>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#64748B] flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">A</div>
                      <span>Round Robin (RR)</span>
                    </div>

                    <div className="p-2.5 rounded-xl border-2 border-[#2563EB] bg-blue-50/50 text-xs font-medium text-[#172033] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">B</div>
                        <span>First-Come, First-Served (FCFS)</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#64748B] flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">C</div>
                      <span>Shortest Remaining Time First (SRTF)</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls Preview */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-xs">
                  <span className="text-[11px] text-[#64748B]">Auto-saved 2s ago</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-[#64748B] text-xs">Previous</span>
                    <span className="px-3 py-1 rounded-lg bg-[#2563EB] text-white font-medium text-xs">Next Question</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
              Built for Modern Universities and Educators
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Every assessment component is calibrated to balance academic integrity with candidate dignity and reliability.
            </p>
          </div>

          {/* Three Concise Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: Secure Online Exams */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">
                Secure Online Exams
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Timed assessments with browser lockdown protection, tab-switch monitoring, automated progress saving, and verified digital submissions.
              </p>
            </div>

            {/* Card 2: AI-Assisted Proctoring */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">
                AI-Assisted Proctoring
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Non-intrusive facial presence and environment monitoring using selective AI analysis. Operates smoothly without interrupting student focus.
              </p>
            </div>

            {/* Card 3: Transparent Risk Monitoring */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">
                Transparent Risk Monitoring
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Objective telemetry logs and calibrated risk indicators that assist educators during manual reviews without punitive automated disqualifications.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* About / Institutional Quality Section */}
      <section id="about" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 space-y-6 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#172033]">
              Designed for Authentic Academic Trust
            </h3>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-xl mx-auto">
              AdaptiveExam separates student candidates from instructors through strictly enforced role-based access control, institutional AWS Cognito authentication, and verifiable evidence pipelines.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Sign In to Workspace
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#172033] font-semibold text-xs border border-[#E2E8F0] shadow-xs transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#2563EB] text-white flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-[#172033]">AdaptiveExam</span>
            <span className="text-xs text-[#64748B]">© {new Date().getFullYear()} AdaptiveExam Systems. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#64748B]">
            <a href="#about" className="hover:text-[#172033] transition-colors">About</a>
            <a href="#privacy" className="hover:text-[#172033] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#172033] transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-[#172033] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
