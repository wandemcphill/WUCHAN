'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { formatMinorUnits } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/StateCards';

interface MoneyValue {
  amountCents: number;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP' | 'AUD';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  milestone: string | null;
  amount: MoneyValue;
  dueDate: string;
  status: string;
}

interface LiveOrder {
  id: string;
  orderNumber: string;
  invoices: Invoice[];
}

export function LiveOrderPayments({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reference, setReference] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  async function load() {
    const response = await fetchApi<LiveOrder>('/orders/' + orderId);
    setOrder(response.data || null);
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void load()
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load invoices.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderId]);

  async function submit(invoice: Invoice) {
    if (reference.trim().length < 8) {
      setError('Enter a wire reference of at least 8 characters. It is also the idempotency key.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await fetchApi('/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount,
          idempotencyKey: reference.trim(),
          paymentMethod: 'BANK_TRANSFER',
          reference: reference.trim(),
        }),
      });
      setNotice('Payment recorded as pending verification. Funds are not marked received.');
      setSelectedId(null);
      setReference('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record the payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-blue-200">Loading invoices…</p>;
  if (!order) return <p className="text-sm text-red-300">{error || 'Order was not returned.'}</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={'/orders/' + order.id} className="mb-2 inline-flex items-center gap-1 text-xs text-blue-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {order.orderNumber}
        </Link>
        <h1 className="text-3xl font-extrabold">Deposit invoice</h1>
        <p className="mt-1 text-sm text-slate-400">A submitted transfer stays pending until finance verifies it. This screen does not confirm receipt of funds.</p>
      </div>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">{error}</p>}
      {notice && <p className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-100">{notice}</p>}

      {order.invoices.length === 0 && (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">This order has no invoice yet.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {order.invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-blue-300">{invoice.invoiceNumber}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <h2 className="font-bold">{invoice.milestone || 'Invoice'}</h2>
            <p className="font-mono text-2xl">{formatMinorUnits(invoice.amount)}</p>
            <p className="text-xs text-slate-400">Due {String(invoice.dueDate).slice(0, 10)}</p>
            {invoice.status === 'UNPAID' && (
              <button type="button" onClick={() => setSelectedId(invoice.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                Record bank transfer
              </button>
            )}
            {invoice.status !== 'UNPAID' && invoice.status !== 'PAID' && (
              <p className="text-xs text-amber-200">Verification is still outstanding. The invoice is not paid.</p>
            )}
          </article>
        ))}
      </div>

      {selectedId && (
        <form
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 text-xs"
          onSubmit={(event) => {
            event.preventDefault();
            const invoice = order.invoices.find((item) => item.id === selectedId);
            if (invoice) void submit(invoice);
          }}
        >
          <h2 className="text-sm font-bold text-slate-100">Bank transfer reference</h2>
          <p className="text-slate-400">Beneficiary account details are not stored in this screen. Use the reference from your bank advice.</p>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-slate-100"
            placeholder="Bank reference"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSelectedId(null)} className="rounded-xl bg-slate-800 px-4 py-2">Cancel</button>
            <button disabled={submitting} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
