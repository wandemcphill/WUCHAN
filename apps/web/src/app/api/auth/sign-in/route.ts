import { NextResponse } from 'next/server';
import { jsonError, persistSession, supabaseAuth, supabaseErrorMessage } from '@/lib/server/supabase-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return jsonError('Email and password are required', 400);
  }

  const result = await supabaseAuth('/auth/v1/token?grant_type=password', { email, password });
  if (!result.ok || !persistSession(result.data)) {
    return jsonError(supabaseErrorMessage(result.data, 'Unable to sign in'), result.ok ? 401 : result.status);
  }

  return NextResponse.json({
    success: true,
    data: { email: result.data.user?.email || email },
  });
}
