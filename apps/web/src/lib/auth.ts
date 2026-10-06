export interface UserSession {
  userId: string;
  email: string;
  orgId?: string;
  role?: string;
}

/**
 * Production authentication is not inferred from client-side state.
 * Return null until the Supabase Auth session is wired to the API.
 */
export function getClientSession(): UserSession | null {
  return null;
}
