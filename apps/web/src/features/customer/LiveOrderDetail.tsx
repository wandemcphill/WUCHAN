'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, PackageCheck } from 'lucide-react';
import { OrderState } from '@wuchan/contracts';
import { fetchApi } from '@/lib/api-client';
import { formatMinorUnits } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/StateCards';

interface MoneyValue {
  amountCents: number;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP' | 'AUD';
}

interface LiveOrder {
  id: string;
  orderNumber: string;
  status: OrderState;
  quoteNumber?: string;
  contractNumber?: string;
  subtotal: MoneyValue;
  tax: MoneyValue;
  shipping: MoneyValue;
  total: MoneyValue;
  deposit: MoneyValue;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    milestone: string | null;
    amount: MoneyValue;
    dueDate: string;
    status: string;
  }>;
}

const STAGES: OrderState[] = [
  'DEPOSIT_PENDING', 'CONFIRMED', 'ENGINEERING', 'PRODUCTION', 'QC', 'READY_TO_SHIP',
  'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'INSTALLATION', 'COMPLETED',
];

export function LiveOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void fetchApi<LiveOrder>('/orders/' + orderId)
      .then((response) => {
        if (mounted) setOrder(response.data || null);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load the order.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) return <p className="text-sm text-blue-200">Loading the order record…</p>;
  if (error || !order) return <p className="text-sm text-red-300">{error || 'Order was not returned.'}</p>;

  const stageIndex = STAGES.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-300">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <h1 className="mt-1 text-2xl font-extrabold">Order opened from the executed contract</h1>
            <p className="mt-1 text-xs text-slate-400">
              Quote {order.quoteNumber || '—'} · Contract {order.contractNumber || '—'}
            </p>
          </div>
          <Link href={'/orders/' + order.id + '/payments'} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold">
            <CreditCard className="h-4 w-4 text-amber-300" />
            Deposit invoice
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-xs">
          <Amount label="Subtotal" value={order.subtotal} />
          <Amount label="Tax" value={order.tax} />
          <Amount label="Shipping" value={order.shipping} />
          <Amount label="Frozen total" value={order.total} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <PackageCheck className="h-4 w-4 text-blue-300" />
          Current lifecycle position
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage, index) => (
            <div key={stage} className={`min-w-24 rounded-lg border px-2 py-2 text-center text-[10px] ${index === stageIndex ? 'border-blue-400 text-blue-200' : index < stageIndex ? 'border-emerald-800 text-emerald-300' : 'border-slate-800 text-slate-500'}`}>
              {stage}
            </div>
          ))}
        </div>
        {stageIndex < 0 && (
          <p className="mt-3 text-xs text-amber-200">Status {order.status} is outside the forward production path.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <h2 className="text-sm font-bold">Invoices</h2>
        {order.invoices.length === 0 && <p className="text-xs text-slate-400">No invoice has been issued for this order.</p>}
        {order.invoices.map((invoice) => (
          <div key={invoice.id} className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-blue-300">{invoice.invoiceNumber}</span>
            <span>{invoice.milestone || 'Milestone'}</span>
            <span>{formatMinorUnits(invoice.amount)}</span>
            <span>Due {String(invoice.dueDate).slice(0, 10)}</span>
            <StatusBadge status={invoice.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Amount({ label, value }: { label: string; value: MoneyValue }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <span className="block text-[10px] uppercase text-slate-500">{label}</span>
      <strong className="font-mono text-slate-100">{formatMinorUnits(value)}</strong>
    </div>
  );
}
