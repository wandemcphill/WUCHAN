'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS } from '@/lib/adapters/mockData';
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Anchor,
} from 'lucide-react';

function HomepageContent() {
  const { currency, language } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>International B2B Prefab Procurement Workspace</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-100">
                Precision Modular Buildings & Luxury Prefab Structures for Global Projects
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
                Direct factory procurement with verified engineering stamps, international shipping logistics, transparent milestone payment schedules, and real-time order lifecycle visibility.
              </p>

              {/* Core B2B Procurement Guarantees (Addressing the 5 Questions) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="text-[11px] font-mono text-blue-400 font-bold uppercase mb-0.5">What Am I Buying</div>
                  <div className="text-xs text-slate-200 font-medium">PE Stamped Spec Packs</div>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase mb-0.5">How Much Cost</div>
                  <div className="text-xs text-slate-200 font-medium">Itemized DDP/FOB Snapshots</div>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase mb-0.5">What Next / Owner</div>
                  <div className="text-xs text-slate-200 font-medium">16-Stage Account Management</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition text-sm"
                >
                  Explore Catalogue & Configurator
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/rfqs"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl flex items-center gap-2 transition text-sm"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  Submit Custom RFQ
                </Link>
              </div>
            </div>

            {/* Featured Product Hero Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                  <img
                    src={MOCK_PRODUCTS[0].images[0]}
                    alt="Space Pod X7"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-semibold text-blue-400 rounded-md">
                    Featured Model
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase">{MOCK_PRODUCTS[0].sku}</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> US / EU / AU Certified
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {MOCK_PRODUCTS[0].name[langKey]}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {MOCK_PRODUCTS[0].tagline[langKey]}
                  </p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Base Price</span>
                      <span className="text-lg font-extrabold text-white">
                        {formatCurrency(MOCK_PRODUCTS[0].basePriceUsd, currency)}
                      </span>
                    </div>
                    <Link
                      href={`/products/${MOCK_PRODUCTS[0].id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition"
                    >
                      Configure Specs & Price
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global B2B Standards Grid */}
      <section className="py-12 border-b border-slate-800/80 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-200">Industrial Manufacturing</h4>
              <p className="text-xs text-slate-400">Automated laser-cut cold-formed steel chassis with ISO 9001 factory QC protocols.</p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-200">Global Structural Codes</h4>
              <p className="text-xs text-slate-400">Tested to California Title 24, US IRC/IBC, European CE A1 Fire, and AU AS/NZS standards.</p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <Anchor className="w-6 h-6 text-purple-400" />
              <h4 className="text-sm font-semibold text-slate-200">Containerized Logistics</h4>
              <p className="text-xs text-slate-400">Calculated CBM dimensions tailored for 40ft High Cube containers with door-to-door DDP terms.</p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <FileCheck2 className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-200">Financial Integrity</h4>
              <p className="text-xs text-slate-400">Milestone bank wire schedules with immutable historical quote and invoice versions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Catalogue Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-100">Featured Prefab Building Models</h2>
              <p className="text-sm text-slate-400">Select a model to open the interactive spec and price configurator.</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Full Catalogue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={prod.images[0]}
                      alt={prod.name[langKey]}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur border border-slate-800 rounded text-[10px] font-mono font-semibold text-slate-300">
                      {prod.structureType.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{prod.physicalProfile.floorAreaSqm} m² Floor Area</span>
                      <span>{prod.baseLeadTimeDays} Days Lead Time</span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-400 transition">
                      {prod.name[langKey]}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {prod.tagline[langKey]}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {prod.performanceSpecs.regionalCertifications.map((cert) => (
                        <span key={cert} className="px-2 py-0.5 bg-slate-800/80 text-[10px] text-slate-300 font-mono rounded">
                          {cert.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">From</span>
                    <span className="text-base font-extrabold text-slate-100">
                      {formatCurrency(prod.basePriceUsd, currency)}
                    </span>
                  </div>

                  <Link
                    href={`/products/${prod.id}`}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
              W
            </div>
            <span className="font-extrabold tracking-wider text-slate-200 text-sm">WUCHAN</span>
            <span className="text-slate-500">| International Prefab & Modular Platform</span>
          </div>

          <p>© {new Date().getFullYear()} WUCHAN Commerce Ltd. All commercial terms subject to formal contract execution.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <HomepageContent />
    </WorkspaceProvider>
  );
}
