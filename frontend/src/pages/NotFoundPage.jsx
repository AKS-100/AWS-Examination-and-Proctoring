import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md p-8 rounded-2xl bg-white border border-[#E8E8E8] space-y-5">
        <div className="h-12 w-12 mx-auto rounded-xl bg-[#FFF4F0] border border-[#FFD9CC] flex items-center justify-center text-[#E8612D]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-[#1A1A1A]">404</h1>
          <h2 className="text-base font-semibold text-[#1A1A1A]">Page not found</h2>
          <p className="text-sm text-[#999] leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link
          to="/"
          className="btn-terracotta inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
