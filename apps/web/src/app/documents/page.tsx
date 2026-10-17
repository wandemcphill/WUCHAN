'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { MOCK_DOCUMENTS } from '@/lib/adapters/mockData';
import {
  FolderOpen,
  Download,
} from 'lucide-react';

function DocumentsContent() {
  const { language } = useWorkspace();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredDocs = MOCK_DOCUMENTS.filter(
    (d) => selectedCategory === 'ALL' || d.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Project Document Vault</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Engineering Drawings & Compliance Repository</h1>
            <p className="text-sm text-slate-400 mt-1">
              PE Stamped structural drawings, CE/UL certificates, site prep manuals, and commercial invoices.
            </p>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 self-start sm:self-auto"
          >
            <option value="ALL">All Vault Categories</option>
            <option value="ENGINEERING_DRAWING">Engineering Drawings (PE Stamped)</option>
            <option value="COMPLIANCE_CERTIFICATE">CE & UL Compliance Packs</option>
            <option value="COMMERCIAL_INVOICE">Commercial Invoices</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono text-slate-300 rounded">
                    v{doc.currentVersion.versionNumber}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 leading-snug">{doc.title}</h3>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="font-mono text-blue-400 text-[11px] block truncate">
                    {doc.currentVersion.fileName}
                  </span>
                  <div className="text-slate-400 text-[10px] flex items-center justify-between">
                    <span>Uploaded by {doc.currentVersion.uploadedBy}</span>
                    <span>{(doc.currentVersion.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  {doc.currentVersion.notes && (
                    <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
                      {doc.currentVersion.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Access: {doc.accessLevel}</span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading ${doc.currentVersion.fileName}`);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <DocumentsContent />
    </WorkspaceProvider>
  );
}
