'use client';

import React, { useState } from 'react';
import { Box, FileCheck, Layers, Clock } from 'lucide-react';
import { MerchantAdapter, Shipment } from '@wuchan/contracts/merchant';

interface LogisticsDocumentsViewProps {
  adapter: MerchantAdapter;
}

export const LogisticsDocumentsView: React.FC<LogisticsDocumentsViewProps> = ({ adapter }) => {
  const shipments = adapter.getShipments();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0] || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Logistics, Container Hierarchy & Export Documents</h2>
          <p className="text-xs text-slate-400 mt-1">
            Structural Hierarchy: Order → Shipment → Shipping Container → Package/Unit → Real-time Tracking Events.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipments Queue */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Export Shipments</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">{shipments.length}</span>
          </h3>
          <div className="space-y-2">
            {shipments.map((shp) => (
              <div
                key={shp.id}
                onClick={() => setSelectedShipment(shp)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                  selectedShipment?.id === shp.id
                    ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{shp.shipmentNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    {shp.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">{shp.customerName}</p>
                <p className="text-slate-500 text-[10px] mt-1">{shp.originPort} → {shp.destinationPort}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hierarchy Detail View */}
        {selectedShipment && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedShipment.shipmentNumber}</h3>
                  <p className="text-xs text-slate-400">
                    Carrier: {selectedShipment.carrierName} — Vessel: {selectedShipment.vesselName}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {selectedShipment.incoterm}
                </span>
              </div>

              {/* Containers & Package Units Hierarchy */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Container & Unit Packaging Breakdown
                </h4>
                {selectedShipment.containers.map((cntr) => (
                  <div key={cntr.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Box className="w-4 h-4 text-amber-400" /> Container {cntr.containerNumber} ({cntr.containerType})
                      </span>
                      <span className="text-slate-400 text-[11px]">Seal #: {cntr.sealNumber}</span>
                    </div>

                    <div className="space-y-2 pl-3 border-l-2 border-amber-500/30">
                      <p className="text-[11px] font-semibold text-slate-400">Contained Modular Package Units:</p>
                      {cntr.packages.map((pkg) => (
                        <div key={pkg.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-200">{pkg.packageNumber} — {pkg.contentsDescription}</p>
                            <p className="text-[10px] text-slate-500">
                              {pkg.weightKG} KG | {pkg.cbm} CBM
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            QC PASSED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Export Documents Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Required Export Documents Checklist
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedShipment.requiredDocuments.map((docName, i) => {
                    const isSubmitted = selectedShipment.submittedDocuments.includes(docName);
                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          isSubmitted ? 'border-emerald-500/30 bg-emerald-500/5 text-slate-200' : 'border-red-500/30 bg-red-500/5 text-red-300'
                        }`}
                      >
                        <span className="font-medium">{docName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSubmitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {isSubmitted ? 'VERIFIED' : 'MISSING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Events Timeline */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Real-Time Tracking Events
                </h4>
                <div className="space-y-2">
                  {selectedShipment.trackingEvents.map((evt) => (
                    <div key={evt.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{evt.status} — {evt.location}</span>
                        <span className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
