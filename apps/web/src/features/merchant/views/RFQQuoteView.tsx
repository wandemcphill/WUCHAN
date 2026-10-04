import React, { useState } from 'react';
import { FileText, Plus, GitCommit, CheckCircle2, Clock } from 'lucide-react';
import { MerchantAdapter, Quote } from '@wuchan/contracts';

interface RFQQuoteViewProps {
  adapter: MerchantAdapter;
}

export const RFQQuoteView: React.FC<RFQQuoteViewProps> = ({ adapter }) => {
  const rfqs = adapter.getRFQs();
  const [quotes, setQuotes] = useState<Quote[]>(adapter.getQuotes());
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(quotes[0] || null);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [discountAmount, setDiscountAmount] = useState(15000);

  const handleCreateNewVersion = () => {
    if (!selectedQuote) return;
    const latestVer = selectedQuote.versions[selectedQuote.versions.length - 1];

    const updated = adapter.createQuoteVersion(selectedQuote.id, {
      createdBy: 'Sales Director - Sarah',
      changeLog: changeNote || 'Updated commercial revision snapshot.',
      items: latestVer.items,
      subtotalUSD: latestVer.subtotalUSD,
      discountUSD: discountAmount,
      shippingUSD: latestVer.shippingUSD,
      totalAmountUSD: latestVer.subtotalUSD - discountAmount + latestVer.shippingUSD,
      incoterm: latestVer.incoterm,
      paymentTerms: latestVer.paymentTerms,
      validUntil: latestVer.validUntil,
      leadTimeWeeks: latestVer.leadTimeWeeks,
    });

    setQuotes(adapter.getQuotes());
    setSelectedQuote(updated);
    setShowVersionForm(false);
    setChangeNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">RFQs & Versioned Commercial Quotes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Quotes are strictly versioned append-only snapshots. Commercial revisions never overwrite previous versions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFQs Column */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Incoming RFQs Queue</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20">{rfqs.length}</span>
          </h3>
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{rfq.rfqNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    {rfq.status}
                  </span>
                </div>
                <p className="text-slate-300 font-medium">{rfq.customerName}</p>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Destination: {rfq.destinationPort}, {rfq.destinationCountry}</p>
                  <p>Due Date: {new Date(rfq.dueDate).toLocaleDateString()}</p>
                </div>
                <button className="w-full mt-2 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition">
                  Create Quote Draft
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quotes List & Version Snapshot Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Commercial Quote Snapshots ({selectedQuote?.quoteNumber})
              </h3>
              <button
                onClick={() => setShowVersionForm(!showVersionForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Version v{(selectedQuote?.currentVersionNumber || 1) + 1}
              </button>
            </div>

            {showVersionForm && (
              <div className="p-4 rounded-lg bg-slate-950 border border-blue-500/30 space-y-3 text-xs">
                <h4 className="font-bold text-blue-400">Create New Quote Version (v{(selectedQuote?.currentVersionNumber || 1) + 1})</h4>
                <div>
                  <label className="block text-slate-400 mb-1">Revision Change Log Note</label>
                  <input
                    type="text"
                    placeholder="e.g., Updated shipping freight cost and applied 5% trade discount..."
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Adjust Discount (USD)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowVersionForm(false)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNewVersion}
                    className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500"
                  >
                    Commit New Version
                  </button>
                </div>
              </div>
            )}

            {/* Version Timeline Cards */}
            {selectedQuote && (
              <div className="space-y-4 pt-2">
                {selectedQuote.versions.map((ver) => (
                  <div
                    key={ver.version}
                    className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                      ver.version === selectedQuote.currentVersionNumber
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-slate-800 bg-slate-950/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <GitCommit className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white text-sm">Quote Version {ver.version}.0</span>
                        {ver.version === selectedQuote.currentVersionNumber && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                            CURRENT ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(ver.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-300 italic">"{ver.changeLog}"</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/50">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Subtotal</p>
                        <p className="font-semibold text-slate-200">${ver.subtotalUSD.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Discount</p>
                        <p className="font-semibold text-emerald-400">-${ver.discountUSD.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Shipping Freight</p>
                        <p className="font-semibold text-slate-200">${ver.shippingUSD.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Total Amount</p>
                        <p className="font-bold text-white text-sm">${ver.totalAmountUSD.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                      <span>Incoterm: {ver.incoterm}</span>
                      <span>Lead Time: {ver.leadTimeWeeks} Weeks</span>
                      <span>Valid Until: {new Date(ver.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
