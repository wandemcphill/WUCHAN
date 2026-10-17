'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS } from '@/lib/adapters/mockData';
import { SelectedOption } from '@wuchan/contracts';
import {
  Building2,
  ShieldCheck,
  Truck,
  Layers,
  Check,
  Bookmark,
  Scale,
  Box,
  Clock,
  Sparkles,
  Maximize2,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <ProductDetailInner productId={params.id} />
    </WorkspaceProvider>
  );
}

function ProductDetailInner({ productId }: { productId: string }) {
  const { currency, language, savedConfigIds, toggleSaveConfig } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const product = MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0];

  const [activeMedia, setActiveMedia] = useState<string>(product.images[0]);
  const [activeTab, setActiveTab] = useState<'specs' | 'bom' | 'compliance' | 'shipping'>('specs');

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.optionGroups.forEach((grp) => {
      const defaultVal = grp.values.find((v) => v.isDefault) || grp.values[0];
      if (defaultVal) {
        initial[grp.id] = defaultVal.id;
      }
    });
    return initial;
  });

  let extraPriceCents = 0;
  let extraWeightKg = 0;
  let extraCbm = 0;
  let extraLeadDays = 0;

  const currentSelections: SelectedOption[] = [];

  product.optionGroups.forEach((grp) => {
    const chosenValId = selectedOptions[grp.id];
    const val = grp.values.find((v) => v.id === chosenValId);
    if (val) {
      extraPriceCents += val.priceDeltaUsd.amountCents;
      extraWeightKg += val.weightDeltaKg;
      extraCbm += val.cbmDelta;
      extraLeadDays += val.leadTimeDeltaDays;

      currentSelections.push({
        groupId: grp.id,
        groupCode: grp.code,
        valueId: val.id,
        valueName: val.name,
        priceDeltaUsd: val.priceDeltaUsd,
        weightDeltaKg: val.weightDeltaKg,
        cbmDelta: val.cbmDelta,
        leadTimeDeltaDays: val.leadTimeDeltaDays,
      });
    }
  });

  const totalPriceUsd = { amountCents: product.basePriceUsd.amountCents + extraPriceCents, currency: product.basePriceUsd.currency };
  const totalWeightKg = product.physicalProfile.weightKg + extraWeightKg;
  const totalCbm = product.physicalProfile.shippingVolumeCbm + extraCbm;
  const totalLeadDays = product.baseLeadTimeDays + extraLeadDays;

  const isSaved = savedConfigIds.includes(product.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/products" className="hover:text-slate-200">Products</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-mono">{product.sku}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-200 font-medium truncate">{product.name[langKey]}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[16/10] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={activeMedia}
                alt={product.name[langKey]}
                className="w-full h-full object-cover transition duration-300"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-semibold text-blue-400 rounded-lg">
                {product.structureType.replace(/_/g, ' ')}
              </div>
              <button
                onClick={() => toggleSaveConfig(product.id)}
                className={`absolute top-3 right-3 p-2 rounded-lg border backdrop-blur transition ${
                  isSaved
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Save Configuration"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia(imgUrl)}
                  className={`relative w-20 h-16 rounded-lg overflow-hidden border shrink-0 transition ${
                    activeMedia === imgUrl ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
              {product.floorPlanImages.map((imgUrl, i) => (
                <button
                  key={`fp_${i}`}
                  onClick={() => setActiveMedia(imgUrl)}
                  className={`relative w-20 h-16 rounded-lg overflow-hidden border shrink-0 bg-slate-900 p-1 transition ${
                    activeMedia === imgUrl ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Floorplan" className="w-full h-full object-contain" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-slate-950 px-1 rounded text-slate-300 font-mono">
                    Floorplan
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <Maximize2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Floor Area</span>
                <span className="text-sm font-bold text-slate-200">{product.physicalProfile.floorAreaSqm} m²</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <Scale className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Weight</span>
                <span className="text-sm font-bold text-slate-200">{(totalWeightKg / 1000).toFixed(1)} tons</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <Box className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Shipping Vol</span>
                <span className="text-sm font-bold text-slate-200">{totalCbm.toFixed(1)} CBM</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Lead Time</span>
                <span className="text-sm font-bold text-slate-200">{totalLeadDays} Days</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono text-blue-400">{product.sku}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Direct Factory
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100">{product.name[langKey]}</h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{product.tagline[langKey]}</p>
            </div>

            <div className="space-y-4 border-t border-b border-slate-800 py-4 max-h-[380px] overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Custom Spec Configurator
              </h3>

              {product.optionGroups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">This model has standardized factory specifications.</p>
              ) : (
                product.optionGroups.map((grp) => (
                  <div key={grp.id} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200 block">
                      {grp.name[langKey]} {grp.isRequired && <span className="text-rose-400">*</span>}
                    </label>

                    <div className="space-y-2">
                      {grp.values.map((val) => {
                        const isSelected = selectedOptions[grp.id] === val.id;
                        return (
                          <div
                            key={val.id}
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [grp.id]: val.id,
                              }))
                            }
                            className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-blue-950/60 border-blue-500 text-slate-100'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="font-medium text-slate-200">{val.name[langKey]}</span>
                            </div>

                            <span className="font-mono text-slate-300 font-semibold shrink-0 ml-2">
                              {val.priceDeltaUsd.amountCents > 0
                                ? `+${formatCurrency(val.priceDeltaUsd, currency)}`
                                : val.priceDeltaUsd.amountCents < 0
                                ? formatCurrency(val.priceDeltaUsd, currency)
                                : 'Included'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Calculated Base Spec Unit Price</span>
                  <span className="text-2xl font-extrabold text-white">
                    {formatCurrency(totalPriceUsd, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Containers Required</span>
                  <span className="text-sm font-semibold text-blue-400 font-mono">
                    {product.physicalProfile.containersRequired} x {product.physicalProfile.containerTypeNeeded}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href={`/rfqs/new?productId=${product.id}&priceCents=${totalPriceUsd.amountCents}`}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-center transition flex items-center justify-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Request Formal RFQ
                </Link>
                <Link
                  href={`/compare?p1=${product.id}`}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 text-center transition flex items-center justify-center gap-1.5"
                >
                  <Scale className="w-4 h-4 text-blue-400" />
                  Compare Model
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-950 overflow-x-auto text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-6 py-4 flex items-center gap-2 transition border-b-2 ${
                activeTab === 'specs' ? 'border-blue-500 text-blue-400 bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Full Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-6 py-4 flex items-center gap-2 transition border-b-2 ${
                activeTab === 'bom' ? 'border-blue-500 text-blue-400 bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Standard Bill of Materials (BOM)
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-4 flex items-center gap-2 transition border-b-2 ${
                activeTab === 'compliance' ? 'border-blue-500 text-blue-400 bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Code Compliance & Certificates
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-6 py-4 flex items-center gap-2 transition border-b-2 ${
                activeTab === 'shipping' ? 'border-blue-500 text-blue-400 bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Packaging & Sea Freight Specs
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
                    Structural & Physical Dimensions
                  </h3>
                  <table className="w-full text-slate-300 space-y-1">
                    <tbody>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">External Length / Width / Height</td>
                        <td className="font-mono">{product.physicalProfile.lengthMm} x {product.physicalProfile.widthMm} x {product.physicalProfile.heightMm} mm</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Internal Floor Area</td>
                        <td className="font-mono">{product.physicalProfile.floorAreaSqm} m²</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Net Weight</td>
                        <td className="font-mono">{product.physicalProfile.weightKg} kg</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Design Lifespan</td>
                        <td className="font-mono">{product.performanceSpecs.lifespanYears} Years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
                    Environmental Performance Ratings
                  </h3>
                  <table className="w-full text-slate-300 space-y-1">
                    <tbody>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Wind Load Resistance</td>
                        <td className="font-mono">{product.performanceSpecs.windResistanceKmh} km/h Gusts</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Snow Load Capacity</td>
                        <td className="font-mono">{product.performanceSpecs.snowLoadKnSqm} kN/m²</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Thermal Insulation Rating</td>
                        <td className="font-mono">R-{product.performanceSpecs.thermalInsulationRValue}</td>
                      </tr>
                      <tr className="border-b border-slate-800/60 py-2 flex justify-between">
                        <td className="text-slate-400">Acoustic Soundproofing</td>
                        <td className="font-mono">{product.performanceSpecs.soundproofDb} dB Reduction</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'bom' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-200 text-sm">Base Component Snapshot</h3>
                  <span className="text-slate-400 font-mono">Factory Quality Standard Q355B / ISO 9001</span>
                </div>

                {product.standardBom.length === 0 ? (
                  <p className="text-slate-400">Standard BOM breakdown is available in the PE Stamped PDF package.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Component Name</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Technical Specification</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Unit Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {product.standardBom.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-950/50">
                            <td className="p-3 font-semibold text-slate-200">{item.name[langKey]}</td>
                            <td className="p-3 font-mono text-blue-400">{item.category}</td>
                            <td className="p-3 text-slate-400">{item.specifications}</td>
                            <td className="p-3 font-mono">{item.quantity} {item.unit}</td>
                            <td className="p-3 font-mono text-emerald-400">{formatCurrency(item.unitCostUsd, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-200 text-sm">International Building Code Certifications</h3>
                <p className="text-slate-400">
                  All WUCHAN prefabricated structures are designed according to international structural, wind load, and seismic safety requirements.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-blue-400 font-bold block">US IRC / Title 24</span>
                    <p className="text-slate-400 text-[11px]">PE stamped calculations for California, Nevada, Washington, and Florida coastal wind zones.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-bold block">EU CE Marking</span>
                    <p className="text-slate-400 text-[11px]">Class A1 fire rating certificate and EN 1090 structural steel execution approval.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-purple-400 font-bold block">AU AS/NZS Standards</span>
                    <p className="text-slate-400 text-[11px]">AS 1170 wind action and AS 4100 steel structures compliance documentation.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-200 text-sm">International Container Packing Specifications</h3>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Container Requirements:</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {product.physicalProfile.containersRequired} x {product.physicalProfile.containerTypeNeeded} Container
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Calculated CBM Volume:</span>
                    <span className="font-mono text-amber-400 font-bold">{totalCbm.toFixed(1)} m³</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pt-2 border-t border-slate-800/80">
                    Units are protected with heavy-duty export shrink film and steel pallet tie-downs inside 40ft High Cube ocean containers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
