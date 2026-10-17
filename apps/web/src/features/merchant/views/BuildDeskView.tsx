'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatMinorUnits } from '@/lib/currency';

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  organization_id: string;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP' | 'AUD';
}

interface BuildRow {
  id: string;
  build_number: string;
  product_name: string;
  status: string;
  is_special: boolean;
  quantity: number;
  currency: ProductRow['currency'];
  catalog_price_cents: number | string;
  lead_time_days: number;
  custom_note: string | null;
  selected_options: { optionType: string; name: string }[];
}

const OPTION_TYPES = ['COLOR', 'SIZE', 'LENGTH', 'SPECIFICATION'] as const;

function centsFromInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function BuildDeskView() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [productId, setProductId] = useState('');
  const [optionType, setOptionType] = useState<(typeof OPTION_TYPES)[number]>('COLOR');
  const [name, setName] = useState('');
  const [delta, setDelta] = useState('0');
  const [days, setDays] = useState('0');
  const [requiresQuote, setRequiresQuote] = useState(false);
  const [swatch, setSwatch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [productRes, buildRes] = await Promise.all([
        fetchApi<ProductRow[]>('/catalog/products'),
        fetchApi<BuildRow[]>('/catalog/builds'),
      ]);
      const nextProducts = productRes.data || [];
      setProducts(nextProducts);
      setBuilds(buildRes.data || []);
      setProductId((current) => current || nextProducts[0]?.id || '');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The build desk could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addOption(event: React.FormEvent) {
    event.preventDefault();
    const priceDeltaCents = centsFromInput(delta);
    const leadTimeDeltaDays = Number(days);
    if (!productId || !name.trim() || priceDeltaCents == null || !Number.isInteger(leadTimeDeltaDays)) {
      setError('Enter a choice name, a price such as 1200.00, and whole days.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await fetchApi('/catalog/products/' + productId + '/options', {
        method: 'POST',
        body: JSON.stringify({
          optionType,
          name: name.trim(),
          priceDeltaCents,
          leadTimeDeltaDays,
          requiresQuote,
          swatchHex: swatch.trim() || undefined,
        }),
      });
      setName('');
      setNotice('Choice published. Customers can use it on the next build.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The choice could not be published.');
    } finally {
      setBusy(false);
    }
  }

  async function sendQuote(buildId: string, form: FormData) {
    const priceCents = centsFromInput(String(form.get('price') || ''));
    const leadTimeDays = Number(form.get('lead'));
    if (priceCents == null || !Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setError('A quote needs a price like 52000.00 and a lead time of at least 1 day.');
      return;
    }
    const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    setBusy(true);
    setError('');
    try {
      await fetchApi('/catalog/builds/' + buildId + '/quote', {
        method: 'POST',
        body: JSON.stringify({
          priceCents,
          leadTimeDays,
          note: String(form.get('note') || ''),
          validUntil,
        }),
      });
      setNotice('Quote sent. The customer can accept it from their builds.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The quote could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  const incoming = builds.filter((build) => build.status === 'RECEIVED' || build.status === 'QUOTE_NEEDED' || build.status === 'QUOTED' || build.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Customer builds</h2>
        <p className="mt-1 text-xs text-slate-400">
          Publish color, size, length, and specification choices. Standard orders arrive with a frozen price. Special orders wait here for a quote.
        </p>
      </div>
      {loading && <p className="text-sm text-slate-400">Loading the build desk…</p>}
      {error && <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-100">{notice}</p>}

      <form onSubmit={(event) => void addOption(event)} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-2">
        <label className="text-xs text-slate-400 md:col-span-2">
          Model
          <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            {products.length === 0 && <option value="">No products</option>}
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.sku} — {product.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Group
          <select value={optionType} onChange={(event) => setOptionType(event.target.value as typeof optionType)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            {OPTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Choice name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100" placeholder="Graphite, 12 m, Extreme cold" />
        </label>
        <label className="text-xs text-slate-400">
          Price change (major units)
          <input value={delta} onChange={(event) => setDelta(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100" placeholder="1200.00" />
        </label>
        <label className="text-xs text-slate-400">
          Extra days
          <input value={days} onChange={(event) => setDays(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </label>
        <label className="text-xs text-slate-400">
          Color swatch
          <input value={swatch} onChange={(event) => setSwatch(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100" placeholder="#2C3338" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={requiresQuote} onChange={(event) => setRequiresQuote(event.target.checked)} />
          This choice needs a factory quote
        </label>
        <button disabled={busy || !productId} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Publish choice</button>
      </form>

      {incoming.length === 0 && !loading && <p className="text-sm text-slate-400">No customer builds for this organization yet.</p>}
      <div className="space-y-3">
        {incoming.map((build) => (
          <article key={build.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-blue-300">{build.build_number}</p>
                <h3 className="font-bold text-white">{build.product_name}</h3>
                <p className="text-xs text-slate-400">qty {build.quantity} · {build.status} · {build.is_special ? 'special' : 'standard'}</p>
              </div>
              <p className="text-sm text-emerald-300">
                {formatMinorUnits({ amountCents: Number(build.catalog_price_cents), currency: build.currency })} catalog · {build.lead_time_days} days
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              {(build.selected_options || []).map((option) => option.optionType + ': ' + option.name).join(' · ')}
            </p>
            {build.custom_note && <p className="mt-2 text-sm text-amber-100">{build.custom_note}</p>}
            {build.status === 'QUOTE_NEEDED' && (
              <form
                className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendQuote(build.id, new FormData(event.currentTarget));
                }}
              >
                <input name="price" placeholder="Quote price" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm" />
                <input name="lead" placeholder="Lead days" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm" />
                <input name="note" placeholder="Note to customer" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm" />
                <button disabled={busy} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Send quote</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
