'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { WorkspaceProvider } from '@/lib/context';
import { formatMinorUnits } from '@/lib/currency';
import { fetchApi } from '@/lib/api-client';

interface BuildRow {
  id: string;
  build_number: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  status: string;
  is_special: boolean;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP' | 'AUD';
  catalog_price_cents: number | string;
  lead_time_days: number;
  quoted_price_cents: number | string | null;
  quoted_lead_time_days: number | null;
  quote_note: string | null;
  quote_valid_until: string | null;
  custom_note: string | null;
  selected_options: { optionType: string; name: string }[];
}

function money(cents: number | string, currency: BuildRow['currency']) {
  return formatMinorUnits({ amountCents: Number(cents), currency });
}

function BuildsInner() {
  const placed = useSearchParams().get('placed');
  const [rows, setRows] = useState<BuildRow[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      const response = await fetchApi<BuildRow[]>('/catalog/builds');
      setRows(response.data || []);
      setError('');
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'Builds could not be loaded.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function accept(id: string) {
    setBusyId(id);
    try {
      await fetchApi('/catalog/builds/' + id + '/accept', { method: 'POST' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The quote could not be accepted.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Your builds</h1>
            <p className="mt-1 text-sm text-slate-400">Orders the factory has received, and special quotes waiting for your decision.</p>
          </div>
          <Link href="/build" className="text-sm text-blue-300">Build another model</Link>
        </div>
        {placed && <p className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-100">Placed {placed}.</p>}
        {error && <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
        {rows === null && <p className="text-sm text-slate-400">Loading builds…</p>}
        {rows?.length === 0 && !error && <p className="text-sm text-slate-400">No builds yet.</p>}
        <div className="space-y-3">
          {rows?.map((row) => {
            const firm = row.status === 'QUOTED' || row.status === 'ACCEPTED';
            const price = firm && row.quoted_price_cents != null ? row.quoted_price_cents : row.catalog_price_cents;
            const days = firm && row.quoted_lead_time_days != null ? row.quoted_lead_time_days : row.lead_time_days;
            return (
              <article key={row.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-blue-300">{row.build_number}</p>
                    <h2 className="text-lg font-bold">{row.product_name}</h2>
                    <p className="text-xs text-slate-400">{row.product_sku} · qty {row.quantity} · {row.status.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-300">{money(price, row.currency)}</p>
                    <p className="text-xs text-slate-400">{days} days{row.is_special && !firm ? ' · catalog estimate' : ''}</p>
                  </div>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  {(row.selected_options || []).map((option) => (
                    <li key={option.optionType + option.name} className="rounded-full border border-slate-700 px-2 py-1">
                      {option.optionType}: {option.name}
                    </li>
                  ))}
                </ul>
                {row.custom_note && <p className="mt-2 text-sm text-amber-100">Custom note: {row.custom_note}</p>}
                {row.quote_note && <p className="mt-2 text-sm text-slate-300">Factory note: {row.quote_note}</p>}
                {row.status === 'QUOTED' && (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void accept(row.id)}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busyId === row.id ? 'Accepting…' : 'Accept quote and proceed'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function BuildsPage() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<p className="p-8 text-sm text-slate-400">Loading builds…</p>}>
        <BuildsInner />
      </Suspense>
    </WorkspaceProvider>
  );
}
