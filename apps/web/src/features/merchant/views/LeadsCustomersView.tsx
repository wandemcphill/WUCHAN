'use client';

import React, { useState } from 'react';
import { UserCheck, Search, Globe, Plus } from 'lucide-react';
import { MerchantAdapter, formatMoney } from '@wuchan/contracts/merchant';

interface LeadsCustomersViewProps {
  adapter: MerchantAdapter;
}

export const LeadsCustomersView: React.FC<LeadsCustomersViewProps> = ({ adapter }) => {
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'customers'>('leads');
  const leads = adapter.getLeads();
  const customers = adapter.getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Lead Management & Customer Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Qualify incoming global buyer inquiries, assign account managers, and track customer lifetime value.
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'leads' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Leads Pipeline ({leads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Customer Accounts ({customers.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'leads' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search leads by name or country..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500">
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Buyer Name</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Project Scope</th>
                  <th className="p-3">Est. Budget</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{lead.customerName}</td>
                    <td className="p-3">{lead.companyName || 'N/A'}</td>
                    <td className="p-3">{lead.projectType}</td>
                    <td className="p-3 font-medium text-emerald-400">{formatMoney(lead.budget)}</td>
                    <td className="p-3 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> {lead.country}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-medium">
                        Qualify / Convert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Account Name</th>
                <th className="p-3">Company</th>
                <th className="p-3">Total Orders</th>
                <th className="p-3">Lifetime Value</th>
                <th className="p-3">Credit Terms</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400" /> {cust.name}
                  </td>
                  <td className="p-3">{cust.companyName}</td>
                  <td className="p-3 font-bold text-slate-200">{cust.totalOrders}</td>
                  <td className="p-3 font-bold text-emerald-400">{formatMoney(cust.lifetimeValue)}</td>
                  <td className="p-3">{cust.creditTermDays} Days Net</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {cust.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
