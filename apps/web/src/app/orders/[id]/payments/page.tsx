'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/StateCards';
import { MOCK_ORDERS } from '@/lib/adapters/mockData';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Upload,
  Clock,
  FileCheck2,
  ArrowLeft,
} from 'lucide-react';

export default function OrderPaymentsPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <OrderPaymentsInner orderId={params.id} />
    </WorkspaceProvider>
  );
}

function OrderPaymentsInner({ orderId }: { orderId: string }) {
  const { currency } = useWorkspace();

  const order = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];

  const [activeMilestones, setActiveMilestones] = useState(order.paymentMilestones);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [wireRef, setWireRef] = useState('DEMO-WIRE-REFERENCE');
  const [uploadedReceiptName, setUploadedReceiptName] = useState<string | null>(null);

  const handleUploadReceipt = () => {
    if (!selectedMilestoneId) return;

    setActiveMilestones((prev) =>
      prev.map((ms) =>
        ms.id === selectedMilestoneId
          ? {
              ...ms,
              status: 'RECEIPT_SUBMITTED',
              submittedAt: new Date().toISOString(),
              bankRefNumber: wireRef,
            }
          : ms
      )
    );
    setSelectedMilestoneId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={`/orders/${order.id}`}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Order {order.orderNumber}
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-100">Payment Milestones & Invoicing</h1>
            <p className="text-sm text-slate-400 mt-1">
              Milestone payment presentation with verified wire receipt upload workflows.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Milestone Schedule Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeMilestones.map((ms) => (
              <div
                key={ms.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-400 font-bold">{ms.percentage}% Stage</span>
                    <StatusBadge status={ms.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{ms.stageName}</h3>

                  <div className="text-2xl font-extrabold text-white font-mono">
                    {formatCurrency(ms.amountUsd, currency)}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Due Target: <strong className="text-slate-200">{ms.dueDate}</strong>
                  </div>

                  {ms.status === 'RECEIPT_SUBMITTED' && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 space-y-1">
                      <strong className="block text-amber-200 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Receipt Under Verification
                      </strong>
                      <p className="text-[11px] leading-relaxed">
                        Wire Ref: <span className="font-mono">{ms.bankRefNumber}</span>. Verification pending from WUCHAN Finance.
                      </p>
                    </div>
                  )}

                  {ms.status === 'VERIFIED_PAID' && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 space-y-1">
                      <strong className="block text-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Payment Confirmed
                      </strong>
                      <p className="text-[11px] leading-relaxed">
                        Ref: <span className="font-mono">{ms.bankRefNumber}</span>. Verified on {ms.verifiedAt?.split('T')[0]}.
                      </p>
                    </div>
                  )}
                </div>

                {ms.status === 'PENDING' && (
                  <button
                    onClick={() => setSelectedMilestoneId(ms.id)}
                    className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Wire Receipt
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Merchant Payment Instructions
            </h2>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Beneficiary bank details are never hardcoded into the application. They are supplied from the authenticated merchant invoice record and should be verified against the invoice before payment.
              </p>
              <p className="text-amber-300 text-[11px] leading-relaxed">
                Demo workspace: no live beneficiary or settlement details are displayed here.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Official Commercial Tax Invoices
            </h2>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Milestone Stage</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {order.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono text-blue-400 font-semibold">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-200">{inv.stageTitle}</td>
                      <td className="p-3 font-mono font-bold text-white">{formatCurrency(inv.amountUsd, currency)}</td>
                      <td className="p-3"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedMilestoneId && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Upload Wire Transfer Receipt
                </h3>
                <p className="text-xs text-slate-400">
                  Submit bank wire confirmation for milestone verification.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Bank Wire Reference / MT103 Number</label>
                  <input
                    type="text"
                    required
                    value={wireRef}
                    onChange={(e) => setWireRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div
                  onClick={() => setUploadedReceiptName('DEMO_WIRE_RECEIPT.pdf')}
                  className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer bg-slate-950/50 transition"
                >
                  <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <span className="font-semibold text-slate-200">
                    {uploadedReceiptName ? uploadedReceiptName : 'Select PDF/PNG Receipt File'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Bank wire slip with SWIFT confirmation</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedMilestoneId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadReceipt}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition"
                  >
                    Submit for Verification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
