'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/StateCards';
import { MOCK_PROJECTS } from '@/lib/adapters/mockData';
import {
  FolderKanban,
  MapPin,
  Calendar,
  Building2,
  Plus,
  ArrowRight,
} from 'lucide-react';

function ProjectsContent() {
  const { currency } = useWorkspace();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Project Site Registry</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Building Sites & Physical Projects</h1>
            <p className="text-sm text-slate-400 mt-1">
              Organize land parcels, soil test surveys, local building codes, and RFQs under site projects.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Building Site
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_PROJECTS.map((prj) => (
            <div
              key={prj.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-blue-400 font-bold">{prj.code}</span>
                  <StatusBadge status={prj.status} />
                </div>

                <h2 className="text-lg font-bold text-slate-100">{prj.name}</h2>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{prj.description}</p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> Site Address:
                    </span>
                    <span className="font-medium truncate max-w-[200px]">{prj.site.locationAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" /> Building Code:
                    </span>
                    <span className="font-mono text-[11px] text-blue-300">{prj.site.applicableBuildingCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Target Delivery:
                    </span>
                    <span className="font-mono text-[11px] text-amber-300">{prj.targetDeliveryDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Estimated Budget</span>
                  <span className="text-base font-extrabold text-white">
                    {prj.budgetUsd ? formatCurrency(prj.budgetUsd, currency) : 'N/A'}
                  </span>
                </div>

                <Link
                  href={`/projects/${prj.id}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
                >
                  Project Workspace <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <ProjectsContent />
    </WorkspaceProvider>
  );
}
