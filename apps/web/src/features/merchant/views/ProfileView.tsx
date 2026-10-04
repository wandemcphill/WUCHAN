import React, { useState } from 'react';
import { Building, Factory, Store, ShieldCheck, Save } from 'lucide-react';
import { MerchantAdapter } from '@wuchan/contracts';

interface ProfileViewProps {
  adapter: MerchantAdapter;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ adapter }) => {
  const [org, setOrg] = useState(adapter.getOrganizationProfile());
  const [factory, setFactory] = useState(adapter.getFactoryProfile());
  const [merchant, setMerchant] = useState(adapter.getMerchantProfile());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    adapter.updateOrganizationProfile(org);
    adapter.updateFactoryProfile(factory);
    adapter.updateMerchantProfile(merchant);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Organization, Factory & Merchant Profiles</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage legal enterprise entity, manufacturing facilities, export certifications, and merchant bank details.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition shadow-md"
        >
          <Save className="w-4 h-4" /> Save Profiles
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Profiles successfully updated and synced across contracts!
        </div>
      )}

      {/* Organization Section */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building className="w-4 h-4" /> Legal Organization Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Company Legal Name</label>
            <input
              type="text"
              value={org.name}
              onChange={(e) => setOrg({ ...org, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Tax Registration / EIN Number</label>
            <input
              type="text"
              value={org.taxId}
              onChange={(e) => setOrg({ ...org, taxId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Contact Email</label>
            <input
              type="email"
              value={org.contactEmail}
              onChange={(e) => setOrg({ ...org, contactEmail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Contact Phone</label>
            <input
              type="text"
              value={org.contactPhone}
              onChange={(e) => setOrg({ ...org, contactPhone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Factory Profile */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Factory className="w-4 h-4" /> Manufacturing & Factory Facility Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Factory Name</label>
            <input
              type="text"
              value={factory.factoryName}
              onChange={(e) => setFactory({ ...factory, factoryName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location Address</label>
            <input
              type="text"
              value={factory.location}
              onChange={(e) => setFactory({ ...factory, location: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Facility Area (Sq. Meters)</label>
            <input
              type="number"
              value={factory.facilityAreaSqM}
              onChange={(e) => setFactory({ ...factory, facilityAreaSqM: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Annual Capacity (Prefab Units)</label>
            <input
              type="number"
              value={factory.annualCapacityUnits}
              onChange={(e) => setFactory({ ...factory, annualCapacityUnits: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-400 mb-1 text-xs">Factory Certifications & Standards</label>
          <div className="flex flex-wrap gap-2">
            {factory.certifications.map((cert, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Merchant Profile */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Store className="w-4 h-4" /> Merchant & Export Settlement Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Merchant Trading Name</label>
            <input
              type="text"
              value={merchant.merchantName}
              onChange={(e) => setMerchant({ ...merchant, merchantName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Primary Settlement Bank</label>
            <input
              type="text"
              value={merchant.bankAccounts[0]?.bankName || ''}
              readOnly
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
