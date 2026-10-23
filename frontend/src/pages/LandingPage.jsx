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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-['Plus_Jakarta_Sans','Outfit',sans-serif] transition-colors">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Headline & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-zinc-500" />
                <span>AI-Powered Exam Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                Smart exams,<br />
                <span className="text-zinc-500 dark:text-zinc-400 font-normal">honest results.</span>
              </h1>

              <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
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
              <div className="pt-6 flex items-center gap-6 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">99.9%</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Uptime</div>
                </div>
                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">Fair</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Transparent Audits</div>
                </div>
                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">Secure</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">AWS Cognito</div>
                </div>
              </div>
            </div>

            {/* Right Column: Exam Preview Card */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md card-clay rounded-3xl p-5 space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-xs">
                      CS
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Systems & Architecture</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Question 4 of 20 · Midterm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>38:42</span>
                  </div>
                </div>

                {/* Proctoring Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-white">Proctoring Active</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Verified
                  </span>
                </div>

                {/* Question */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Which CPU scheduling algorithm provides strict non-preemptive execution by default?
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-500">A</div>
                      <span>Round Robin (RR)</span>
                    </div>

                    <div className="p-3 rounded-xl border-2 border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold">B</div>
                        <span>First-Come, First-Served (FCFS)</span>
                      </div>
                      <Check className="w-4 h-4 text-zinc-900 dark:text-white" />
                    </div>

                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-500">C</div>
                      <span>Shortest Remaining Time First</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Auto-saved</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Back</span>
                    <span className="px-3.5 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs cursor-pointer shadow-xs transition-colors">Next</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 md:py-24 bg-white dark:bg-zinc-900/40 border-t border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Built for academic integrity
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
              Secure proctoring balanced with transparent, fair evaluation.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Secure Testing
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Timed assessments with fullscreen protection, tab-switch detection, auto-saving, and instant evaluation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                AI Proctoring
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Continuous face verification and object detection via AWS Rekognition, running without affecting test performance.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Transparent Audits
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Instructors can review flagged events with timestamped evidence photos, ensuring fairness and eliminating false accusations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* About / CTA Section */}
      <section id="about" className="py-16 md:py-20 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto rounded-3xl p-8 sm:p-12 space-y-5 text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border border-zinc-800 shadow-xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mx-auto border border-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to get started?
            </h3>

            <p className="text-sm text-zinc-400 max-w-md mx-auto">
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
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-[#09090b] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">
              Adaptive<span className="font-normal text-zinc-400 dark:text-zinc-500">Exam</span>
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <a href="#about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a>
            <a href="#privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#support" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
