import React, { useState, useMemo } from 'react';
import { MerchantAdapter } from '@wuchan/contracts';
import { Layout } from './features/merchant/components/Layout.js';
import { NavTab } from './features/merchant/components/Sidebar.js';

import { DashboardView } from './features/merchant/views/DashboardView.js';
import { ProfileView } from './features/merchant/views/ProfileView.js';
import { LeadsCustomersView } from './features/merchant/views/LeadsCustomersView.js';
import { RFQQuoteView } from './features/merchant/views/RFQQuoteView.js';
import { ProductBOMView } from './features/merchant/views/ProductBOMView.js';
import { InventoryView } from './features/merchant/views/InventoryView.js';
import { ProductionQCView } from './features/merchant/views/ProductionQCView.js';
import { OrdersFinancialsView } from './features/merchant/views/OrdersFinancialsView.js';
import { LogisticsDocumentsView } from './features/merchant/views/LogisticsDocumentsView.js';
import { SupportWarrantyView } from './features/merchant/views/SupportWarrantyView.js';
import { AnalyticsView } from './features/merchant/views/AnalyticsView.js';

export default function App() {
  const adapter = useMemo(() => new MerchantAdapter(), []);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [notifications, setNotifications] = useState(adapter.getNotifications());

  const handleMarkNotificationRead = (id: string) => {
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

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView adapter={adapter} onNavigate={setCurrentTab} />;
      case 'profiles':
        return <ProfileView adapter={adapter} />;
      case 'leads_customers':
        return <LeadsCustomersView adapter={adapter} />;
      case 'rfq_quotes':
        return <RFQQuoteView adapter={adapter} />;
      case 'products_bom':
        return <ProductBOMView adapter={adapter} />;
      case 'inventory':
        return <InventoryView adapter={adapter} />;
      case 'production_qc':
        return <ProductionQCView adapter={adapter} />;
      case 'orders_financials':
        return <OrdersFinancialsView adapter={adapter} />;
      case 'logistics_docs':
        return <LogisticsDocumentsView adapter={adapter} />;
      case 'support_warranty':
        return <SupportWarrantyView adapter={adapter} />;
      case 'analytics':
        return <AnalyticsView adapter={adapter} />;
      default:
        return <DashboardView adapter={adapter} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      actionCounts={actionCounts}
    >
      {renderCurrentView()}
    </Layout>
  );
}
