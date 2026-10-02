'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { AiAssistantDrawer } from '@/components/ui/AiAssistantDrawer';
import { WorkspaceProvider } from '@/lib/context';
import { Building2, ArrowRight } from 'lucide-react';

function AuthContent() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('alex.morgan@horizonresorts.com');
  const [companyName, setCompanyName] = useState('Horizon International Eco Resorts LLC');
  const [role, setRole] = useState('PROCUREMENT_LEAD');
  const [port, setPort] = useState('Port of Los Angeles (USLAX)');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AiAssistantDrawer />

      <main className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">
              {isLoginMode ? 'Sign In to Procurement Workspace' : 'Register Organization Profile'}
            </h1>
            <p className="text-xs text-slate-400">
              Access project RFQs, historical quote versions, and live order shipping milestones.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Corporate Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {!isLoginMode && (
              <>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Organization / Legal Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Your Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="PROCUREMENT_LEAD">Procurement Lead</option>
                      <option value="ARCHITECT">Architect / Lead Engineer</option>
                      <option value="FINANCE_OFFICER">Finance Director</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Default Seaport</label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Security Password</label>
              <input
                type="password"
                required
                defaultValue="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              {isLoginMode ? 'Enter Workspace' : 'Create Organization Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>{isLoginMode ? "Don't have an organization?" : 'Already registered?'}</span>
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-blue-400 font-semibold hover:underline"
            >
              {isLoginMode ? 'Register Company' : 'Sign In'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WorkspaceProvider>
      <AuthContent />
    </WorkspaceProvider>
  );
}
