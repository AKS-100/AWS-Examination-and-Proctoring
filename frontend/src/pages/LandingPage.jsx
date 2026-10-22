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
    <div className="min-h-screen bg-[#F6EFE9] text-[#2D2A26] flex flex-col justify-between font-['Outfit','Plus_Jakarta_Sans',sans-serif]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
        {/* Soft background glow accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#D96B4C]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Copy, Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#EFE7DE] text-xs font-bold text-[#D96B4C] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Next-Gen Institutional Examination Arena</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#2D2A26] leading-tight">
                Intelligent Exams.<br />
                <span className="text-[#D96B4C]">Zero Distractions.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#5C554E] max-w-xl leading-relaxed font-normal">
                An adaptive, warm, and highly secure examination ecosystem powered by AWS Rekognition facial biometric telemetry and real-time DynamoDB risk scoring.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="btn-terracotta text-sm py-3 px-6 shadow-md shadow-[#D96B4C]/25 flex items-center gap-2"
                >
                  <span>Launch Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#features"
                  className="btn-warm-secondary text-sm py-3 px-6"
                >
                  Explore System
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#EFE7DE] max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold text-[#2D2A26]">99.9%</div>
                  <div className="text-xs text-[#8C827A] font-medium">AWS Uptime SLA</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#D96B4C]">0-Penalty</div>
                  <div className="text-xs text-[#8C827A] font-medium">Transparent Audits</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#2D2A26]">Cognito</div>
                  <div className="text-xs text-[#8C827A] font-medium">Role Governance</div>
                </div>
              </div>
            </div>

            {/* Right Column: Cozy Exam Preview Interface */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md card-clay rounded-[32px] p-6 space-y-4 border border-[#EFE7DE]">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DE]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[14px] bg-[#FAF7F2] border border-[#EFE7DE] text-[#D96B4C] flex items-center justify-center font-extrabold text-xs shadow-xs">
                      CS
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2D2A26]">CS-301: Systems & Architecture</h4>
                      <p className="text-[10px] text-[#8C827A]">Question 4 of 20 • Proctored Midterm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-xs font-bold text-[#D96B4C] border border-[#EFE7DE]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>38:42</span>
                  </div>
                </div>

                {/* Subtle Proctoring Status Badge */}
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[18px] bg-[#FAF7F2] border border-[#EFE7DE] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-[#2D2A26]">Telemetry Active</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Face Verified
                  </span>
                </div>

                {/* Simulated Question */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold text-[#2D2A26] leading-relaxed">
                    Which CPU scheduling algorithm provides strict non-preemptive execution by default?
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-[18px] border border-[#EFE7DE] bg-white text-xs text-[#8C827A] flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-[#EFE7DE] flex items-center justify-center text-[10px]">A</div>
                      <span>Round Robin (RR)</span>
                    </div>

                    <div className="p-3 rounded-[18px] border-2 border-[#D96B4C] bg-[#FFF8F6] text-xs font-bold text-[#2D2A26] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#D96B4C] text-white flex items-center justify-center text-[10px]">B</div>
                        <span>First-Come, First-Served (FCFS)</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-[#D96B4C]" />
                    </div>

                    <div className="p-3 rounded-[18px] border border-[#EFE7DE] bg-white text-xs text-[#8C827A] flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-[#EFE7DE] flex items-center justify-center text-[10px]">C</div>
                      <span>Shortest Remaining Time First (SRTF)</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls Preview */}
                <div className="flex items-center justify-between pt-3 border-t border-[#EFE7DE] text-xs">
                  <span className="text-[11px] text-[#8C827A] font-medium">Auto-saved to DynamoDB</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full border border-[#EFE7DE] text-[#8C827A] text-xs">Back</span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#D96B4C] text-white font-bold text-xs shadow-xs">Next</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 md:py-24 border-t border-b border-[#EFE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A26]">
              Engineered for Academic Integrity & Comfort
            </h2>
            <p className="text-sm sm:text-base text-[#5C554E]">
              Every assessment mechanism is calibrated to balance high-security proctoring with non-punitive fairness.
            </p>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: Secure Online Exams */}
            <div className="card-clay rounded-[32px] p-7 sm:p-8 space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-[20px] bg-[#FAF7F2] text-[#D96B4C] border border-[#EFE7DE] flex items-center justify-center shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#2D2A26]">
                Secure Testing Arena
              </h3>
              <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed">
                Timed assessments with fullscreen protection, tab-switch telemetry, automatic question answers saving, and instant evaluation.
              </p>
            </div>

            {/* Card 2: AI-Assisted Proctoring */}
            <div className="card-clay rounded-[32px] p-7 sm:p-8 space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-[20px] bg-[#FBE0D6] text-[#B84E31] flex items-center justify-center shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#2D2A26]">
                AWS Rekognition AI
              </h3>
              <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed">
                Continuous facial presence verification and object detection (phones, extra faces) running asynchronously without degrading test performance.
              </p>
            </div>

            {/* Card 3: Transparent Risk Monitoring */}
            <div className="card-clay rounded-[32px] p-7 sm:p-8 space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-[20px] bg-[#E2EBE5] text-[#4F6D5B] flex items-center justify-center shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#2D2A26]">
                Real-Time Telemetry Audit
              </h3>
              <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed">
                Professors can review flagged timestamps with presigned S3 evidence photos, eliminating false accusations and ensuring complete transparency.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* About / Institutional Quality Section */}
      <section id="about" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto card-clay rounded-[36px] p-8 sm:p-12 space-y-6 text-center border border-[#EFE7DE]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#D96B4C] to-[#B84E31] text-white mx-auto shadow-md shadow-[#D96B4C]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A26]">
              Built for Institutional Trust & Reliability
            </h3>

            <p className="text-xs sm:text-sm text-[#5C554E] leading-relaxed max-w-xl mx-auto">
              AdaptiveExam strictly separates student candidates from instructors through AWS Cognito identity pools, DynamoDB persistence, and S3 secure storage.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/login"
                className="btn-terracotta text-xs py-3 px-6"
              >
                Sign In to Workspace
              </Link>
              <Link
                to="/register"
                className="btn-warm-secondary text-xs py-3 px-6"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EFE7DE] py-8 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[10px] bg-[#D96B4C] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-[#2D2A26]">AdaptiveExam</span>
            <span className="text-xs text-[#8C827A]">© {new Date().getFullYear()} Adaptive AI Systems. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#8C827A] font-medium">
            <a href="#about" className="hover:text-[#2D2A26] transition-colors">About</a>
            <a href="#privacy" className="hover:text-[#2D2A26] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#2D2A26] transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-[#2D2A26] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
