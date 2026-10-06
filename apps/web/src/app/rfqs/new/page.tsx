'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS, MOCK_PROJECTS } from '@/lib/adapters/mockData';
import { Incoterm } from '@wuchan/contracts';
import {
  FileText,
  FileCheck2,
  Upload,
  Building2,
  Anchor,
} from 'lucide-react';

function NewRfqContent() {
  const { currency, language } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const [selectedProductId, setSelectedProductId] = useState(MOCK_PRODUCTS[0].id);
  const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECTS[0].id);
  const [quantity, setQuantity] = useState(12);
  const [incoterms, setIncoterms] = useState<Incoterm>('DDP');
  const [deliveryDate, setDeliveryDate] = useState('2025-06-15');
  const [notes, setNotes] = useState(
    'Must comply with California Title 24 energy standards and Monterey County 180 km/h wind load anchoring.'
  );
  const [files] = useState<string[]>(['Big_Sur_Site_Plan_Approved.pdf']);

  const selectedProduct = MOCK_PRODUCTS.find((p) => p.id === selectedProductId) || MOCK_PRODUCTS[0];
  const selectedProject = MOCK_PROJECTS.find((p) => p.id === selectedProjectId) || MOCK_PROJECTS[0];

  const estimatedSubtotal = { amountCents: selectedProduct.basePriceUsd.amountCents * quantity, currency: selectedProduct.basePriceUsd.currency };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Commercial RFQ Builder</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">Submit Formal Request for Quote (RFQ)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Convert custom prefab configurations into an official commercial RFQ for factory pricing and freight snapshots.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = '/rfqs/rfq_2025_001';
          }}
          className="space-y-6"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              1. Select Building Site Project & Prefab Model
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Building Site Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {MOCK_PROJECTS.map((prj) => (
                    <option key={prj.id} value={prj.id}>
                      {prj.name} ({prj.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Prefab Model</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {MOCK_PRODUCTS.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name[langKey]} ({prod.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-emerald-400" />
              2. Order Volume & Shipping Terms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Batch Order Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Incoterms Requested</label>
                <select
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value as Incoterm)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="DDP">DDP (Delivered Duty Paid - Door-to-Door)</option>
                  <option value="CIF">CIF (Cost, Insurance & Sea Freight)</option>
                  <option value="FOB">FOB (Free on Board - Origin Port)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Requested Delivery Target</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Destination Port:</span>
                <strong className="text-blue-400">{selectedProject.site.destinationPort}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Container Volume Estimate:</span>
                <strong className="text-amber-400 font-mono">
                  {quantity * selectedProduct.physicalProfile.containersRequired} x {selectedProduct.physicalProfile.containerTypeNeeded}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              3. Custom Engineering Notes & Attachments
            </h2>

            <div>
              <label className="text-slate-400 block mb-1 text-xs font-medium">
                Technical Instructions / Local Building Code Requirements
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center text-xs text-slate-400 cursor-pointer bg-slate-950/50 transition">
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <span className="font-semibold text-slate-200">Upload Site Plan, Geotechnical Soil Reports, or Permits</span>
              <p className="text-[10px] text-slate-500 mt-1">PDF, DWG, ZIP up to 50MB</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-medium">Attached Documents:</span>
                {files.map((f, i) => (
                  <div key={i} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-mono">{f}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Base Equipment Value</span>
              <span className="text-2xl font-extrabold text-white">
                {formatCurrency(estimatedSubtotal, currency)}
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-xs"
            >
              <FileCheck2 className="w-4 h-4" />
              Submit Official RFQ to Factory
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <NewRfqContent />
    </WorkspaceProvider>
  );
}
