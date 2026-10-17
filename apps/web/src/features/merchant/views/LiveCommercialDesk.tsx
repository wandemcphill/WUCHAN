'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { getClientSession } from '@/lib/auth';
import { Currency } from '@wuchan/contracts';
import { formatMinorUnits } from '@/lib/currency';

interface RfqRow {
  id: string;
  rfq_number: string;
  title: string;
  status: string;
  destination_port?: string;
  incoterms_requested?: string;
}

interface QuoteRow {
  id: string;
  quote_number: string;
  rfq_id: string;
  status: string;
  current_version: number;
}

interface ContractRow {
  id: string;
  quote_id: string;
  contract_number: string;
  status: string;
  terms_text: string;
  deposit_bps: number | null;
  seller_signed_at: string | null;
  customer_signed_at: string | null;
  order_id?: string | null;
  order_number?: string | null;
  order_status?: string | null;
  order?: { id: string; order_number?: string; status?: string } | null;
}

const emptyMoney = { subtotal: '1000000', tax: '0', shipping: '250000' };

export function LiveCommercialDesk() {
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState('');
  const [money, setMoney] = useState(emptyMoney);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('Commercial offer issued from the factory desk.');
  const [selectedQuote, setSelectedQuote] = useState('');
  const [terms, setTerms] = useState(
    'The factory will fabricate the accepted configuration. The deposit invoice is due before engineering release. Remaining milestones are issued only by a later approved change. Title remains with the factory until the deposit is verified by finance.'
  );
  const [depositBps, setDepositBps] = useState('3000');
  const [acknowledge, setAcknowledge] = useState(false);

  async function load() {
    const [rfqRes, quoteRes, contractRes] = await Promise.all([
      fetchApi<RfqRow[]>('/rfq'),
      fetchApi<QuoteRow[]>('/quotes'),
      fetchApi<ContractRow[]>('/contracts'),
    ]);
    setRfqs(rfqRes.data || []);
    setQuotes(quoteRes.data || []);
    setContracts(contractRes.data || []);
    setSelectedRfq((current) => current || rfqRes.data?.[0]?.id || '');
    setSelectedQuote((current) => current || quoteRes.data?.find((quote) => quote.status === 'ACCEPTED')?.id || '');
  }

  useEffect(() => {
    let mounted = true;
    void getClientSession().then(async (session) => {
      if (!mounted) return;
      setAuthenticated(Boolean(session));
      setSessionReady(true);
      if (!session) return;
      try {
        await load();
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load the commercial desk.');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The commercial action failed.');
    } finally {
      setBusy(false);
    }
  }

  function quotePayload() {
    const subtotal = Number(money.subtotal);
    const tax = Number(money.tax);
    const shipping = Number(money.shipping);
    return {
      rfqId: selectedRfq,
      validUntil: new Date(validUntil).toISOString(),
      notes,
      subtotal: { amountCents: subtotal, currency: Currency.USD },
      tax: { amountCents: tax, currency: Currency.USD },
      shipping: { amountCents: shipping, currency: Currency.USD },
      total: { amountCents: subtotal + tax + shipping, currency: Currency.USD },
    };
  }

  if (!sessionReady) {
    return <p className="text-sm text-blue-200">Checking the factory session…</p>;
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-amber-800 bg-amber-950/40 p-6 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
        <p>The live commercial desk requires a signed-in factory user. The sample queue on the other quotes screen is not a substitute.</p>
        <Link href="/login" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  const totalCents = Number(money.subtotal) + Number(money.tax) + Number(money.shipping);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Live commercial desk</h2>
        <p className="mt-1 text-xs text-slate-400">
          Issue a quote, prepare a contract from an accepted quote, and sign for the factory. Orders appear only after both parties sign.
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-200">{notice}</p>}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <h3 className="text-sm font-bold text-amber-300">Assigned RFQs ({rfqs.length})</h3>
          {rfqs.length === 0 && <p className="text-xs text-slate-400">No RFQs are visible to this factory yet.</p>}
          {rfqs.map((rfq) => (
            <button
              key={rfq.id}
              type="button"
              onClick={() => setSelectedRfq(rfq.id)}
              className={`block w-full rounded-lg border p-3 text-left text-xs ${selectedRfq === rfq.id ? 'border-blue-500 bg-blue-950/30' : 'border-slate-800 bg-slate-950'}`}
            >
              <span className="font-mono text-blue-300">{rfq.rfq_number}</span>
              <span className="mt-1 block text-slate-100">{rfq.title}</span>
              <span className="mt-1 block text-slate-400">{rfq.status} · {rfq.incoterms_requested} · {rfq.destination_port}</span>
            </button>
          ))}
        </div>

        <form
          className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-xs lg:col-span-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await fetchApi('/quotes/from-rfq', { method: 'POST', body: JSON.stringify(quotePayload()) });
              setNotice('Quote issued. The customer can now review the frozen version.');
            });
          }}
        >
          <h3 className="text-sm font-bold text-white">Issue quote version 1</h3>
          <p className="text-slate-400">Amounts are integer cents. Total {Number.isFinite(totalCents) ? formatMinorUnits({ amountCents: totalCents, currency: Currency.USD }) : '—'}</p>
          <label className="block text-slate-400">Subtotal cents
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={money.subtotal} onChange={(event) => setMoney({ ...money, subtotal: event.target.value })} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-slate-400">Tax cents
              <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={money.tax} onChange={(event) => setMoney({ ...money, tax: event.target.value })} />
            </label>
            <label className="block text-slate-400">Shipping cents
              <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={money.shipping} onChange={(event) => setMoney({ ...money, shipping: event.target.value })} />
            </label>
          </div>
          <label className="block text-slate-400">Valid until
            <input type="datetime-local" required className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
          </label>
          <label className="block text-slate-400">Notes
            <textarea className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <button disabled={busy || !selectedRfq} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">Issue quote</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h3 className="text-sm font-bold text-white">Quotes ({quotes.length})</h3>
        {quotes.length === 0 && <p className="text-xs text-slate-400">No quotes have been issued by this organization.</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quotes.map((quote) => (
            <button
              key={quote.id}
              type="button"
              onClick={() => setSelectedQuote(quote.id)}
              className={`rounded-lg border p-3 text-left text-xs ${selectedQuote === quote.id ? 'border-blue-500' : 'border-slate-800'}`}
            >
              <span className="font-mono text-blue-300">{quote.quote_number}</span>
              <span className="mt-1 block text-slate-200">{quote.status} · version {quote.current_version}</span>
            </button>
          ))}
        </div>
        <form
          className="space-y-3 text-xs"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await fetchApi('/contracts/from-quote', {
                method: 'POST',
                body: JSON.stringify({
                  quoteId: selectedQuote,
                  termsText: terms,
                  depositBps: Number(depositBps),
                }),
              });
              setNotice('Contract drafted. It can be signed, and the order opens only after both parties sign.');
            });
          }}
        >
          <label className="block text-slate-400">Deposit basis points (3000 = 30.00%)
            <input className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={depositBps} onChange={(event) => setDepositBps(event.target.value)} />
          </label>
          <label className="block text-slate-400">Contract terms
            <textarea className="mt-1 min-h-28 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100" value={terms} onChange={(event) => setTerms(event.target.value)} />
          </label>
          <button disabled={busy || !selectedQuote} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">Draft contract from accepted quote</button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-white">Contracts ({contracts.length})</h3>
        {contracts.length === 0 && <p className="text-xs text-slate-400">No contracts are waiting on this factory.</p>}
        {contracts.map((contract) => (
          <article key={contract.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-blue-300">{contract.contract_number}</span>
              <span className="rounded border border-slate-700 px-2 py-0.5">{contract.status}</span>
            </div>
            <p className="text-slate-400">Customer {contract.customer_signed_at ? 'signed' : 'has not signed'} · Factory {contract.seller_signed_at ? 'signed' : 'has not signed'}</p>
            {(contract.order?.id || contract.order_id) && (
              <Link className="text-emerald-300 underline" href={'/orders/' + (contract.order?.id || contract.order_id)}>
                Order {contract.order?.order_number || contract.order_number || contract.order_id} · {contract.order?.status || contract.order_status}
              </Link>
            )}
            {!contract.seller_signed_at && (
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-slate-300">
                  <input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} />
                  I acknowledge these terms for the factory.
                </label>
                <button
                  type="button"
                  disabled={!acknowledge || busy}
                  onClick={() => void run(async () => {
                    await fetchApi('/contracts/' + contract.id + '/sign', {
                      method: 'POST',
                      body: JSON.stringify({ acknowledged: true }),
                    });
                    setAcknowledge(false);
                    setNotice('Factory signature recorded.');
                  })}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  Sign for the factory
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
