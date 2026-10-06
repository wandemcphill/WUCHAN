export interface UserSession {
  userId: string;
  email: string;
  orgId?: string;
  role?: string;
  permissions?: string[];
}

async function readSession() {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const user = payload?.data?.user;
  if (!payload?.success || !user?.userId) return null;

  return {
    userId: user.userId,
    email: user.email,
    orgId: user.activeOrgId,
    role: user.activeRole,
    permissions: user.permissions,
  } satisfies UserSession;
}

export async function getClientSession(): Promise<UserSession | null> {
  try {
    const session = await readSession();
    if (session) return session;

    const refresh = await fetch('/api/auth/refresh', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
    });

    if (!refresh.ok) return null;
    return await readSession();
  } catch {
    return null;
  }
}
