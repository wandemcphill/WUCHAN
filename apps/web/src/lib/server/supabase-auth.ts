import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'wuchan_access_token';
const REFRESH_COOKIE = 'wuchan_refresh_token';

interface SupabaseSession {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
}

function authConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url: url?.replace(/\/$/, ''), key };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function supabaseErrorMessage(payload: any, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  return payload.error_description || payload.msg || payload.message || payload.error || fallback;
}

export async function supabaseAuth(path: string, body: Record<string, unknown>) {
  const { url, key } = authConfig();
  if (!url || !key) {
    return {
      ok: false,
      status: 500,
      data: { message: 'Supabase auth is not configured on the server' },
    };
  }

  const response = await fetch(url + path, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export function persistSession(session: SupabaseSession) {
  if (!session.access_token || !session.refresh_token) return false;
  const jar = cookies();
  jar.set(ACCESS_COOKIE, session.access_token, cookieOptions(session.expires_in || 3600));
  jar.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
  return true;
}

export function clearSession() {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, '', cookieOptions(0));
  jar.set(REFRESH_COOKIE, '', cookieOptions(0));
}

export function readAccessToken() {
  return cookies().get(ACCESS_COOKIE)?.value || '';
}

export function readRefreshToken() {
  return cookies().get(REFRESH_COOKIE)?.value || '';
}

export async function refreshStoredSession() {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return false;

  const result = await supabaseAuth('/auth/v1/token?grant_type=refresh_token', {
    refresh_token: refreshToken,
  });
  if (!result.ok) {
    clearSession();
    return false;
  }
  return persistSession(result.data as SupabaseSession);
}

export function apiOrigin() {
  return (process.env.WUCHAN_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export async function callWuchanApi(path: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + token);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const orgId = cookies().get('wuchan_org_id')?.value;
  if (orgId) headers.set('x-org-id', orgId);

  return fetch(apiOrigin() + path, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}
