'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { StatusBadge, PermissionDeniedCard } from '@/components/ui/StateCards';
import { MOCK_QUOTES } from '@/lib/adapters/mockData';
import { fetchApi } from '@/lib/api-client';
import {
  FileCheck2,
  CheckCircle2,
  Scale,
  Calendar,
  ShieldCheck,
  History,
  FileText,
} from 'lucide-react';

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <QuoteDetailInner quoteId={params.id} />
    </WorkspaceProvider>
  );
}


function normalizeLiveQuote(raw: any) {
  const versions = Array.isArray(raw.versionHistory)
    ? raw.versionHistory.map((v: any) => ({
        versionNumber: v.version,
        issuedAt: v.createdAt,
        validUntil: v.validUntil,
        lineItems: [],
        subtotalUsd: v.subtotal,
        seaFreightEstimateUsd: v.shipping,
        customsInsuranceEstimateUsd: { amountCents: 0, currency: v.currency },
        discountUsd: { amountCents: 0, currency: v.currency },
        totalUsd: v.total,
        incoterms: raw.incotermsRequested || 'FOB',
        paymentTermsNote: v.notes || 'Commercial terms recorded on the authenticated WUCHAN quote.',
        validityDays: Math.max(1, Math.ceil((new Date(v.validUntil).getTime() - new Date(v.createdAt).getTime()) / 86400000)),
        sellerNotes: v.notes || 'No additional seller notes were provided.'
      }))
    : [];

  const current = raw.currentVersion;
  return {
    id: raw.id,
    quoteNumber: raw.quoteNumber,
    rfqId: raw.rfqId,
    rfqNumber: raw.rfqNumber,
    projectName: raw.projectName || raw.rfqNumber || 'Commercial Quote',
    organizationId: raw.organizationId,
    status: raw.status,
    acceptedAt: raw.acceptedAt,
    purchaseOrderRef: raw.purchaseOrderRef,
    currentVersion: versions.find((v: any) => v.versionNumber === raw.currentVersionNumber) || (current ? {
      versionNumber: current.version,
      issuedAt: current.createdAt,
      validUntil: current.validUntil,
      lineItems: [],
      subtotalUsd: current.subtotal,
      seaFreightEstimateUsd: current.shipping,
      customsInsuranceEstimateUsd: { amountCents: 0, currency: current.currency },
      discountUsd: { amountCents: 0, currency: current.currency },
      totalUsd: current.total,
      incoterms: raw.incotermsRequested || 'FOB',
      paymentTermsNote: current.notes || 'Commercial terms recorded on the authenticated WUCHAN quote.',
      validityDays: Math.max(1, Math.ceil((new Date(current.validUntil).getTime() - new Date(current.createdAt).getTime()) / 86400000)),
      sellerNotes: current.notes || 'No additional seller notes were provided.'
    } : null),
    versionHistory: versions,
  };
}

