import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/server/supabase-auth';

export async function POST() {
  clearSession();
  return NextResponse.json({ success: true, data: { signedOut: true } });
}
