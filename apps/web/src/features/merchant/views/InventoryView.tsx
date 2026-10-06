'use client';

import React, { useState } from 'react';
import { Warehouse, Lock } from 'lucide-react';
import { MerchantAdapter, InventoryState, InventoryItem } from '@wuchan/contracts/merchant';

interface InventoryViewProps {
  adapter: MerchantAdapter;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ adapter }) => {
  const [items] = useState<InventoryItem[]>(adapter.getInventory());
  const warehouses = adapter.getWarehouses();
  const reservations = adapter.getReservations();

  const inventoryStates: { key: InventoryState; label: string; badge: string }[] = [
    { key: 'available', label: 'Available', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { key: 'reserved', label: 'Reserved', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { key: 'allocated', label: 'Allocated', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { key: 'in_production', label: 'In Production', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { key: 'qc_hold', label: 'QC Hold', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    { key: 'damaged', label: 'Damaged', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { key: 'quarantined', label: 'Quarantined', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { key: 'packed', label: 'Packed', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    { key: 'dispatched', label: 'Dispatched', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { key: 'in_transit', label: 'In Transit', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Granular 10-State Inventory & Warehousing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Explicit stock segregation across 10 operational states to ensure accurate safety stock & allocation.
          </p>
        </div>
      </div>

      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-blue-400" /> {wh.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                {wh.code}
              </span>
            </div>
            <p className="text-slate-400">Location: {wh.location} — Type: {wh.type}</p>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${(wh.usedCapacitySqM / wh.totalCapacitySqM) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500">
              Capacity: {wh.usedCapacitySqM.toLocaleString()} / {wh.totalCapacitySqM.toLocaleString()} m² (
              {Math.round((wh.usedCapacitySqM / wh.totalCapacitySqM) * 100)}% utilized)
            </p>
          </div>
        ))}
      </div>

      {/* Granular Inventory State Matrix */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-white">Stock State Distribution</h3>

        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">SKU / Item Name</th>
                {inventoryStates.map((st) => (
                  <th key={st.key} className="p-2 text-center">{st.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50">
                  <td className="p-3">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{item.sku}</p>
                  </td>
                  {inventoryStates.map((st) => {
                    const qty = item.quantities[st.key] || 0;
                    return (
                      <td key={st.key} className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${qty > 0 ? st.badge : 'text-slate-600 border-transparent'}`}>
                          {qty}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Active Stock Reservations
        </h3>
        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-2.5">Reservation ID</th>
                <th className="p-2.5">SKU</th>
                <th className="p-2.5">Target Order</th>
                <th className="p-2.5">Reserved Qty</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reservations.map((res) => (
                <tr key={res.id}>
                  <td className="p-2.5 font-mono text-slate-400">{res.id}</td>
                  <td className="p-2.5 font-mono text-blue-400">{res.sku}</td>
                  <td className="p-2.5">{res.orderId || 'N/A'}</td>
                  <td className="p-2.5 font-bold text-white">{res.quantity}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
