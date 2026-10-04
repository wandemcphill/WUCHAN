'use client';

import React from 'react';
import { MessageSquare, ShieldCheck, Send, User } from 'lucide-react';
import { MerchantAdapter } from '@wuchan/contracts';

interface SupportWarrantyViewProps {
  adapter: MerchantAdapter;
}

export const SupportWarrantyView: React.FC<SupportWarrantyViewProps> = ({ adapter }) => {
  const conversations = adapter.getConversations();
  const claims = adapter.getWarrantyClaims();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Conversations & Warranty Claims</h2>
          <p className="text-xs text-slate-400 mt-1">
            Direct B2B buyer communication channel and post-delivery structural warranty claims management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Column */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <MessageSquare className="w-4 h-4" /> B2B Buyer Conversations
          </h3>
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">{conv.customerName}</span>
                  <span className="text-[10px] text-slate-500">{new Date(conv.updatedAt).toLocaleTimeString()}</span>
                </div>
                <p className="font-semibold text-blue-300">Topic: {conv.topic}</p>

                <div className="space-y-2 pt-1">
                  {conv.messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" /> {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(msg.sentAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Type official merchant response..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 hover:bg-blue-500">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warranty Claims Column */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4" /> After-Sales Warranty Claims
          </h3>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{claim.claimNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {claim.status}
                  </span>
                </div>
                <p className="text-slate-300">Customer: {claim.customerName}</p>
                <p className="text-slate-400">Product: {claim.productName} ({claim.serialNumber})</p>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-slate-300 mt-2">
                  <p className="font-semibold text-amber-300 mb-1">Issue Reported:</p>
                  <p>{claim.issueDescription}</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-3 py-1.5 rounded bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30 hover:bg-emerald-600/30">
                    Approve Parts Replacement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
