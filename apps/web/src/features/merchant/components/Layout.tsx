import React from 'react';
import { Sidebar, NavTab } from './Sidebar.js';
import { NotificationCenter } from './NotificationCenter.js';
import { SystemNotification } from '@wuchan/contracts';

interface LayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
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
  currentTab,
  onSelectTab,
  notifications,
  onMarkNotificationRead,
  actionCounts,
  children,
}) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} actionCounts={actionCounts} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {currentTab.replace('_', ' ')}
            </span>
            <p className="text-xs text-slate-400 hidden md:block">
              Operational Workspace — Prefab / Modular Structure Commerce
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
