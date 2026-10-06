'use client';

import React from 'react';
import { OrderState } from '@wuchan/contracts';

interface StatusBadgeProps {
  status: OrderState | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let colorStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['CONFIRMED', 'ACCEPTED', 'PAID', 'APPROVED', 'VERIFIED_PAID', 'COMPLETED'].includes(status)) {
    colorStyle = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
  } else if (['PRODUCTION', 'ENGINEERING', 'QC', 'SHIPPED', 'IN_TRANSIT', 'UNDER_REVIEW'].includes(status)) {
    colorStyle = 'bg-blue-950/80 text-blue-400 border-blue-800/60';
  } else if (['DEPOSIT_PENDING', 'CONTRACT_PENDING', 'ISSUED', 'RECEIPT_SUBMITTED', 'PENDING'].includes(status)) {
    colorStyle = 'bg-amber-950/80 text-amber-400 border-amber-800/60';
  } else if (['CANCELLED', 'EXPIRED', 'DECLINED', 'OVERDUE', 'DISPUTED'].includes(status)) {
    colorStyle = 'bg-rose-950/80 text-rose-400 border-rose-800/60';
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {label}
    </span>
  );
};

export const LoadingStateCard: React.FC<{ message?: string }> = ({ message = 'Loading procurement data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
    <p className="text-slate-400 text-sm font-medium">{message}</p>
  </div>
);

export const EmptyStateCard: React.FC<{ title?: string; description?: string; actionButton?: React.ReactNode }> = ({
  title = 'No items found',
  description = 'There are no active records matching your filter selection.',
  actionButton,
}) => (
  <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
      📦
    </div>
    <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
    <p className="text-slate-400 text-sm max-w-md mb-6">{description}</p>
    {actionButton}
  </div>
);

export const ErrorStateCard: React.FC<{ title?: string; message?: string; onRetry?: () => void }> = ({
  title = 'System Error',
  message = 'An error occurred while loading server records. Please retry.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-12 bg-rose-950/20 border border-rose-900/50 rounded-xl text-center">
    <div className="w-12 h-12 rounded-full bg-rose-900/40 flex items-center justify-center text-rose-400 mb-4">
      ⚠️
    </div>
    <h3 className="text-base font-semibold text-rose-200 mb-1">{title}</h3>
    <p className="text-rose-300/80 text-sm max-w-md mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 text-xs font-semibold rounded-lg transition"
      >
        Retry Operation
      </button>
    )}
  </div>
);

export const PermissionDeniedCard: React.FC<{ title?: string; message?: string }> = ({
  title = 'Access Restricted',
  message = 'Your user profile in this organization does not hold authorization to execute commercial or financial commitments.',
}) => (
  <div className="flex flex-col items-center justify-center p-12 bg-amber-950/20 border border-amber-900/50 rounded-xl text-center">
    <div className="w-12 h-12 rounded-full bg-amber-900/40 flex items-center justify-center text-amber-400 mb-4">
      🔒
    </div>
    <h3 className="text-base font-semibold text-amber-200 mb-1">{title}</h3>
    <p className="text-amber-300/80 text-sm max-w-md mb-4">{message}</p>
    <p className="text-xs text-amber-500">Contact your Organization Procurement Lead or Administrator to request authorization.</p>
  </div>
);
