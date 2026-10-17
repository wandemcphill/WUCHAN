import { NextResponse } from 'next/server';
import { callWuchanApi, readAccessToken, refreshStoredSession } from '@/lib/server/supabase-auth';

async function loadSession(token: string) {
  const response = await callWuchanApi('/auth/session', token, { method: 'GET' });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

export async function GET() {
  let token = readAccessToken();
  if (!token) {
    const refreshed = await refreshStoredSession();
    token = refreshed ? readAccessToken() : '';
  }

  if (!token) {
    return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 });
  }

  let { response, payload } = await loadSession(token);
  if (response.status === 401) {
    const refreshed = await refreshStoredSession();
    token = refreshed ? readAccessToken() : '';
    if (token) {
      ({ response, payload } = await loadSession(token));
    }
  }

  return NextResponse.json(payload || { success: false, error: { message: 'Unable to read the session' } }, {
    status: response.status,
  });
}
