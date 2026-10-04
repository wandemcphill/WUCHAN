import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, DollarSign, Truck } from 'lucide-react';
import { MerchantAdapter } from '@wuchan/contracts';

interface AnalyticsViewProps {
  adapter: MerchantAdapter;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ adapter }) => {
  const analytics = adapter.getAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Factory & Commercial Operational Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time KPIs across conversion rates, quotation SLA speed, active order volume, QC pass rates & OTIF logistics.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">RFQ Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.rfqConversionRate}%</p>
          <p className="text-[10px] text-emerald-400">+4.2% from last month</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Quote Turnaround</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.averageQuoteTimeHours} Hours</p>
          <p className="text-[10px] text-blue-400">SLA Target: &lt; 24 Hours</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">QC Pass Rate</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.qcPassRatePercent}%</p>
          <p className="text-[10px] text-purple-400">Target: &gt; 90% First Pass</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">OTIF Logistics Rate</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.onTimeInFullShippingRatePercent}%</p>
          <p className="text-[10px] text-amber-400">On-Time In-Full Export</p>
        </div>
      </div>

      {/* Revenue Trend Chart Representation */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" /> Monthly Revenue Trend (USD)
        </h3>
        <div className="flex items-end justify-between h-48 pt-6 px-4 bg-slate-950 rounded-xl border border-slate-800">
          {analytics.monthlyRevenueUSD.map((item, index) => {
            const heightPercent = (item.amount / 800000) * 100;
            return (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-[10px] font-bold text-emerald-400">${(item.amount / 1000).toFixed(0)}k</span>
                <div
                  className="w-12 bg-blue-600 rounded-t-lg transition-all hover:bg-blue-500"
                  style={{ height: `${heightPercent}%` }}
                ></div>
                <span className="text-[10px] text-slate-400">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
