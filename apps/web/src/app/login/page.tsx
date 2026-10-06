'use client';

import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-7">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">WUCHAN Workspace Access</h1>
            <p className="text-sm text-slate-400">
              Production authentication is intentionally not faked in this release candidate.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
            <div className="text-xs leading-5 text-slate-300">
              The customer and merchant workspaces currently use clearly labelled synthetic demo data.
              Supabase Auth and server-session wiring are the next production integration step.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-4 hover:bg-blue-600/20 transition"
            >
              <span className="block text-sm font-bold text-white">Customer Preview</span>
              <span className="mt-1 block text-xs text-slate-400">Open the procurement workspace demo</span>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-300">
                Enter preview <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/merchant/dashboard"
              className="rounded-xl border border-emerald-500/30 bg-emerald-600/10 px-4 py-4 hover:bg-emerald-600/20 transition"
            >
              <span className="block text-sm font-bold text-white">Merchant Preview</span>
              <span className="mt-1 block text-xs text-slate-400">Open the factory operations demo</span>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                Enter preview <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            No password, identity, payment, contract, or commercial approval is performed by these preview links.
          </p>
        </div>
      </main>
    </div>
  );
}
