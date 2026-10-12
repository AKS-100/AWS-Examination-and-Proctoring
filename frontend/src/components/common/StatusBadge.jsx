import React from 'react';

/**
 * StatusBadge - Clean, professional educational status indicators
 * Uses soft tints, subtle borders, and clear semantic colors.
 */
export const StatusBadge = ({ status = 'LOW', size = 'md', className = '' }) => {
  const normalized = (status || '').toUpperCase();

  const configs = {
    LOW: {
      label: 'Low Risk',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    MEDIUM: {
      label: 'Medium Risk',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
    },
    HIGH: {
      label: 'High Risk',
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500',
    },
    REVIEW: {
      label: 'Review Recommended',
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
    },
    NORMAL: {
      label: 'Normal Session',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    ACTIVE: {
      label: 'Active Session',
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      dot: 'bg-blue-500',
    },
    PUBLISHED: {
      label: 'Published',
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      dot: 'bg-blue-500',
    },
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 border-slate-200 text-slate-600',
      dot: 'bg-slate-400',
    },
    COMPLETED: {
      label: 'Submitted',
      bg: 'bg-slate-100 border-slate-200 text-slate-700',
      dot: 'bg-slate-500',
    },
    VERIFIED: {
      label: 'Verified',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
    },
  };

  const config = configs[normalized] || {
    label: status,
    bg: 'bg-slate-100 border-slate-200 text-slate-600',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
