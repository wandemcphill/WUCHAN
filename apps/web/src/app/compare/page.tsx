'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS } from '@/lib/adapters/mockData';
import { Product } from '@wuchan/contracts';
import {
  Scale,
  X,
} from 'lucide-react';

function CompareContent() {
  const { currency, language } = useWorkspace();

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    MOCK_PRODUCTS[0].id,
    MOCK_PRODUCTS[1].id,
  ]);

  const addProduct = (id: string) => {
    if (selectedProductIds.length < 4 && !selectedProductIds.includes(id)) {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
  };

  const comparedProducts: Product[] = selectedProductIds
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const langKey = language as 'en' | 'zh';

  const availableToAdd = MOCK_PRODUCTS.filter((p) => !selectedProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Model Comparison Matrix</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Side-by-Side Prefab Specifications</h1>
            <p className="text-sm text-slate-400 mt-1">
              Compare up to 4 models across pricing, CBM container volume, thermal R-values, and regional certifications.
            </p>
          </div>

          {availableToAdd.length > 0 && selectedProductIds.length < 4 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Add to matrix:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addProduct(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select Model --</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name[langKey]} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {comparedProducts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            <p>No models selected for comparison.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-2xl">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950">
                  <th className="p-4 w-48 text-slate-400 font-mono text-[11px] uppercase">Specification</th>
                  {comparedProducts.map((prod) => (
                    <th key={prod.id} className="p-4 w-64 border-l border-slate-800 relative align-top">
                      <button
                        onClick={() => removeProduct(prod.id)}
                        className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition p-1"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-2 pr-6">
                        <img
                          src={prod.images[0]}
                          alt={prod.name[langKey]}
                          className="w-full h-32 object-cover rounded-lg bg-slate-900 border border-slate-800"
                        />
                        <div className="text-[10px] font-mono text-blue-400">{prod.sku}</div>
                        <h3 className="font-bold text-slate-100 text-sm line-clamp-2">{prod.name[langKey]}</h3>
                        <div className="text-base font-extrabold text-white">
                          {formatCurrency(prod.basePriceUsd, currency)}
                        </div>
                        <Link
                          href={`/products/${prod.id}`}
                          className="mt-2 block w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-center transition text-[11px]"
                        >
                          Configure Specs
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Typology</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-blue-400 font-semibold">
                      {p.structureType.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Floor Area (m²)</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-slate-100 font-bold">
                      {p.physicalProfile.floorAreaSqm} m²
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">External Dimensions (mm)</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-slate-300">
                      {p.physicalProfile.lengthMm} x {p.physicalProfile.widthMm} x {p.physicalProfile.heightMm}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Net Weight (kg)</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-slate-300">
                      {p.physicalProfile.weightKg.toLocaleString()} kg
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Shipping Volume (CBM)</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-amber-400 font-semibold">
                      {p.physicalProfile.shippingVolumeCbm} m³ ({p.physicalProfile.containerTypeNeeded})
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Production Lead Time</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-emerald-400 font-semibold">
                      {p.baseLeadTimeDays} Days
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Wind Rating</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-slate-300">
                      {p.performanceSpecs.windResistanceKmh} km/h
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Thermal Insulation</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800 font-mono text-slate-300">
                      R-{p.performanceSpecs.thermalInsulationRValue}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/40">Regional Building Codes</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-800">
                      <div className="flex flex-wrap gap-1">
                        {p.performanceSpecs.regionalCertifications.map((cert) => (
                          <span key={cert} className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono text-slate-300 rounded">
                            {cert.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <CompareContent />
    </WorkspaceProvider>
  );
}
