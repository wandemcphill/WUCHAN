'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/StateCards';
import {
  MOCK_PROJECTS,
  MOCK_RFQS,
  MOCK_QUOTES,
  MOCK_ORDERS,
  MOCK_NOTIFICATIONS,
} from '@/lib/adapters/mockData';
import {
  FolderKanban,
  FileText,
  FileCheck2,
  PackageCheck,
  ArrowRight,
  MapPin,
  Bell,
  Plus,
} from 'lucide-react';

function DashboardContent() {
  const { currency, currentUser, organization } = useWorkspace();

  const activeOrder = MOCK_ORDERS[0];
  const pendingQuote = MOCK_QUOTES[0];
  const unreadNotifs = MOCK_NOTIFICATIONS.filter((n) => !n.read);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-semibold">{organization.taxId}</span>
              <span className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded font-mono">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">{organization.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Primary Port: <strong className="text-slate-200">{organization.destinationPort}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/projects/new"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Building Site Project
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/projects"
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2 group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Active Sites</span>
              <FolderKanban className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">{MOCK_PROJECTS.length} Projects</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              What am I buying? <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/rfqs"
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2 group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">RFQs Under Review</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">{MOCK_RFQS.length} RFQs</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              How much will it cost? <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/quotes/qte_2025_8819"
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2 group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Accepted Quote</span>
              <FileCheck2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(MOCK_QUOTES[0].currentVersion.totalUsd, currency)}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              What happens next? <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/orders/ord_2025_9912"
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2 group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Active Order</span>
              <PackageCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">{activeOrder.state}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              Where is my order? <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{activeOrder.orderNumber}</span>
                    <StatusBadge status={activeOrder.state} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">{activeOrder.projectName}</h2>
                </div>

                <Link
                  href={`/orders/${activeOrder.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition text-center"
                >
                  View 16-Stage Milestone Tracker
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Factory Fabrication Progress</span>
                  <span className="font-mono text-blue-400 font-bold">{activeOrder.productionProgressPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
                    style={{ width: `${activeOrder.productionProgressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={activeOrder.responsibleAccountManager.avatarUrl}
                    alt="Account Manager"
                    className="w-10 h-10 rounded-full object-cover border border-slate-800"
                  />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Account Director (Commercial)</span>
                    <strong className="text-slate-200 block">{activeOrder.responsibleAccountManager.name}</strong>
                    <span className="text-slate-400 text-[11px]">{activeOrder.responsibleAccountManager.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                  <img
                    src={activeOrder.responsibleFactoryEngineer.avatarUrl}
                    alt="Factory Engineer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-800"
                  />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Lead Structural Engineer</span>
                    <strong className="text-slate-200 block">{activeOrder.responsibleFactoryEngineer.name}</strong>
                    <span className="text-slate-400 text-[11px]">{activeOrder.responsibleFactoryEngineer.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  Latest Issued Commercial Quote
                </h2>
                <span className="text-xs font-mono text-emerald-400">Accepted & Verified</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-400">{pendingQuote.quoteNumber}</span>
                  <h3 className="text-sm font-bold text-slate-200">{pendingQuote.projectName}</h3>
                  <div className="text-xs text-slate-400">
                    12 Units Space Pod X7 • DDP Los Angeles Port Terms
                  </div>
                </div>

                <div className="text-right space-y-2 shrink-0">
                  <div className="text-lg font-extrabold text-white">
                    {formatCurrency(pendingQuote.currentVersion.totalUsd, currency)}
                  </div>
                  <Link
                    href={`/quotes/${pendingQuote.id}`}
                    className="inline-block px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    View Version Matrix & Invoice
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-400" />
                  Building Site Projects
                </h3>
                <Link href="/projects" className="text-xs text-blue-400 hover:underline">
                  All ({MOCK_PROJECTS.length})
                </Link>
              </div>

              <div className="space-y-3">
                {MOCK_PROJECTS.map((prj) => (
                  <Link
                    key={prj.id}
                    href={`/projects/${prj.id}`}
                    className="block bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400">{prj.code}</span>
                      <StatusBadge status={prj.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{prj.name}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {prj.site.destinationPort}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Procurement Alerts
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-mono">
                  {unreadNotifs.length} Unread
                </span>
              </div>

              <div className="space-y-3">
                {MOCK_NOTIFICATIONS.map((n) => (
                  <Link
                    key={n.id}
                    href={n.linkUrl || '#'}
                    className={`block p-3 rounded-xl border text-xs transition ${
                      !n.read
                        ? 'bg-amber-950/20 border-amber-800/60 text-slate-200'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 mb-0.5">{n.title}</div>
                    <p className="text-[11px] text-slate-400 leading-normal">{n.body}</p>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono">{n.createdAt}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <DashboardContent />
    </WorkspaceProvider>
  );
}
