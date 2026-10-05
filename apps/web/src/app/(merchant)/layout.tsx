'use client';

import React from 'react';
import { MerchantProvider, useMerchant } from '@/features/merchant/context/MerchantContext';
import { Layout } from '@/features/merchant/components/Layout';

function MerchantShell({ children }: { children: React.ReactNode }) {
  const { notifications, markNotificationRead, actionCounts } = useMerchant();

  return (
    <Layout
      notifications={notifications}
      onMarkNotificationRead={markNotificationRead}
      actionCounts={actionCounts}
    >
      {children}
    </Layout>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <MerchantProvider>
      <MerchantShell>{children}</MerchantShell>
    </MerchantProvider>
  );
}
