'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { StatusBadge } from '@/components/ui/StateCards';
import { MOCK_RFQS } from '@/lib/adapters/mockData';
import { FileText, Plus, FileCheck2 } from 'lucide-react';

function RfqListContent() {
  const { language } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>RFQ Management</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Requests for Quote (RFQs)</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track submitted commercial RFQs, revision requests, and generated quotes.
            </p>
          </div>

          <Link
            href="/rfqs/new"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Submit New RFQ
          </Link>
        </div>

        <div className="space-y-4">
          {MOCK_RFQS.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400 font-bold">{rfq.rfqNumber}</span>
                    <StatusBadge status={rfq.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{rfq.projectName}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/quotes/${rfq.quotesGeneratedIds[0] || 'qte_2025_8819'}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    View Generated Quote
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Product & Quantity</span>
                  <strong className="text-slate-200 block">{rfq.items[0]?.productName[langKey]}</strong>
                  <span className="text-slate-400">{rfq.items[0]?.quantity} Units Batch</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Logistics Scope</span>
                  <strong className="text-slate-200 block">{rfq.incotermsRequested} Terms</strong>
                  <span className="text-slate-400">{rfq.destinationPort}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Requested Delivery Target</span>
                  <strong className="text-amber-400 block">{rfq.requestedDeliveryDate}</strong>
                  <span className="text-slate-400">Created: {rfq.createdAt.split('T')[0]}</span>
                </div>
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
      <RfqListContent />
    </WorkspaceProvider>
  );
}
