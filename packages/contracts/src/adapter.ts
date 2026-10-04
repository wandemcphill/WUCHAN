import {
  OrganizationProfile,
  FactoryProfile,
  MerchantProfile,
  Lead,
  Customer,
  RFQ,
  Quote,
  QuoteVersion,
  InventoryItem,
  StockReservation,
  Warehouse,
  Product,
  ProductionOrder,
  Order,
  OrderChangeRequest,
  Shipment,
  DocumentRecord,
  Invoice,
  PaymentRecord,
  CustomerConversation,
  SystemNotification,
  WarrantyClaim,
  OperationalAnalytics,
  InventoryState,
} from './types.js';

import {
  mockOrganization,
  mockFactory,
  mockMerchant,
  mockLeads,
  mockCustomers,
  mockRFQs,
  mockQuotes,
  mockInventory,
  mockReservations,
  mockWarehouses,
  mockProducts,
  mockProductionOrders,
  mockOrders,
  mockShipments,
  mockDocuments,
  mockInvoices,
  mockPayments,
  mockConversations,
  mockNotifications,
  mockWarrantyClaims,
  mockAnalytics,
} from './fixtures.js';

export class MerchantAdapter {
  private organization: OrganizationProfile = { ...mockOrganization };
  private factory: FactoryProfile = { ...mockFactory };
  private merchant: MerchantProfile = { ...mockMerchant };

  private leads: Lead[] = [...mockLeads];
  private customers: Customer[] = [...mockCustomers];
  private rfqs: RFQ[] = [...mockRFQs];
  private quotes: Quote[] = [...mockQuotes];
  private inventory: InventoryItem[] = [...mockInventory];
  private reservations: StockReservation[] = [...mockReservations];
  private warehouses: Warehouse[] = [...mockWarehouses];
  private products: Product[] = [...mockProducts];
  private productionOrders: ProductionOrder[] = [...mockProductionOrders];
  private orders: Order[] = [...mockOrders];
  private shipments: Shipment[] = [...mockShipments];
  private documents: DocumentRecord[] = [...mockDocuments];
  private invoices: Invoice[] = [...mockInvoices];
  private payments: PaymentRecord[] = [...mockPayments];
  private conversations: CustomerConversation[] = [...mockConversations];
  private notifications: SystemNotification[] = [...mockNotifications];
  private warrantyClaims: WarrantyClaim[] = [...mockWarrantyClaims];
  private analytics: OperationalAnalytics = { ...mockAnalytics };

  // Profiles
  getOrganizationProfile(): OrganizationProfile { return { ...this.organization }; }
  updateOrganizationProfile(update: Partial<OrganizationProfile>): OrganizationProfile {
    this.organization = { ...this.organization, ...update };
    return { ...this.organization };
  }

  getFactoryProfile(): FactoryProfile { return { ...this.factory }; }
  updateFactoryProfile(update: Partial<FactoryProfile>): FactoryProfile {
    this.factory = { ...this.factory, ...update };
    return { ...this.factory };
  }

  getMerchantProfile(): MerchantProfile { return { ...this.merchant }; }
  updateMerchantProfile(update: Partial<MerchantProfile>): MerchantProfile {
    this.merchant = { ...this.merchant, ...update };
    return { ...this.merchant };
  }

  // Dashboard Priority Actions
  getDashboardActionItems() {
    return {
      rfqsAwaitingResponse: this.rfqs.filter(r => r.status === 'AWAITING_RESPONSE'),
      quotesAwaitingDecision: this.quotes.filter(q => q.status === 'AWAITING_DECISION'),
      ordersAwaitingPayment: this.orders.filter(o => o.paymentStatus === 'AWAITING_PAYMENT'),
      ordersAtRisk: this.orders.filter(o => o.atRisk),
      productionDelays: this.productionOrders.filter(p => p.delayed),
      qcFailures: this.productionOrders.flatMap(p => p.qcInspections).filter(i => i.result === 'FAIL' && !i.resolved),
      lowInventory: this.inventory.filter(i => i.quantities.available <= i.minThreshold),
      shipmentsMissingDocs: this.shipments.filter(s => s.missingDocuments),
      customersAwaitingResponse: this.conversations.filter(c => c.unreadMerchantCount > 0),
      overdueInvoices: this.invoices.filter(inv => inv.status === 'OVERDUE'),
    };
  }

