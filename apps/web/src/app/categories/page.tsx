'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import {
  Layers,
  Building2,
  Hotel,
  Home,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  Boxes,
} from 'lucide-react';

const CATEGORY_TYPES = [
  {
    id: 'LUXURY_POD',
    name: 'Space Capsules & Luxury Glamping Pods',
    tagline: 'Futuristic aerospace-grade pods for eco-resorts & glamping sites',
    modelsCount: 4,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    keySpecs: '38m² - 45m² • Non-permanent foundation • 180 km/h wind resistance',
  },
  {
    id: 'EXPANDABLE_CONTAINER',
    name: 'Expandable Container Homes',
    tagline: 'Rapid deployment double-wing foldable units (15-min site expansion)',
    modelsCount: 5,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    keySpecs: '37m² • Pre-fitted bath & kitchen • Fits 2 units in 40ft HC',
  },
  {
    id: 'STEEL_VILLA',
    name: 'Light Gauge Steel Modular Villas',
    tagline: 'Multi-story luxury steel-frame residential & commercial structures',
    modelsCount: 3,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    keySpecs: '120m² - 350m² • PE Stamped Title 24 • Hurricane Grade 9 seismic',
  },
  {
    id: 'MODULAR_OFFICE',
    name: 'Prefab Commercial Offices & Cafes',
    tagline: 'Turnkey site offices, pop-up retail stores, and coffee pods',
    modelsCount: 3,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    keySpecs: '20m² - 80m² • Class A1 Fire Rating • Plug-and-play M&E connections',
  },
];

const CATEGORY_USAGES = [
  {
    id: 'HOSPITALITY',
    icon: Hotel,
    name: 'Hospitality & Eco-Resorts',
    description: 'High-ROI luxury cabins and capsules designed for boutique glamping and coastal resorts.',
  },
  {
    id: 'RESIDENTIAL',
    icon: Home,
    name: 'Residential Housing',
    description: 'Permanent & semi-permanent single/multi-family modular homes with code certification.',
  },
  {
    id: 'COMMERCIAL',
    icon: Briefcase,
    name: 'Commercial & Retail',
    description: 'Site offices, marketing centers, modular cafes, and pop-up storefronts.',
  },
  {
    id: 'EMERGENCY_HOUSING',
    icon: ShieldAlert,
    name: 'Workforce & Relief Camps',
    description: 'High-density, rapid deployment expandable shelters for mining, energy, and emergency relief.',
  },
];

function CategoriesContent() {
  const { language } = useWorkspace();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* Title */}
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Modular Taxonomy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">Product Categories & System Typologies</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse prefab modular systems by structural engineering method or project application.
          </p>
        </div>

        {/* By Structural Method */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-400" />
            By Structural Engineering Typology
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORY_TYPES.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?type=${cat.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col sm:flex-row group"
              >
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto overflow-hidden bg-slate-950 relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur text-[10px] font-mono text-blue-400 rounded">
                    {cat.modelsCount} Models
                  </div>
                </div>

                <div className="sm:w-3/5 p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-400 transition">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {cat.tagline}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{cat.keySpecs}</span>
                    <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* By Project Application */}
        <section className="space-y-6 pt-6 border-t border-slate-800">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            By Target Project Application
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORY_USAGES.map((usage) => {
              const IconComp = usage.icon;
              return (
                <Link
                  key={usage.id}
                  href={`/products?usage=${usage.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <h3 className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition">
                      {usage.name}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {usage.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    Explore Models <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <CategoriesContent />
    </WorkspaceProvider>
  );
}
