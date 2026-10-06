'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from './NotificationCenter';
import { SystemNotification } from '@wuchan/contracts/merchant';

interface LayoutProps {
  notifications: SystemNotification[];
  onMarkNotificationRead: (id: string) => void;
  actionCounts: {
    rfqs: number;
    ordersAtRisk: number;
    qcFailures: number;
    lowStock: number;
    missingDocs: number;
  };
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  notifications,
  onMarkNotificationRead,
  actionCounts,
  children,
}) => {
  const pathname = usePathname();
  const title = pathname ? pathname.replace('/merchant/', '').replace('_', ' ') : 'dashboard';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar actionCounts={actionCounts} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {title}
            </span>
            <p className="text-xs text-slate-400 hidden md:block">
              Next.js Canonical Workspace — Prefab / Modular Structure Commerce
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter notifications={notifications} onMarkRead={onMarkNotificationRead} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};
