'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatMinorUnits } from '@/lib/currency';
import { fetchApi } from '@/lib/api-client';
import { CatalogOption, CatalogProduct } from '@/lib/server/catalog';
import { priceBuild } from '@wuchan/validation';

const GROUP_LABELS: Record<string, string> = {
  COLOR: 'Color',
  SIZE: 'Size',
  LENGTH: 'Length',
  SPECIFICATION: 'Specification',
};

function PrefabBuilderInner({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const { organization, isAuthenticated, sessionLoading } = useWorkspace();
  const options = product.options || [];
  const groups = useMemo(() => {
    const map = new Map<string, CatalogOption[]>();
    for (const option of options) {
      const list = map.get(option.option_type) || [];
      list.push(option);
      map.set(option.option_type, list);
    }
    return Array.from(map.entries());
  }, [options]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [group, values] of groups) {
      const standard = values.find((value) => !value.requires_quote) || values[0];
      if (standard) initial[group] = standard.id;
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const optionIds = groups.map(([group]) => selected[group]).filter(Boolean);
  let priced: ReturnType<typeof priceBuild> | null = null;
  let priceError = '';
  try {
    priced = priceBuild({
      basePriceCents: product.base_price_cents,
      baseLeadTimeDays: product.lead_time_days,
      quantity,
      options,
      selectedOptionIds: optionIds,
      customNote,
    });
  } catch (cause) {
    priceError = cause instanceof Error ? cause.message : 'This configuration is not available.';
  }

  const orgReady = isAuthenticated && /^[0-9a-f-]{36}$/i.test(organization.id);
  const money = priced
    ? formatMinorUnits({ amountCents: priced.totalPriceCents, currency: product.currency })
    : '';

  async function placeOrder() {
    setError('');
    if (!orgReady) {
      setError('Sign in with your company account before placing this build.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetchApi<{ id: string; build_number: string; status: string }>(
        '/catalog/products/' + product.id + '/builds',
        {
          method: 'POST',
          body: JSON.stringify({
            organizationId: organization.id,
            quantity,
            optionIds,
            customNote: customNote.trim() || undefined,
          }),
        }
      );
      router.push('/builds?placed=' + encodeURIComponent(response.data?.build_number || ''));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The build could not be placed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-blue-300">{product.sku}</p>
            <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {product.description || 'Choose color, size, length, and specification. The factory receives the frozen build.'}
            </p>
          </div>
          <Link href="/build" className="text-sm text-slate-400 hover:text-slate-200">All buildable models</Link>
        </div>

        {options.length === 0 && (
          <p className="rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-100">
            This model has no published choices yet. The factory needs to add color, size, length, and specification options.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {groups.map(([group, values]) => (
              <section key={group} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">{GROUP_LABELS[group] || group}</h2>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {values.map((value) => {
                    const active = selected[group] === value.id;
                    const delta = Number(value.price_delta_cents);
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => setSelected((current) => ({ ...current, [group]: value.id }))}
                        className={`rounded-xl border p-3 text-left ${active ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950'}`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {value.swatch_hex && (
                            <span className="h-4 w-4 rounded-full border border-slate-600" style={{ backgroundColor: value.swatch_hex }} />
                          )}
                          {value.name}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {delta === 0 ? 'Included' : (delta > 0 ? '+' : '') + formatMinorUnits({ amountCents: delta, currency: product.currency })}
                          {' · '}
                          {Number(value.lead_time_delta_days) === 0 ? 'no added days' : `+${value.lead_time_delta_days} days`}
                          {value.requires_quote ? ' · quote required' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Anything outside these choices</h2>
              <textarea
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Custom length, site constraint, or a specification the list does not cover. This becomes a special order."
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-4 lg:sticky lg:top-24">
            <label className="block text-xs font-semibold text-slate-400">
              Quantity
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>

            {priced && (
              <div className="mt-4 space-y-2">
                <p className="text-2xl font-black text-emerald-300">{money}</p>
                <p className="text-sm text-slate-300">{priced.leadTimeDays} day lead time</p>
                <p className={`text-sm ${priced.isSpecial ? 'text-amber-300' : 'text-emerald-200'}`}>
                  {priced.isSpecial
                    ? 'Special order. The factory will send a quote before you proceed.'
                    : 'Standard order. This price and lead time are frozen when you place it.'}
                </p>
                <ul className="space-y-1 pt-2 text-xs text-slate-400">
                  {priced.selections.map((selection) => (
                    <li key={selection.id}>{GROUP_LABELS[selection.optionType] || selection.optionType}: {selection.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {priceError && <p className="mt-4 text-sm text-amber-200">{priceError}</p>}
            {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

            {sessionLoading && <p className="mt-4 text-xs text-slate-400">Checking your company session…</p>}
            {!sessionLoading && !orgReady && (
              <p className="mt-4 text-sm text-slate-300">
                <Link href="/login" className="text-blue-300 underline">Sign in</Link> to place this build for your company.
              </p>
            )}

            <button
              type="button"
              disabled={!priced || submitting || sessionLoading}
              onClick={() => void placeOrder()}
              className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? 'Placing build…' : priced?.isSpecial ? 'Send special request' : 'Place order'}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function PrefabBuilder({ product }: { product: CatalogProduct }) {
  return (
    <WorkspaceProvider>
      <PrefabBuilderInner product={product} />
    </WorkspaceProvider>
  );
}
