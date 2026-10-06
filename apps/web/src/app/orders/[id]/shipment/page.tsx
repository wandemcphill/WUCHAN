'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { StatusBadge } from '@/components/ui/StateCards';
import { MOCK_ORDERS } from '@/lib/adapters/mockData';
import {
  Anchor,
  Box,
  MapPin,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export default function OrderShipmentPage({ params }: { params: { id: string } }) {
  return (
    <WorkspaceProvider>
      <OrderShipmentInner orderId={params.id} />
    </WorkspaceProvider>
  );
}

function OrderShipmentInner({ orderId }: { orderId: string }) {
  const { language } = useWorkspace();

  const order = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
  const shipment = order.shipments[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={`/orders/${order.id}`}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Order {order.orderNumber}
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-100">Container Shipment & International Logistics</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live tracking for ocean vessel berth, container seal codes, and packing lists.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">{shipment.shipmentNumber}</span>
                <StatusBadge status={shipment.currentStatus} />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                {shipment.vesselName} (Voyage {shipment.voyageNumber})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Carrier: <strong className="text-slate-200">{shipment.shippingLine}</strong> • Bill of Lading:{' '}
                <strong className="text-blue-400 font-mono">{shipment.billOfLadingNumber}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 text-right">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Estimated Arrival (ETA)</span>
              <strong className="text-emerald-400 text-sm block font-mono">{shipment.estimatedArrival}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block flex items-center gap-1">
                <Anchor className="w-3.5 h-3.5 text-blue-400" /> Origin Port
              </span>
              <strong className="text-slate-200 block text-sm">{shipment.originPort}</strong>
              <span className="text-slate-400 text-[11px]">ETD: {shipment.estimatedDeparture}</span>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] text-slate-500 uppercase font-mono block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Destination Port
              </span>
              <strong className="text-slate-200 block text-sm">{shipment.destinationPort}</strong>
              <span className="text-slate-400 text-[11px]">ETA: {shipment.estimatedArrival}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-400" />
              Container Packing List & Package Contents
            </h2>

            {shipment.containers.map((cntr) => (
              <div key={cntr.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Container Number</span>
                    <strong className="text-blue-400 text-sm font-mono">{cntr.containerNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Customs Seal</span>
                    <span className="font-mono text-slate-300">{cntr.sealNumber}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">Packages Loaded Inside:</span>
                  {cntr.packages.map((pkg) => (
                    <div key={pkg.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-200 font-mono">{pkg.packageCode}</strong>
                        <span className="font-mono text-slate-400">{pkg.weightKg} kg • {pkg.cbm} CBM</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pkg.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {pkg.itemsInside.map((item, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-[9px] text-slate-300 rounded font-mono">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Event Timeline & Tracking Feed
            </h2>

            <div className="space-y-3">
              {shipment.trackingEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{evt.title}</span>
                    <span className="text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 bg-emerald-950 border border-emerald-800/60 rounded">
                      {evt.source}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{evt.location}</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed pt-1">{evt.description}</p>
                  <span className="text-[9px] text-slate-500 font-mono block pt-1">{evt.timestamp.replace('T', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
