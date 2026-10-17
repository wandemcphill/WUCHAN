'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileSignature, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

interface ContractRecord {
  id: string;
  contract_number: string;
  status: string;
  terms_text: string;
  deposit_bps: number | null;
  customer_signed_at: string | null;
  seller_signed_at: string | null;
  order_id?: string | null;
  order_number?: string | null;
  order_status?: string | null;
  order?: { id: string; order_number?: string; status?: string } | null;
  depositInvoice?: { id: string; invoice_number?: string; amount_cents?: number; status?: string } | null;
}

export function ContractExecutionPanel({
  quoteId,
  canSign,
}: {
  quoteId: string;
  canSign: boolean;
}) {
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [signing, setSigning] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetchApi<ContractRecord[]>('/contracts?quoteId=' + encodeURIComponent(quoteId));
      setContract(response.data?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the contract.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [quoteId]);

  async function sign() {
    if (!contract || !acknowledged) return;
    setSigning(true);
    setError('');
    try {
      const response = await fetchApi<ContractRecord>('/contracts/' + contract.id + '/sign', {
        method: 'POST',
        body: JSON.stringify({ acknowledged: true }),
      });
      setContract(response.data || contract);
      setAcknowledged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign the contract.');
    } finally {
      setSigning(false);
    }
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-blue-400" />
        Contract execution
      </h2>

      {loading && <p className="text-xs text-blue-200">Loading the contract for this accepted quote…</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}

      {!loading && !error && !contract && (
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4">
          The quote is accepted. The factory has not prepared a contract yet, so no order or invoice exists.
        </p>
      )}

      {contract && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-blue-300">{contract.contract_number}</span>
            <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-200">{contract.status}</span>
            {contract.deposit_bps ? (
              <span className="text-slate-400">Deposit {(contract.deposit_bps / 100).toFixed(2)}% of the frozen quote total</span>
            ) : null}
          </div>

          <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-64 overflow-auto">
            {contract.terms_text}
          </pre>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-300">
              Customer signature: {contract.customer_signed_at ? contract.customer_signed_at.slice(0, 10) : 'Waiting'}
            </p>
            <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-300">
              Factory signature: {contract.seller_signed_at ? contract.seller_signed_at.slice(0, 10) : 'Waiting'}
            </p>
          </div>

          {(contract.order?.id || contract.order_id) && (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-emerald-200 space-y-2">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Order {contract.order?.order_number || contract.order_number || contract.order?.id || contract.order_id} is {contract.order?.status || contract.order_status || 'open'}
              </p>
              <Link href={'/orders/' + (contract.order?.id || contract.order_id)} className="inline-flex text-emerald-300 underline">
                Open the order and deposit invoice
              </Link>
            </div>
          )}

          {!contract.customer_signed_at && canSign && (
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5"
                />
                I am authorized to acknowledge these terms for the customer organization.
              </label>
              <button
                type="button"
                disabled={!acknowledged || signing}
                onClick={() => void sign()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
              >
                {signing ? 'Recording signature…' : 'Sign contract'}
              </button>
            </div>
          )}

          {!contract.customer_signed_at && !canSign && (
            <p className="text-amber-200">Your role can view this contract. Signing requires a buyer, owner, or admin.</p>
          )}
        </div>
      )}
    </section>
  );
}
