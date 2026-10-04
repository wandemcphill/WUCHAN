'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  PackageX,
  ShieldAlert,
  AlertCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { MerchantAdapter } from '@wuchan/contracts';

interface DashboardViewProps {
  adapter: MerchantAdapter;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ adapter }) => {
  const actions = adapter.getDashboardActionItems();

  const cards = [
    {
      title: 'RFQs Awaiting Response',
      count: actions.rfqsAwaitingResponse.length,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      icon: <Clock className="w-5 h-5" />,
      detail: `${actions.rfqsAwaitingResponse.length} customer RFQs require quotation within SLA`,
      targetHref: '/merchant/quotes',
    },
    {
      title: 'Quotes Awaiting Decision',
      count: actions.quotesAwaitingDecision.length,
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      icon: <FileText className="w-5 h-5" />,
      detail: `${actions.quotesAwaitingDecision.length} quotes sent, pending customer sign-off`,
      targetHref: '/merchant/quotes',
    },
    {
      title: 'Orders Awaiting Payment',
      count: actions.ordersAwaitingPayment.length,
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      icon: <DollarSign className="w-5 h-5" />,
      detail: `${actions.ordersAwaitingPayment.length} orders awaiting deposit/milestone payment`,
      targetHref: '/merchant/orders',
    },
    {
      title: 'Orders At Risk',
      count: actions.ordersAtRisk.length,
      color: 'border-red-500/40 bg-red-500/10 text-red-400',
      icon: <AlertTriangle className="w-5 h-5" />,
      detail: `${actions.ordersAtRisk.length} active orders experiencing critical delays or QC risks`,
      targetHref: '/merchant/orders',
    },
    {
      title: 'Production Delays',
      count: actions.productionDelays.length,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      icon: <AlertCircle className="w-5 h-5" />,
      detail: `${actions.productionDelays.length} factory jobs behind schedule`,
      targetHref: '/merchant/production',
    },
    {
      title: 'QC Failures',
      count: actions.qcFailures.length,
      color: 'border-red-500/40 bg-red-500/10 text-red-400',
      icon: <ShieldAlert className="w-5 h-5" />,
      detail: `${actions.qcFailures.length} unresolved quality defects requiring action`,
      targetHref: '/merchant/production',
    },
    {
      title: 'Low Inventory Alert',
      count: actions.lowInventory.length,
      color: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
      icon: <PackageX className="w-5 h-5" />,
      detail: `${actions.lowInventory.length} materials/components below minimum safety threshold`,
      targetHref: '/merchant/inventory',
    },
    {
      title: 'Shipments Missing Docs',
      count: actions.shipmentsMissingDocs.length,
      color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
      icon: <Truck className="w-5 h-5" />,
      detail: `${actions.shipmentsMissingDocs.length} export containers missing required origin/customs docs`,
      targetHref: '/merchant/logistics',
    },
    {
      title: 'Customers Awaiting Response',
      count: actions.customersAwaitingResponse.length,
      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
      icon: <MessageSquare className="w-5 h-5" />,
      detail: `${actions.customersAwaitingResponse.length} unread customer inquiries`,
      targetHref: '/merchant/support',
    },
    {
      title: 'Overdue Invoices',
      count: actions.overdueInvoices.length,
      color: 'border-red-500/40 bg-red-500/10 text-red-400',
      icon: <DollarSign className="w-5 h-5" />,
      detail: `${actions.overdueInvoices.length} unpaid invoices past due date`,
      targetHref: '/merchant/orders',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Merchant Action Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized operational queue requiring immediate factory/seller intervention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Factory Line Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <Link
            key={index}
            href={card.targetHref}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${card.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-slate-900/60">{card.icon}</span>
                <span className="text-2xl font-black">{card.count}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{card.detail}</p>
            </div>
            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold">
              <span>View Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Critical Highlight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> At-Risk Order Directives
          </h3>
          <div className="space-y-2">
            {actions.ordersAtRisk.map((order) => (
              <div key={order.id} className="p-3 rounded-lg bg-slate-950 border border-red-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{order.orderNumber} — {order.customerName}</p>
                  <p className="text-[11px] text-red-400 mt-0.5">{order.riskReason}</p>
                </div>
                <Link
                  href="/merchant/orders"
                  className="px-3 py-1 text-[11px] font-semibold rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                >
                  Inspect Order
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Pending Quality Control Issues
          </h3>
          <div className="space-y-2">
            {actions.qcFailures.map((defect, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{defect.stage.toUpperCase()} Stage Inspection</p>
                  <p className="text-[11px] text-amber-300 mt-0.5">
                    {defect.defects?.[0]?.description || 'QC Inspection Failed'}
                  </p>
                </div>
                <Link
                  href="/merchant/production"
                  className="px-3 py-1 text-[11px] font-semibold rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                >
                  Resolve QC
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
