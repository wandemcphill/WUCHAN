'use client';

import React from 'react';
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          W
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide">WUCHAN</h1>
          <p className="text-xs text-slate-400">Merchant / Factory Hub</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
            AP
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Apex Modular Group</p>
            <p className="text-[10px] text-slate-400 truncate">Factory Operator #301</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
