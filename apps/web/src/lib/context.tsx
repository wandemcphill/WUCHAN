'use client';

import React, { createContext, useContext, useState } from 'react';
import { Currency, Language, Organization, UserProfile } from '@wuchan/contracts';
import { MOCK_ORGANIZATION } from '@/lib/adapters/mockData';

interface ContextState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  organization: Organization;
  currentUser: UserProfile;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  savedConfigIds: string[];
  toggleSaveConfig: (id: string) => void;
}

const WorkspaceContext = createContext<ContextState | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<Language>('en');
  const [organization] = useState<Organization>(MOCK_ORGANIZATION);
  const [currentUser] = useState<UserProfile>(MOCK_ORGANIZATION.members[0]);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [savedConfigIds, setSavedConfigIds] = useState<string[]>(['prod_space_pod_x7']);

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