  // Leads & Customers
  getLeads(): Lead[] { return [...this.leads]; }
  getCustomers(): Customer[] { return [...this.customers]; }

  // RFQs
  getRFQs(): RFQ[] { return [...this.rfqs]; }

  // Quotes (With Immutable Versioning)
  getQuotes(): Quote[] { return [...this.quotes]; }

  createQuoteVersion(quoteId: string, newVersionData: Omit<QuoteVersion, 'version' | 'createdAt'>): Quote {
    const quote = this.quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error(`Quote ${quoteId} not found`);

    const newVersionNumber = quote.currentVersionNumber + 1;
    const fullVersion: QuoteVersion = {
      ...newVersionData,
      version: newVersionNumber,
      createdAt: new Date().toISOString(),
    };

    quote.versions.push(fullVersion);
    quote.currentVersionNumber = newVersionNumber;
    quote.status = 'AWAITING_DECISION';
    quote.updatedAt = new Date().toISOString();

    return { ...quote };
  }

  // Inventory (10 explicit states)
  getInventory(): InventoryItem[] { return [...this.inventory]; }
  getWarehouses(): Warehouse[] { return [...this.warehouses]; }
  getReservations(): StockReservation[] { return [...this.reservations]; }

  adjustInventoryQuantity(sku: string, state: InventoryState, delta: number): InventoryItem {
    const item = this.inventory.find(i => i.sku === sku);
    if (!item) throw new Error(`SKU ${sku} not found`);

    item.quantities[state] = Math.max(0, (item.quantities[state] || 0) + delta);
    return { ...item };
  }

  createStockReservation(reservation: Omit<StockReservation, 'id' | 'reservedAt' | 'status'>): StockReservation {
    const newRes: StockReservation = {
      ...reservation,
      id: `res-${Date.now()}`,
      reservedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.reservations.push(newRes);

    // deduct from available and add to reserved
    this.adjustInventoryQuantity(reservation.sku, 'available', -reservation.quantity);
    this.adjustInventoryQuantity(reservation.sku, reservation.state, reservation.quantity);

    return newRes;
  }

  // Products & BOM
  getProducts(): Product[] { return [...this.products]; }

  // Production Orders & Stage Pipelines
  getProductionOrders(): ProductionOrder[] { return [...this.productionOrders]; }

  // Orders & Non-Destructive Change Requests (CR)
  getOrders(): Order[] { return [...this.orders]; }

  submitOrderChangeRequest(orderId: string, crData: Omit<OrderChangeRequest, 'id' | 'orderId' | 'status' | 'createdAt'>): OrderChangeRequest {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const newCR: OrderChangeRequest = {
      ...crData,
      id: `cr-${Date.now()}`,
      orderId,
      status: 'PENDING_CUSTOMER_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    order.changeRequests.push(newCR);
    return newCR;
  }

  // Shipments & Containers & Packages
  getShipments(): Shipment[] { return [...this.shipments]; }

  // Documents
  getDocuments(): DocumentRecord[] { return [...this.documents]; }

  // Invoices & Payments
  getInvoices(): Invoice[] { return [...this.invoices]; }
  getPayments(): PaymentRecord[] { return [...this.payments]; }

  // Conversations & Notifications
  getConversations(): CustomerConversation[] { return [...this.conversations]; }
  getNotifications(): SystemNotification[] { return [...this.notifications]; }

  markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  // Warranty & Support
  getWarrantyClaims(): WarrantyClaim[] { return [...this.warrantyClaims]; }

  // Analytics
  getAnalytics(): OperationalAnalytics { return { ...this.analytics }; }
}