function QuoteDetailInner({ quoteId }: { quoteId: string }) {
  const { currency, language, currentUser, isAuthenticated } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const demoQuote = MOCK_QUOTES.find((q) => q.id === quoteId) || MOCK_QUOTES[0];
  const [liveQuote, setLiveQuote] = useState<any | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [poRef, setPoRef] = useState(demoQuote.purchaseOrderRef || 'PO-HORIZON-2025-004');
  const [demoApprovalQueued, setDemoApprovalQueued] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !/^[0-9a-fA-F-]{36}$/.test(quoteId)) {
      return;
    }

    let mounted = true;
    setLiveLoading(true);
    setLiveError('');

    void fetchApi<any>('/quotes/' + quoteId)
      .then((response) => {
        if (!mounted || !response.data) return;
        setLiveQuote(normalizeLiveQuote(response.data));
        setPoRef(response.data.purchaseOrderRef || '');
      })
      .catch((err) => {
        if (mounted) {
          setLiveError(err instanceof Error ? err.message : 'Unable to load the authenticated quote.');
        }
      })
      .finally(() => {
        if (mounted) setLiveLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, quoteId]);

  const quote = liveQuote || demoQuote;
  const version = quote.currentVersion;
  const isAccepted = quote.status === 'ACCEPTED';

  const canApprove = ['PROCUREMENT_LEAD', 'FINANCE_OFFICER', 'CUSTOMER_BUYER', 'CUSTOMER_PROJECT_MANAGER', 'ORG_OWNER', 'ORG_ADMIN']
    .includes(currentUser.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">{quote.quoteNumber}</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/60 rounded text-[10px] font-mono font-bold">
                  Version {version.versionNumber} (Latest)
                </span>
                <StatusBadge status={isAccepted ? 'ACCEPTED' : quote.status} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 mt-1">{quote.projectName}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Issued for RFQ {quote.rfqNumber} • Valid until {version.validUntil.split('T')[0]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/quotes/${quote.id}/compare`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4 text-blue-400" />
                Version Matrix (v1 vs v2)
              </Link>

              {!isAccepted ? (
                <button
                  onClick={() => setIsAcceptModalOpen(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Approve & Accept Commercial Quote
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Accepted on {quote.acceptedAt?.split('T')[0]}
                </div>
              )}
            </div>
          </div>

          {version.changesSummaryFromPrevious && (
            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl flex items-start gap-2 text-xs text-blue-300">
              <History className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200">Version 2 Revision Notes:</strong>
                <span>{version.changesSummaryFromPrevious}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Subtotal (Equipment)</span>
              <strong className="text-slate-100 text-base block font-mono">
                {formatCurrency(version.subtotalUsd, currency)}
              </strong>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Shipping / Logistics ({version.incoterms})</span>
              <strong className="text-blue-400 text-base block font-mono">
                +{formatCurrency({ amountCents: version.seaFreightEstimateUsd.amountCents + version.customsInsuranceEstimateUsd.amountCents, currency: version.seaFreightEstimateUsd.currency }, currency)}
              </strong>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Volume Batch Discount</span>
              <strong className="text-emerald-400 text-base block font-mono">
                -{formatCurrency(version.discountUsd, currency)}
              </strong>
            </div>

            <div className="p-4 bg-slate-950 border border-blue-900/60 rounded-xl space-y-1 bg-blue-950/20">
              <span className="text-[10px] text-blue-400 uppercase font-mono font-bold block">Total Commercial Amount</span>
              <strong className="text-white text-xl block font-mono">
                {formatCurrency(version.totalUsd, currency)}
              </strong>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Itemized Equipment & Logistics Line Items
          </h2>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Line Description</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Unit Price ({currency})</th>
                  <th className="p-3">Lead Time</th>
                  <th className="p-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {version.lineItems.length > 0 ? version.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/40">
                    <td className="p-3 space-y-1">
                      <strong className="text-slate-100 block">{item.productName[langKey]}</strong>
                      <span className="text-[10px] text-slate-400 font-mono block">{item.productSku}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-200">{item.quantity} Units</td>
                    <td className="p-3 font-mono text-slate-200">{formatCurrency(item.unitPriceUsd, currency)}</td>
                    <td className="p-3 font-mono text-emerald-400">{item.leadTimeDays} Days</td>
                    <td className="p-3 font-mono text-right text-white font-bold">
                      {formatCurrency(item.totalPriceUsd, currency)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-slate-500">
                      Detailed line-item pricing is not exposed by this quote snapshot yet. No values are fabricated in the authenticated view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Payment Schedule & Commercial Terms
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4">
              {version.paymentTermsNote}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Seller Notes & Engineering Remarks
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4">
              {version.sellerNotes}
            </p>
          </div>
        </div>

        {liveLoading && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200">
            Loading the authenticated quote record…
          </div>
        )}

        {liveError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
            {liveError}
          </div>
        )}

        {demoApprovalQueued && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-blue-500/30 bg-slate-900 p-4 text-xs text-blue-200 shadow-2xl">
            <strong className="block text-white">Demo action queued</strong>
            <p className="mt-1 leading-relaxed">No quote status changed. In the live workspace, this action will call the authenticated API and display the new state only after server confirmation.</p>
          </div>
        )}

        {isAcceptModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  Approve Commercial Proposal {quote.quoteNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Accepting this quote generates order record <strong>ORD-2025-9912</strong> and unlocks the deposit invoice.
                </p>
              </div>

              {!canApprove ? (
                <PermissionDeniedCard
                  title="Approval Permission Restricted"
                  message="Only users with the PROCUREMENT_LEAD or FINANCE_OFFICER role can authorize commercial quote acceptances."
                />
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Customer Purchase Order (PO) Reference Number</label>
                    <input
                      type="text"
                      required
                      value={poRef}
                      onChange={(e) => setPoRef(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-amber-300 space-y-1">
                    <strong className="block text-amber-200">Financial Commitment Disclaimer:</strong>
                    <p className="text-[11px] leading-relaxed">
                      Acceptance records the customer’s commercial approval. It does not fabricate an order or payment. The next controlled lifecycle stage is contract preparation.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsAcceptModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={accepting}
                      onClick={async () => {
                        if (!liveQuote) {
                          setDemoApprovalQueued(true);
                          setIsAcceptModalOpen(false);
                          return;
                        }

                        setAccepting(true);
                        setLiveError('');
                        try {
                          const response = await fetchApi<any>('/quotes/' + quoteId + '/approve', {
                            method: 'POST',
                            body: JSON.stringify({ purchaseOrderRef: poRef }),
                          });

                          setLiveQuote((previous: any) => previous ? {
                            ...previous,
                            status: response.data?.status || 'ACCEPTED',
                            acceptedAt: response.data?.accepted_at || new Date().toISOString(),
                            purchaseOrderRef: response.data?.purchase_order_ref || poRef,
                          } : previous);
                          setIsAcceptModalOpen(false);
                        } catch (err) {
                          setLiveError(err instanceof Error ? err.message : 'Unable to accept the quote.');
                        } finally {
                          setAccepting(false);
                        }
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      {accepting ? 'Confirming…' : 'Confirm Commercial Approval'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
