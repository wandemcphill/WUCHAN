'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/context';
import { Bot, X, Send, Sparkles, HelpCircle, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const { isAiDrawerOpen, setIsAiDrawerOpen } = useWorkspace();
  const [messages, setMessages] = useState<
    { sender: 'ai' | 'user'; text: string; action?: string }[]
  >([
    {
      sender: 'ai',
      text: 'Hello! I am your WUCHAN Technical Procurement AI. I can clarify product engineering specs, calculate container CBM utilization, or summarize building code compliance (e.g. US Title 24, California IRC, EU CE). How can I assist your site project today?',
    },
  ]);
  const [input, setInput] = useState('');

  if (!isAiDrawerOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    setTimeout(() => {
      let responseText =
        'Based on the structural calculation snapshot: Space Capsule X7 with R-38 thermal insulation complies fully with California Title 24 and Monterey County wind load specs up to 180 km/h.';
      if (userText.toLowerCase().includes('cbm') || userText.toLowerCase().includes('container')) {
        responseText =
          'Container Load Plan Analysis: The 12 units of Space Capsule X7 require exactly 12 x 40ft High Cube containers. Freight estimate is snapshot at $4,000 USD/container.';
      } else if (userText.toLowerCase().includes('price') || userText.toLowerCase().includes('cost')) {
        responseText =
          'In demo mode, quote summaries are illustrative. Live pricing, discounts, freight, and commercial terms must come from the authenticated WUCHAN quote record.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: responseText,
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                AI Procurement Assistant
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 rounded font-mono">
                  Advisory Only
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Cannot modify prices, contracts, or bank routing.</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="mx-4 mt-3 p-2.5 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-start gap-2 text-xs text-amber-300/90">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            AI provides instant specification checks and calculations. Financial approvals and contract signatures require human authorized verification.
          </span>
        </div>

        {/* Quick Prompts */}
        <div className="p-4 border-b border-slate-800/60 flex flex-wrap gap-2">
          <button
            onClick={() => setInput('Explain California Title 24 compliance for Space Pod X7')}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            Title 24 Compliance
          </button>
          <button
            onClick={() => setInput('Check container CBM breakdown for 12 units')}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3 h-3 text-blue-400" />
            CBM Container Plan
          </button>
          <button
            onClick={() => setInput('What are the payment milestones for Order ORD-2025-9912?')}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-emerald-400" />
            Payment Milestones
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI technical or logistics questions..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
