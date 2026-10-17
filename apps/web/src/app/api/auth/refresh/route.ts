import { NextResponse } from 'next/server';
import { refreshStoredSession } from '@/lib/server/supabase-auth';

export async function POST() {
  const refreshed = await refreshStoredSession();
  if (!refreshed) {
    return NextResponse.json({ success: false, error: 'Session refresh failed' }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: { refreshed: true } });
}
