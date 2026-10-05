'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { StatusBadge } from '@/components/ui/StateCards';
import {
  MOCK_PROJECTS,
  MOCK_RFQS,
  MOCK_ORDERS,
  MOCK_DOCUMENTS,
} from '@/lib/adapters/mockData';
import {
  FileText,
  PackageCheck,
  FolderOpen,
  FileCheck2,
} from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <ProjectDetailInner projectId={params.id} />
    </WorkspaceProvider>
  );
}

function ProjectDetailInner({ projectId }: { projectId: string }) {
  const { currency, language } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  const linkedRfqs = MOCK_RFQS.filter((r) => r.projectId === project.id);
  const linkedOrders = MOCK_ORDERS.filter((o) => o.projectId === project.id);
  const linkedDocs = MOCK_DOCUMENTS.filter((d) => d.projectId === project.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">{project.code}</span>
                <StatusBadge status={project.status} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 mt-1">{project.name}</h1>
              <p className="text-xs text-slate-400 mt-1">{project.description}</p>
            </div>

            <Link
              href={`/rfqs/new?projectId=${project.id}`}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 self-start md:self-auto"
            >
              <FileCheck2 className="w-4 h-4" />
              Submit RFQ for Site
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Location Address</span>
              <strong className="text-slate-200 block truncate">{project.site.locationAddress}</strong>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Destination Seaport</span>
              <strong className="text-blue-400 block">{project.site.destinationPort}</strong>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Building Standard Code</span>
              <strong className="text-emerald-400 block">{project.site.applicableBuildingCode}</strong>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Soil Bearing Capacity</span>
              <strong className="text-amber-400 block">{project.site.soilBearingCapacityKpa || 180} kPa</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Linked RFQs ({linkedRfqs.length})
              </h3>
              <Link href="/rfqs/new" className="text-xs text-blue-400 hover:underline">New</Link>
            </div>

            <div className="space-y-3">
              {linkedRfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/rfqs/${rfq.id}`}
                  className="block p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{rfq.rfqNumber}</span>
                    <StatusBadge status={rfq.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    {rfq.items[0]?.productName[langKey]}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-purple-400" />
                Active Orders ({linkedOrders.length})
              </h3>
            </div>

            <div className="space-y-3">
              {linkedOrders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/orders/${ord.id}`}
                  className="block p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{ord.orderNumber}</span>
                    <StatusBadge status={ord.state} />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Fab Progress: <span className="text-blue-400">{ord.productionProgressPct}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                Site Document Vault ({linkedDocs.length})
              </h3>
              <Link href="/documents" className="text-xs text-blue-400 hover:underline">Vault</Link>
            </div>

            <div className="space-y-3">
              {linkedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                >
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">{doc.category}</span>
                  <div className="font-semibold text-slate-200 line-clamp-1">{doc.title}</div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    v{doc.currentVersion.versionNumber} • {doc.currentVersion.fileName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
