import { NextResponse } from 'next/server';
import { callWuchanApi, readAccessToken, refreshStoredSession } from '@/lib/server/supabase-auth';

async function proxy(request: Request, path: string[]) {
  const allowed = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
  if (!allowed.includes(request.method)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Method is not allowed' } },
      { status: 405 }
    );
  }

  let token = readAccessToken();
  if (!token) {
    const refreshed = await refreshStoredSession();
    token = refreshed ? readAccessToken() : '';
  }
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 }
    );
  }

  const incoming = new URL(request.url);
  const targetPath = '/' + path.map((segment) => encodeURIComponent(segment)).join('/') + incoming.search;
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  let response = await callWuchanApi(targetPath, token, { method: request.method, body });
  if (response.status === 401) {
    const refreshed = await refreshStoredSession();
    token = refreshed ? readAccessToken() : '';
    if (token) {
      response = await callWuchanApi(targetPath, token, { method: request.method, body });
    }
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function POST(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PATCH(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PUT(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}

export async function DELETE(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path);
}
