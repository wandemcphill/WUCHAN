'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_QUOTES } from '@/lib/adapters/mockData';
import {
  ArrowLeft,
  TrendingDown,
} from 'lucide-react';

export default function QuoteComparePage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <QuoteCompareInner quoteId={params.id} />
    </WorkspaceProvider>
  );
}

function QuoteCompareInner({ quoteId }: { quoteId: string }) {
  const { currency } = useWorkspace();

  const quote = MOCK_QUOTES.find((q) => q.id === quoteId) || MOCK_QUOTES[0];
  const v1 = quote.versionHistory[0];
  const v2 = quote.versionHistory[1] || quote.currentVersion;

  const totalDeltaUsd = v2.totalUsd - v1.totalUsd;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={`/quotes/${quote.id}`}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Quote {quote.quoteNumber}
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-100">Quote Version Comparison Matrix</h1>
            <p className="text-sm text-slate-400 mt-1">
              Historical revision diff: Version 1 vs Version 2 for project <strong className="text-slate-200">{quote.projectName}</strong>
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-950/30 border border-emerald-900/60 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-slate-100 text-sm block">Version 2 Price Savings & Freight Optimization</strong>
              <p className="text-slate-400">
                Applied $16,800 volume batch discount and reduced sea freight by $2,400 following ocean carrier contract update.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Net Commercial Savings</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {formatCurrency(Math.abs(totalDeltaUsd), currency)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="p-4 w-1/3 text-slate-400 font-mono text-[11px] uppercase">Commercial Field</th>
                <th className="p-4 w-1/3 border-l border-slate-800 bg-slate-900/40">
                  <span className="text-xs font-mono text-slate-400 block">Version 1 (Initial)</span>
                  <span className="text-[10px] text-slate-500 block">{v1.issuedAt.split('T')[0]}</span>
                </th>
                <th className="p-4 w-1/3 border-l border-slate-800 bg-blue-950/30">
                  <span className="text-xs font-mono text-blue-400 font-bold block">Version 2 (Current Active)</span>
                  <span className="text-[10px] text-blue-300/80 block">{v2.issuedAt.split('T')[0]}</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Unit Equipment Price</td>
                <td className="p-4 border-l border-slate-800 font-mono">
                  {formatCurrency(v1.lineItems[0].unitPriceUsd, currency)}
                </td>
                <td className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-bold bg-emerald-950/10">
                  {formatCurrency(v2.lineItems[0].unitPriceUsd, currency)} (-$1,400/unit)
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Equipment Subtotal</td>
                <td className="p-4 border-l border-slate-800 font-mono">
                  {formatCurrency(v1.subtotalUsd, currency)}
                </td>
                <td className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-bold bg-emerald-950/10">
                  {formatCurrency(v2.subtotalUsd, currency)}
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Sea Freight Estimate</td>
                <td className="p-4 border-l border-slate-800 font-mono">
                  {formatCurrency(v1.seaFreightEstimateUsd, currency)}
                </td>
                <td className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-bold bg-emerald-950/10">
                  {formatCurrency(v2.seaFreightEstimateUsd, currency)} (-$2,400)
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Applied Volume Discount</td>
                <td className="p-4 border-l border-slate-800 font-mono text-slate-500">$0</td>
                <td className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-bold bg-emerald-950/10">
                  -{formatCurrency(v2.discountUsd, currency)}
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Total Amount ({v2.incoterms})</td>
                <td className="p-4 border-l border-slate-800 font-mono font-bold text-slate-200">
                  {formatCurrency(v1.totalUsd, currency)}
                </td>
                <td className="p-4 border-l border-slate-800 font-mono font-extrabold text-white text-base bg-emerald-950/20">
                  {formatCurrency(v2.totalUsd, currency)}
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Production Lead Time</td>
                <td className="p-4 border-l border-slate-800 font-mono">43 Days</td>
                <td className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-bold bg-emerald-950/10">
                  40 Days (-3 Days)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
