'use client';

import React, { useState } from 'react';
import { FileDiff, DollarSign, Plus } from 'lucide-react';
import { MerchantAdapter, Order, formatMoney } from '@wuchan/contracts/merchant';

interface OrdersFinancialsViewProps {
  adapter: MerchantAdapter;
}

export const OrdersFinancialsView: React.FC<OrdersFinancialsViewProps> = ({ adapter }) => {
  const [orders] = useState<Order[]>(adapter.getOrders());
  const invoices = adapter.getInvoices();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Order Lifecycle, Change Requests & Invoicing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed orders cannot be edited destructively; modifications require formal Change Requests (CR).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Confirmed Orders</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">{orders.length}</span>
          </h3>
          <div className="space-y-2">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                  selectedOrder?.id === ord.id
                    ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{ord.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ord.paymentStatus === 'PAID_IN_FULL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {ord.paymentStatus}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">{ord.customerName}</p>
                <p className="font-bold text-emerald-400 text-sm mt-1">{formatMoney(ord.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Change Request Protocol */}
        {selectedOrder && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-slate-400">Customer: {selectedOrder.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-400">{formatMoney(selectedOrder.totalAmount)}</p>
                  <p className="text-[11px] text-slate-400">Paid: {formatMoney(selectedOrder.paidAmount)}</p>
                </div>
              </div>

              {/* Order Change Requests (CR) Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <FileDiff className="w-4 h-4" /> Non-Destructive Change Requests (CR)
                  </h4>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500">
                    <Plus className="w-3.5 h-3.5" /> Submit New CR
                  </button>
                </div>

                {selectedOrder.changeRequests.length === 0 ? (
                  <p className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                    No change requests filed for this order. Original contract unchanged.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.changeRequests.map((cr) => (
                      <div key={cr.id} className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{cr.requestNumber} (By {cr.requestedBy})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {cr.status}
                          </span>
                        </div>
                        <p className="text-slate-300">{cr.reason}</p>
                        <p className="text-[11px] text-slate-400">{cr.description}</p>
                        <div className="flex items-center gap-4 text-[11px] font-semibold pt-1">
                          <span className="text-emerald-400">Cost Impact: +{formatMoney(cr.commercialImpact)}</span>
                          <span className="text-amber-400">Schedule Impact: +{cr.leadTimeImpactDays} Days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Milestone Invoices & Payments
                </h4>
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 text-xs">
                  <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Milestone</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Due Date</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-bold text-white">{inv.invoiceNumber}</td>
                          <td className="p-2.5">{inv.milestoneName}</td>
                          <td className="p-2.5 font-bold text-emerald-400">{formatMoney(inv.amount)}</td>
                          <td className="p-2.5">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
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
