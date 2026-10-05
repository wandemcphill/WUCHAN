'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS } from '@/lib/adapters/mockData';
import {
  Bookmark,
  Trash2,
  ArrowRight,
} from 'lucide-react';

function SavedContent() {
  const { currency, language, savedConfigIds, toggleSaveConfig } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const savedProducts = MOCK_PRODUCTS.filter((p) => savedConfigIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Project Saved Builds</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Saved Product Configurations</h1>
            <p className="text-sm text-slate-400 mt-1">
              Shortlisted models and customized spec configurations attached to your project workspace.
            </p>
          </div>

          <Link
            href="/products"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition self-start sm:self-auto flex items-center gap-1.5"
          >
            Browse Catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {savedProducts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No Saved Configurations</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't saved any prefab models to your project shortlist yet. Explore the catalogue to save configurations.
            </p>
            <Link
              href="/products"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 rounded-lg transition"
            >
              Explore Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={prod.images[0]}
                      alt={prod.name[langKey]}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => toggleSaveConfig(prod.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:text-white transition"
                      title="Remove from Saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur text-[10px] font-mono text-slate-300 rounded">
                      {prod.physicalProfile.floorAreaSqm} m²
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-blue-400">{prod.sku}</span>
                      <span>Lead Time {prod.baseLeadTimeDays}d</span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base">{prod.name[langKey]}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{prod.tagline[langKey]}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Price</span>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(prod.basePriceUsd, currency)}
                    </span>
                  </div>

                  <Link
                    href={`/products/${prod.id}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                  >
                    Configure <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <SavedContent />
    </WorkspaceProvider>
  );
}
