'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { MerchantAdapter, SystemNotification } from '@wuchan/contracts/merchant';

interface MerchantContextType {
  adapter: MerchantAdapter;
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;
  actionCounts: {
    rfqs: number;
    ordersAtRisk: number;
    qcFailures: number;
    lowStock: number;
    missingDocs: number;
  };
}

const MerchantContext = createContext<MerchantContextType | null>(null);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => new MerchantAdapter(), []);
  const [notifications, setNotifications] = useState(adapter.getNotifications());

  const markNotificationRead = (id: string) => {
    adapter.markNotificationRead(id);
    setNotifications([...adapter.getNotifications()]);
  };

  const actions = adapter.getDashboardActionItems();
  const actionCounts = {
    rfqs: actions.rfqsAwaitingResponse.length,
    ordersAtRisk: actions.ordersAtRisk.length,
    qcFailures: actions.qcFailures.length,
    lowStock: actions.lowInventory.length,
    missingDocs: actions.shipmentsMissingDocs.length,
  };

  return (
    <MerchantContext.Provider value={{ adapter, notifications, markNotificationRead, actionCounts }}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (!context) throw new Error('useMerchant must be used within MerchantProvider');
  return context;
}
