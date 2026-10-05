'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { StatusBadge } from '@/components/ui/StateCards';
import { MOCK_ORDERS } from '@/lib/adapters/mockData';
import { OrderState } from '@wuchan/contracts';
import {
  PackageCheck,
  Clock,
  ShieldCheck,
  Truck,
  CreditCard,
} from 'lucide-react';

const ORDER_STAGES: { key: OrderState; label: string; responsible: 'CUSTOMER' | 'FACTORY' | 'LOGISTICS' | 'LEGAL' }[] = [
  { key: 'DRAFT', label: 'Draft', responsible: 'CUSTOMER' },
  { key: 'QUOTED', label: 'Quoted', responsible: 'FACTORY' },
  { key: 'ACCEPTED', label: 'Accepted', responsible: 'CUSTOMER' },
  { key: 'CONTRACT_PENDING', label: 'Contract Pending', responsible: 'LEGAL' },
  { key: 'DEPOSIT_PENDING', label: 'Deposit Pending', responsible: 'CUSTOMER' },
  { key: 'CONFIRMED', label: 'Order Confirmed', responsible: 'FACTORY' },
  { key: 'ENGINEERING', label: 'Engineering & Stamping', responsible: 'FACTORY' },
  { key: 'PRODUCTION', label: 'Factory Fabrication', responsible: 'FACTORY' },
  { key: 'QC', label: 'Quality Inspection', responsible: 'FACTORY' },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', responsible: 'FACTORY' },
  { key: 'SHIPPED', label: 'Port Departure', responsible: 'LOGISTICS' },
  { key: 'IN_TRANSIT', label: 'Ocean Transit', responsible: 'LOGISTICS' },
  { key: 'ARRIVED', label: 'Destination Port', responsible: 'LOGISTICS' },
  { key: 'DELIVERED', label: 'Site Delivery', responsible: 'LOGISTICS' },
  { key: 'INSTALLATION', label: 'Site Assembly', responsible: 'CUSTOMER' },
  { key: 'COMPLETED', label: 'Handed Over', responsible: 'CUSTOMER' },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <OrderDetailInner orderId={params.id} />
    </WorkspaceProvider>
  );
}

function OrderDetailInner({ orderId }: { orderId: string }) {
  const { currency } = useWorkspace();

  const order = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];

  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.key === order.state);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">{order.orderNumber}</span>
                <StatusBadge status={order.state} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 mt-1">{order.projectName}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Accepted Quote {order.quoteNumber} • 12 Units Space Capsule X7
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/orders/${order.id}/payments`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment Milestones & Invoices
              </Link>
              <Link
                href={`/orders/${order.id}/shipment`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                Live Container Shipment
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-400" />
              16-Stage B2B Order Lifecycle Timeline
            </h2>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-2 min-w-[1000px] py-2">
                {ORDER_STAGES.map((stg, i) => {
                  const isDone = i < currentStageIndex;
                  const isCurrent = i === currentStageIndex;

                  return (
                    <div key={stg.key} className="flex-1 flex flex-col items-center relative text-center">
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold mb-1 transition ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>

                      <span
                        className={`text-[10px] font-semibold leading-tight line-clamp-2 max-w-[70px] ${
                          isCurrent ? 'text-blue-400' : isDone ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {stg.label}
                      </span>

                      <span className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">
                        {stg.responsible}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Historical Order State Audit Log
            </h2>

            <div className="space-y-3">
              {order.stateHistory.map((hist, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 font-bold">{hist.state}</span>
                    <span className="text-[10px] font-mono text-slate-500">{hist.timestamp.replace('T', ' ').split('.')[0]}</span>
                  </div>
                  <div className="text-slate-300 font-medium">Updated by: {hist.updatedBy}</div>
                  {hist.notes && <p className="text-slate-400 text-[11px]">{hist.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Assigned Account Responsibility
            </h2>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
                <img
                  src={order.responsibleAccountManager.avatarUrl}
                  alt="Account Manager"
                  className="w-12 h-12 rounded-full object-cover border border-slate-800"
                />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Commercial Account Director</span>
                  <strong className="text-slate-100 text-sm block">{order.responsibleAccountManager.name}</strong>
                  <span className="text-slate-400">{order.responsibleAccountManager.email}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
                <img
                  src={order.responsibleFactoryEngineer.avatarUrl}
                  alt="Factory Engineer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-800"
                />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Factory Chief Structural Engineer</span>
                  <strong className="text-slate-100 text-sm block">{order.responsibleFactoryEngineer.name}</strong>
                  <span className="text-slate-400">{order.responsibleFactoryEngineer.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
