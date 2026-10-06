'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export default function Page() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');

    try {
      if (mode === 'signin') {
        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to sign in');
        }
        window.location.assign('/dashboard');
        return;
      }

      if (password.length < 8) {
        throw new Error('Use a password with at least 8 characters.');
      }
      if (!/^[A-Za-z]{2}$/.test(countryCode)) {
        throw new Error('Country code must be a two-letter ISO code, such as US or NG.');
      }

      const authResponse = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const authData = await authResponse.json();
      if (!authResponse.ok || !authData.success) {
        throw new Error(authData.error || 'Unable to create account');
      }

      if (authData.data?.requiresEmailConfirmation) {
        setStatus('Account created. Check your email to confirm the account, then return here to sign in.');
        setMode('signin');
        return;
      }

      await fetchApi('/organizations/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          name: companyName,
          slug: slugify(companyName),
          type: 'CUSTOMER',
          countryCode: countryCode.toUpperCase(),
        }),
      });

      window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-7">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">
              {mode === 'signin' ? 'Sign in to WUCHAN' : 'Create your procurement workspace'}
            </h1>
            <p className="text-sm text-slate-400">
              Authenticated workspace access is backed by Supabase Auth and the WUCHAN API.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4 text-xs">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Company / Organization</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Country Code</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NG"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-300 leading-5">
                {error}
              </div>
            )}

            {status && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-emerald-300 leading-5">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              {busy ? 'Processing…' : mode === 'signin' ? 'Sign In' : 'Create Workspace'}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setStatus('');
              }}
              className="text-blue-400 font-semibold hover:underline text-xs"
            >
              {mode === 'signin' ? 'Create a new customer workspace' : 'Already have an account? Sign in'}
            </button>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-5 text-slate-400">
                Payment approval, pricing changes, contracts, and organization permissions are enforced by the API.
                The browser never supplies an authorization role as proof of access.
              </p>
            </div>

            <div className="flex gap-3 text-[11px]">
              <Link href="/dashboard" className="text-slate-400 hover:text-white underline">
                Customer preview
              </Link>
              <Link href="/merchant/dashboard" className="text-slate-400 hover:text-white underline">
                Merchant preview
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
