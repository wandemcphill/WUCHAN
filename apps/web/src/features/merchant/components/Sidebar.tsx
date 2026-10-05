'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSpreadsheet,
  Box,
  Warehouse,
  Factory,
  ShoppingBag,
  Truck,
  HelpCircle,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  actionCounts: {
    rfqs: number;
    ordersAtRisk: number;
    qcFailures: number;
    lowStock: number;
    missingDocs: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ actionCounts }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/merchant/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/merchant/profile', label: 'Org & Factory Profile', icon: <Building2 className="w-5 h-5" /> },
    { href: '/merchant/leads', label: 'Leads & Customers', icon: <Users className="w-5 h-5" /> },
    { href: '/merchant/quotes', label: 'RFQs & Quotes', icon: <FileSpreadsheet className="w-5 h-5" />, badge: actionCounts.rfqs },
    { href: '/merchant/products', label: 'Products & BOM', icon: <Box className="w-5 h-5" /> },
    { href: '/merchant/inventory', label: 'Inventory (10-State)', icon: <Warehouse className="w-5 h-5" />, badge: actionCounts.lowStock },
    { href: '/merchant/production', label: 'Production & QC', icon: <Factory className="w-5 h-5" />, badge: actionCounts.qcFailures },
    { href: '/merchant/orders', label: 'Orders & Financials', icon: <ShoppingBag className="w-5 h-5" />, badge: actionCounts.ordersAtRisk },
    { href: '/merchant/logistics', label: 'Logistics & Docs', icon: <Truck className="w-5 h-5" />, badge: actionCounts.missingDocs },
    { href: '/merchant/support', label: 'Customer & Warranty', icon: <HelpCircle className="w-5 h-5" /> },
    { href: '/merchant/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Open merchant navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/95 text-slate-200 shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close merchant navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform duration-200 md:static md:w-64 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">W</div>
            <div>
              <h1 className="text-base font-bold tracking-wide text-white">WUCHAN</h1>
              <p className="text-xs text-slate-400">Merchant / Factory Hub</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close merchant navigation"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-white text-blue-600' : 'border border-red-500/30 bg-red-500/20 text-red-400'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">AP</div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">Demo Factory Operator</p>
              <p className="truncate text-[10px] text-slate-400">Synthetic workspace</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
