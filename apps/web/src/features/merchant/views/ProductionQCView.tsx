'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { MerchantAdapter, ProductionStage, ProductionOrder } from '@wuchan/contracts/merchant';

interface ProductionQCViewProps {
  adapter: MerchantAdapter;
}

export const ProductionQCView: React.FC<ProductionQCViewProps> = ({ adapter }) => {
  const [pOrders] = useState<ProductionOrder[]>(adapter.getProductionOrders());

  const stages: { key: ProductionStage; label: string }[] = [
    { key: 'order', label: '1. Order' },
    { key: 'engineering', label: '2. Engineering' },
    { key: 'material_allocation', label: '3. Material Alloc.' },
    { key: 'production', label: '4. Production' },
    { key: 'qc', label: '5. Quality Control' },
    { key: 'packaging', label: '6. Packaging' },
    { key: 'dispatch', label: '7. Dispatch' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Factory Stage Board & Quality Assurance</h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual pipeline tracking orders through 7 real operational factory stages with pass/fail inspection logs.
          </p>
        </div>
      </div>

      {/* Visual Stage Flow Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {stages.map((st, index) => (
            <React.Fragment key={st.key}>
              <div className="flex-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] font-bold text-blue-400 block">{st.label}</span>
              </div>
              {index < stages.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Production Orders Board */}
      <div className="space-y-4">
        {pOrders.map((po) => (
          <div key={po.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-base">{po.productionOrderNumber}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Stage: {po.currentStage.toUpperCase()}
                  </span>
                  {po.delayed && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Delay Alert
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{po.productName} ({po.quantity} Units)</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-400">Target Finish</p>
                <p className="font-semibold text-slate-200">{new Date(po.targetCompletionDate).toLocaleDateString()}</p>
              </div>
            </div>

            {po.delayed && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Delay Cause: {po.delayReason}</span>
              </div>
            )}

            {/* QC Inspections */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Stage QC Inspection Log
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {po.qcInspections.map((qc) => (
                  <div
                    key={qc.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      qc.result === 'PASS'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase">{qc.stage} Stage</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        qc.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {qc.result}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Inspector: {qc.inspectorName}</p>
                    {qc.defects && qc.defects.length > 0 && (
                      <div className="p-2 rounded bg-slate-950 border border-red-500/20 text-red-300 text-[11px]">
                        <p className="font-semibold">Defect ({qc.defects[0].severity}):</p>
                        <p>{qc.defects[0].description}</p>
                        <p className="mt-1 font-semibold text-slate-200">Required Action: {qc.actionRequired}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
