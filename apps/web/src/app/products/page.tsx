'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider, useWorkspace } from '@/lib/context';
import { formatCurrency } from '@/lib/currency';
import { MOCK_PRODUCTS } from '@/lib/adapters/mockData';
import { StructureType, CategoryUsage } from '@wuchan/contracts';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowRight,
  Bookmark,
  X,
} from 'lucide-react';

function ProductsContent() {
  const { currency, language, savedConfigIds, toggleSaveConfig } = useWorkspace();
  const langKey = language as 'en' | 'zh';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<StructureType | 'ALL'>('ALL');
  const [selectedUsage, setSelectedUsage] = useState<CategoryUsage | 'ALL'>('ALL');
  const [selectedCert, setSelectedCert] = useState<string | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = MOCK_PRODUCTS.filter((prod) => {
    const nameMatch =
      prod.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.name.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const typeMatch = selectedType === 'ALL' || prod.structureType === selectedType;
    const usageMatch = selectedUsage === 'ALL' || prod.primaryUsage.includes(selectedUsage);
    const certMatch =
      selectedCert === 'ALL' || prod.performanceSpecs.regionalCertifications.includes(selectedCert);

    return nameMatch && typeMatch && usageMatch && certMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">Product Discovery & Catalogue</h1>
            <p className="text-sm text-slate-400 mt-1">
              Filter commercial prefab models by structural specs, certifications, and application.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search model name or SKU..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center border border-slate-800 rounded-xl bg-slate-900 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs ${
                  viewMode === 'grid' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs ${
                  viewMode === 'list' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              Multi-Faceted Procurement Filter
            </span>

            {(selectedType !== 'ALL' || selectedUsage !== 'ALL' || selectedCert !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  setSelectedUsage('ALL');
                  setSelectedCert('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Structure Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as StructureType | 'ALL')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Typologies</option>
                <option value="LUXURY_POD">Luxury Glamping Pod / Capsule</option>
                <option value="EXPANDABLE_CONTAINER">Expandable Container Home</option>
                <option value="STEEL_VILLA">Light Gauge Steel Villa</option>
                <option value="MODULAR_OFFICE">Modular Commercial Office</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Primary Usage</label>
              <select
                value={selectedUsage}
                onChange={(e) => setSelectedUsage(e.target.value as CategoryUsage | 'ALL')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Applications</option>
                <option value="HOSPITALITY">Hospitality / Glamping</option>
                <option value="RESIDENTIAL">Residential Housing</option>
                <option value="COMMERCIAL">Commercial / Retail</option>
                <option value="EMERGENCY_HOUSING">Workforce / Emergency</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Regional Building Code Certification</label>
              <select
                value={selectedCert}
                onChange={(e) => setSelectedCert(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Regional Codes</option>
                <option value="US_IRC">US IRC / California Title 24</option>
                <option value="EU_CE">European CE Marking</option>
                <option value="AU_AS_NZS">Australia / NZ AS/NZS</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 text-xs text-slate-400 flex items-center justify-between">
            <span>Showing <strong className="text-slate-200">{filteredProducts.length}</strong> prefab models</span>
            <span>All models support custom option configuration</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <p>No models match your filter criteria.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => {
                const isSaved = savedConfigIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                        <img
                          src={prod.images[0]}
                          alt={prod.name[langKey]}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <button
                          onClick={() => toggleSaveConfig(prod.id)}
                          className={`absolute top-2 right-2 p-1.5 rounded-lg border backdrop-blur transition ${
                            isSaved
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title="Save Model"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur border border-slate-800 rounded text-[10px] font-mono text-slate-300">
                          {prod.physicalProfile.floorAreaSqm} m²
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-mono text-slate-500">{prod.sku}</span>
                          <span>{prod.baseLeadTimeDays} Days Lead Time</span>
                        </div>

                        <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-400 transition">
                          {prod.name[langKey]}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {prod.tagline[langKey]}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prod.performanceSpecs.regionalCertifications.map((cert) => (
                            <span
                              key={cert}
                              className="px-2 py-0.5 bg-slate-800/80 text-[10px] text-slate-300 font-mono rounded"
                            >
                              {cert.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Base Price</span>
                        <span className="text-base font-extrabold text-slate-100">
                          {formatCurrency(prod.basePriceUsd, currency)}
                        </span>
                      </div>

                      <Link
                        href={`/products/${prod.id}`}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                      >
                        Configure Specs <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={prod.images[0]}
                      alt={prod.name[langKey]}
                      className="w-24 h-24 object-cover rounded-lg bg-slate-950 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{prod.sku}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-blue-400 rounded">
                          {prod.structureType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100">{prod.name[langKey]}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{prod.tagline[langKey]}</p>
                      <div className="text-[11px] text-slate-500">
                        {prod.physicalProfile.floorAreaSqm} m² • Lead time {prod.baseLeadTimeDays} days • {prod.physicalProfile.containerTypeNeeded}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-500 block text-right">Base Price</span>
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(prod.basePriceUsd, currency)}
                      </span>
                    </div>

                    <Link
                      href={`/products/${prod.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Configure Specs
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <ProductsContent />
    </WorkspaceProvider>
  );
}
