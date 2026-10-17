import { NextResponse } from 'next/server';
import { jsonError, persistSession, supabaseAuth, supabaseErrorMessage } from '@/lib/server/supabase-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

  if (!email || password.length < 8) {
    return jsonError('A valid email and a password of at least 8 characters are required', 400);
  }

  const result = await supabaseAuth('/auth/v1/signup', {
    email,
    password,
    data: fullName ? { full_name: fullName } : {},
  });

  if (!result.ok) {
    return jsonError(supabaseErrorMessage(result.data, 'Unable to create account'), result.status);
  }

  const signedIn = persistSession(result.data);
  return NextResponse.json({
    success: true,
    data: {
      email,
      requiresEmailConfirmation: !signedIn,
    },
  });
}
