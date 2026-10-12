import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
          <HelpCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#172033]">404</h1>
          <h2 className="text-base font-bold text-[#172033]">Page Not Found</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            The requested examination route does not exist or may be restricted under active institutional proctoring rules.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
