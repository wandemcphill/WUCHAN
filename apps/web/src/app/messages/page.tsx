'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/lib/adapters/mockData';
import {
  MessageSquare,
  Send,
} from 'lucide-react';

function MessagesContent() {
  const { currentUser } = useWorkspace();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId: 'conv_big_sur_eng',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, newMsg]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Project Messaging Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">B2B Threaded Communication</h1>
          <p className="text-xs text-slate-400">Direct channel with WUCHAN Account Manager and Lead Structural Engineer.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase font-mono">Active Conversations</h3>
            {MOCK_CONVERSATIONS.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-slate-950 border border-blue-500/50 rounded-xl space-y-1 cursor-pointer"
              >
                <span className="text-[9px] font-mono text-blue-400 uppercase font-bold">{c.contextType}</span>
                <h4 className="text-xs font-bold text-slate-200">{c.topic}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">{c.lastMessage?.content}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{MOCK_CONVERSATIONS[0].topic}</h3>
                <p className="text-[11px] text-slate-400">Context: Order ORD-2025-9912 (Big Sur Eco Resort)</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
              {messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-1 ${
                      isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 font-mono mb-1">
                        <span>{m.senderName} ({m.senderRole})</span>
                        <span>{m.createdAt.split('T')[1]?.slice(0, 5) || '11:20'}</span>
                      </div>
                      <p className="leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type technical inquiry or message to engineer..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <MessagesContent />
    </WorkspaceProvider>
  );
}
