'use client';

import React, { useState } from 'react';
import { Box, Layers, Settings, ChevronRight } from 'lucide-react';
import { MerchantAdapter, Product, formatMoney } from '@wuchan/contracts/merchant';

interface ProductBOMViewProps {
  adapter: MerchantAdapter;
}

export const ProductBOMView: React.FC<ProductBOMViewProps> = ({ adapter }) => {
  const products = adapter.getProducts();
  const [selectedProd, setSelectedProd] = useState<Product | null>(products[0] || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product Catalog & Multi-Level BOM Structure</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure prefab unit specifications, option price modifiers, and bill of materials (BOM) components.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Box className="w-4 h-4 text-blue-400" /> Prefab Product Models ({products.length})
          </h3>
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProd(p)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                  selectedProd?.id === p.id
                    ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>SKU: {p.sku}</span>
                  <span className="font-bold text-emerald-400">{formatMoney(p.basePrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Product Specifications & BOM Breakdown */}
        {selectedProd && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedProd.name}</h3>
                  <p className="text-xs text-slate-400">SKU: {selectedProd.sku} — Category: {selectedProd.category}</p>
                </div>
                <span className="text-lg font-black text-emerald-400">{formatMoney(selectedProd.basePrice)} Base</span>
              </div>

              {/* Physical Profile */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Dimensions (L×W×H)</p>
                  <p className="font-medium text-slate-200">
                    {selectedProd.dimensionsMM.length}×{selectedProd.dimensionsMM.width}×{selectedProd.dimensionsMM.height} mm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Weight</p>
                  <p className="font-medium text-slate-200">{selectedProd.weightKG.toLocaleString()} KG</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Shipping CBM</p>
                  <p className="font-medium text-slate-200">{selectedProd.cbm} m³</p>
                </div>
              </div>

              {/* Configurable Options */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Configurable Options
                </h4>
                <div className="space-y-2">
                  {selectedProd.configurableOptions.map((optGroup) => (
                    <div key={optGroup.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <p className="font-semibold text-slate-200">{optGroup.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {optGroup.options.map((opt, i) => (
                          <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">{opt.label}</span>
                            <span className="font-semibold text-emerald-400">
                              {opt.priceModifier.amountCents > 0 ? `+${formatMoney(opt.priceModifier)}` : 'Included'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill of Materials (BOM) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Multi-Level Bill of Materials (BOM)
                </h4>
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Component SKU</th>
                        <th className="p-2.5">Component Name</th>
                        <th className="p-2.5">Qty / Unit</th>
                        <th className="p-2.5">Lead Time</th>
                        <th className="p-2.5">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedProd.bom.map((bom) => (
                        <tr key={bom.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-mono text-blue-400">{bom.componentSku}</td>
                          <td className="p-2.5 font-semibold text-white">{bom.componentName}</td>
                          <td className="p-2.5">{bom.quantityPerUnit} {bom.unit}</td>
                          <td className="p-2.5">{bom.leadTimeDays} Days</td>
                          <td className="p-2.5 font-medium text-emerald-400">{formatMoney(bom.unitCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
