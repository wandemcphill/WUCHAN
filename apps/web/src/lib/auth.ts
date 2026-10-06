export interface UserSession {
  userId: string;
  email: string;
  orgId?: string;
  role?: string;
}

export function getClientSession(): UserSession | null {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'dev@wuchan.com',
    orgId: '11111111-1111-1111-1111-111111111111',
    role: 'ORG_OWNER'
  };
}
