import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  Activity,
  Lock,
  Clock,
  ArrowRight,
  Camera,
  Check,
  Zap,
  Users,
  BarChart3,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col justify-between font-['Plus_Jakarta_Sans','Outfit',sans-serif]">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Headline & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFF4F0] border border-[#FFD9CC] text-xs font-semibold text-[#E8612D]">
                <Zap className="w-3.5 h-3.5" />
                <span>AI-Powered Exam Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1A1A1A] leading-[1.15]">
                Smart exams,<br />
                <span className="text-[#E8612D]">honest results.</span>
              </h1>

              <p className="text-base text-[#555] max-w-md leading-relaxed">
                A secure online examination system with AI-powered proctoring, real-time monitoring, and transparent risk scoring built on AWS.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/login"
                  className="btn-terracotta py-3 px-6 text-sm flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#features"
                  className="btn-warm-secondary py-3 px-6 text-sm"
                >
                  Learn More
                </a>
              </div>

              {/* Trust Signals */}
              <div className="pt-6 flex items-center gap-6 border-t border-[#E8E8E8]">
                <div>
                  <div className="text-xl font-bold text-[#1A1A1A]">99.9%</div>
                  <div className="text-xs text-[#999]">Uptime</div>
                </div>
                <div className="w-px h-8 bg-[#E8E8E8]" />
                <div>
                  <div className="text-xl font-bold text-[#E8612D]">Fair</div>
                  <div className="text-xs text-[#999]">Transparent Audits</div>
                </div>
                <div className="w-px h-8 bg-[#E8E8E8]" />
                <div>
                  <div className="text-xl font-bold text-[#1A1A1A]">Secure</div>
                  <div className="text-xs text-[#999]">AWS Cognito</div>
                </div>
              </div>
            </div>

            {/* Right Column: Exam Preview Card */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md card-clay rounded-2xl p-5 space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#F5F5F5] text-[#E8612D] flex items-center justify-center font-bold text-xs">
                      CS
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">Systems & Architecture</h4>
                      <p className="text-[11px] text-[#999]">Question 4 of 20 · Midterm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F5] text-xs font-semibold text-[#555]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>38:42</span>
                  </div>
                </div>

                {/* Proctoring Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F5F5] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-[#1A1A1A]">Proctoring Active</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Verified
                  </span>
                </div>

                {/* Question */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    Which CPU scheduling algorithm provides strict non-preemptive execution by default?
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border border-[#E8E8E8] bg-white text-sm text-[#555] flex items-center gap-2.5 hover:border-[#D0D0D0] transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-md border border-[#E8E8E8] flex items-center justify-center text-[10px] font-medium text-[#999]">A</div>
                      <span>Round Robin (RR)</span>
                    </div>

                    <div className="p-3 rounded-lg border-2 border-[#E8612D] bg-[#FFF4F0] text-sm font-medium text-[#1A1A1A] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-[#E8612D] text-white flex items-center justify-center text-[10px]">B</div>
                        <span>First-Come, First-Served (FCFS)</span>
                      </div>
                      <Check className="w-4 h-4 text-[#E8612D]" />
                    </div>

                    <div className="p-3 rounded-lg border border-[#E8E8E8] bg-white text-sm text-[#555] flex items-center gap-2.5 hover:border-[#D0D0D0] transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-md border border-[#E8E8E8] flex items-center justify-center text-[10px] font-medium text-[#999]">C</div>
                      <span>Shortest Remaining Time First</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E8] text-xs">
                  <span className="text-[#999]">Auto-saved</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg border border-[#E8E8E8] text-[#999] text-xs cursor-pointer hover:bg-[#F5F5F5]">Back</span>
                    <span className="px-3.5 py-1.5 rounded-lg bg-[#E8612D] text-white font-medium text-xs cursor-pointer hover:bg-[#D4551F]">Next</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 md:py-24 bg-white border-t border-b border-[#E8E8E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
              Built for academic integrity
            </h2>
            <p className="text-sm sm:text-base text-[#555]">
              Secure proctoring balanced with transparent, fair evaluation.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] hover:bg-white hover:shadow-sm transition-all space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFF4F0] text-[#E8612D] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Secure Testing
              </h3>
              <p className="text-sm text-[#555] leading-relaxed">
                Timed assessments with fullscreen protection, tab-switch detection, auto-saving, and instant evaluation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] hover:bg-white hover:shadow-sm transition-all space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                AI Proctoring
              </h3>
              <p className="text-sm text-[#555] leading-relaxed">
                Continuous face verification and object detection via AWS Rekognition, running without affecting test performance.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] hover:bg-white hover:shadow-sm transition-all space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] text-[#059669] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Transparent Audits
              </h3>
              <p className="text-sm text-[#555] leading-relaxed">
                Instructors can review flagged events with timestamped evidence photos, ensuring fairness and eliminating false accusations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* About / CTA Section */}
      <section id="about" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto card-clay rounded-2xl p-8 sm:p-12 space-y-5 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8612D] text-white mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
              Ready to get started?
            </h3>

            <p className="text-sm text-[#555] max-w-md mx-auto">
              Create your account and set up your first exam in minutes. Built with AWS Cognito, DynamoDB, and S3 for enterprise-grade security.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/login"
                className="btn-terracotta text-sm py-2.5 px-6"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-warm-secondary text-sm py-2.5 px-6"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] py-6 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#E8612D] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#1A1A1A]">AdaptiveExam</span>
            <span className="text-xs text-[#999]">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#999] font-medium">
            <a href="#about" className="hover:text-[#1A1A1A] transition-colors">About</a>
            <a href="#privacy" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
            <a href="#support" className="hover:text-[#1A1A1A] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
