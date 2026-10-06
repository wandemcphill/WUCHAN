'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Currency, Language, Organization, UserProfile } from '@wuchan/contracts';
import { MOCK_ORGANIZATION } from '@/lib/adapters/mockData';
import { fetchApi } from '@/lib/api-client';
import { getClientSession } from '@/lib/auth';

interface ContextState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  organization: Organization;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  sessionLoading: boolean;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  savedConfigIds: string[];
  toggleSaveConfig: (id: string) => void;
}

const WorkspaceContext = createContext<ContextState | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<Language>('en');
  const [organization, setOrganization] = useState<Organization>(MOCK_ORGANIZATION);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_ORGANIZATION.members[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [savedConfigIds, setSavedConfigIds] = useState<string[]>(['prod_space_pod_x7']);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const session = await getClientSession();

      if (!mounted) return;

      if (!session) {
        setIsAuthenticated(false);
        setSessionLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setCurrentUser({
        id: session.userId,
        email: session.email,
        fullName: session.email.split('@')[0],
        role: session.role || 'MEMBER',
      });

      if (session.orgId) {
        try {
          const response = await fetchApi<{
            id: string;
            name: string;
            slug: string;
            type: string;
            country_code: string;
            created_at: string;
          }>('/organizations/' + session.orgId);

          if (mounted && response.data) {
            const org = response.data;
            setOrganization({
              id: org.id,
              name: org.name,
              preferredCurrency: 'USD',
              country: org.country_code,
              address: '',
              contactEmail: session.email,
              members: [{
                id: session.userId,
                email: session.email,
                fullName: session.email.split('@')[0],
                role: session.role || 'MEMBER',
              }],
            });
          }
        } catch {
          // Keep the synthetic organization only as a visual fallback if the real
          // organization record cannot be loaded.
        }
      }

      setSessionLoading(false);
    }

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSaveConfig = (id: string) => {
    setSavedConfigIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currency,
        setCurrency,
        language,
        setLanguage,
        organization,
        currentUser,
        isAuthenticated,
        sessionLoading,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        savedConfigIds,
        toggleSaveConfig,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
