import { describe, it, expect } from 'vitest';
import { MerchantAdapter } from './adapter.js';
import { formatMoney } from './types.js';

describe('MerchantAdapter Tests', () => {
  it('should initialize profiles correctly', () => {
    const adapter = new MerchantAdapter();
    const org = adapter.getOrganizationProfile();
    const factory = adapter.getFactoryProfile();
    const merchant = adapter.getMerchantProfile();

    expect(org.name).toContain('Apex Modular Structure');
    expect(factory.annualCapacityUnits).toBe(1200);
    expect(merchant.exportMarkets).toContain('North America');
  });

  it('should calculate priority action items correctly', () => {
    const adapter = new MerchantAdapter();
    const actions = adapter.getDashboardActionItems();

    expect(actions.rfqsAwaitingResponse.length).toBeGreaterThan(0);
    expect(actions.lowInventory.length).toBeGreaterThan(0);
    expect(actions.qcFailures.length).toBeGreaterThan(0);
    expect(actions.shipmentsMissingDocs.length).toBeGreaterThan(0);
    expect(actions.overdueInvoices.length).toBeGreaterThan(0);
  });

  it('should create a new quote version with Money objects without overwriting existing versions', () => {
    const adapter = new MerchantAdapter();
    const quotes = adapter.getQuotes();
    const quote = quotes[0];
    const initialVersionCount = quote.versions.length;

    const newQuote = adapter.createQuoteVersion(quote.id, {
      createdBy: 'Sales Manager - Dave',
      changeLog: 'Added engineering expedited surcharge.',
      items: quote.versions[0].items,
      subtotal: { amount: 30000000, currency: 'USD' },
      discount: { amount: 0, currency: 'USD' },
      shipping: { amount: 2000000, currency: 'USD' },
      totalAmount: { amount: 32000000, currency: 'USD' },
      incoterm: 'DDP',
      paymentTerms: '50/50',
      validUntil: '2026-11-01T00:00:00Z',
      leadTimeWeeks: 6,
    });

    expect(newQuote.versions.length).toBe(initialVersionCount + 1);
    expect(newQuote.currentVersionNumber).toBe(3);
    expect(formatMoney(newQuote.versions[newQuote.versions.length - 1].totalAmount)).toBe('$320,000.00');
  });

  it('should handle all 10 inventory states properly', () => {
    const adapter = new MerchantAdapter();
    const inventory = adapter.getInventory();
    const item = inventory[0];

    const keys = Object.keys(item.quantities);
    expect(keys).toContain('available');
    expect(keys).toContain('reserved');
    expect(keys).toContain('allocated');
    expect(keys).toContain('in_production');
    expect(keys).toContain('qc_hold');
    expect(keys).toContain('damaged');
    expect(keys).toContain('quarantined');
    expect(keys).toContain('packed');
    expect(keys).toContain('dispatched');
    expect(keys).toContain('in_transit');

    const updated = adapter.adjustInventoryQuantity(item.sku, 'qc_hold', 50);
    expect(updated.quantities.qc_hold).toBe(200);
  });

  it('should create stock reservations and update available stock', () => {
    const adapter = new MerchantAdapter();
    const inventory = adapter.getInventory();
    const item = inventory[0];
    const prevAvailable = item.quantities.available;

    const reservation = adapter.createStockReservation({
      sku: item.sku,
      quantity: 50,
      state: 'reserved',
    });

    expect(reservation.status).toBe('ACTIVE');
    const updatedItem = adapter.getInventory().find(i => i.sku === item.sku);
    expect(updatedItem?.quantities.available).toBe(prevAvailable - 50);
  });

  it('should submit an order change request using Money types', () => {
    const adapter = new MerchantAdapter();
    const orders = adapter.getOrders();
    const order = orders[0];

    const cr = adapter.submitOrderChangeRequest(order.id, {
      requestNumber: 'CR-2026-099',
      requestedBy: 'CUSTOMER',
      reason: 'Change cladding color to Matt Black',
      description: 'Customer sent written request for black anodized finish.',
      commercialImpact: { amount: 120000, currency: 'USD' },
      leadTimeImpactDays: 2,
    });

    expect(cr.status).toBe('PENDING_CUSTOMER_APPROVAL');
    expect(formatMoney(cr.commercialImpact)).toBe('$1,200.00');
    const updatedOrder = adapter.getOrders().find(o => o.id === order.id);
    expect(updatedOrder?.changeRequests.length).toBeGreaterThan(0);
  });
});
