'use client';

import React from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/context';
import { CURRENCY_RATES } from '@/lib/currency';
import { Currency } from '@wuchan/contracts';
import {
  Building2,
  Globe2,
  Layers,
  FolderKanban,
  FileText,
  FileCheck2,
  PackageCheck,
  FolderOpen,
  MessageSquare,
  Bot,
  Bookmark,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currency, setCurrency, language, setLanguage, setIsAiDrawerOpen, savedConfigIds } = useWorkspace();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-slate-100 group-hover:text-blue-400 transition">
                WUCHAN
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">
                International Prefab Platform
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/categories" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <Layers className="w-3.5 h-3.5" />
              Categories
            </Link>
            <Link href="/products" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <Building2 className="w-3.5 h-3.5" />
              Products
            </Link>
            <Link href="/compare" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              Compare
            </Link>

            <span className="h-4 w-px bg-slate-800" />

            <Link href="/dashboard" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              Dashboard
            </Link>
            <Link href="/projects" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              Projects
            </Link>
            <Link href="/rfqs" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <FileText className="w-3.5 h-3.5" />
              RFQs
            </Link>
            <Link href="/quotes/qte_2025_8819" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              Quotes
            </Link>
            <Link href="/orders/ord_2025_9912" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              Orders
            </Link>
            <Link href="/documents" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <FolderOpen className="w-3.5 h-3.5" />
              Vault
            </Link>
            <Link href="/messages" className="hover:text-blue-400 transition flex items-center gap-1.5 py-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Messages
            </Link>
          </nav>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Saved items */}
          <Link
            href="/saved"
            className="relative p-2 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition"
            title="Saved Configurations"
          >
            <Bookmark className="w-4 h-4" />
            {savedConfigIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {savedConfigIds.length}
              </span>
            )}
          </Link>

          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="hidden sm:inline">AI Spec Assistant</span>
          </button>

          {/* Currency Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:border-slate-700">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
              {(Object.keys(CURRENCY_RATES) as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center justify-between ${
                    currency === c ? 'text-blue-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                  }`}
                >
                  <span>{CURRENCY_RATES[c].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EN/ZH Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:border-slate-700 transition"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
};
