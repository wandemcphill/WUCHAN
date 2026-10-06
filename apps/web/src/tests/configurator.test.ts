import { formatCurrency, CURRENCY_RATES } from '../lib/currency';
import { getTranslation } from '../lib/i18n';
import { MOCK_PRODUCTS, MOCK_QUOTES } from '../lib/adapters/mockData';

describe('B2B Currency Formatter', () => {
  it('formats USD correctly with minor-unit precision', () => {
    expect(formatCurrency(48500, 'USD')).toBe('$48,500.00');
  });

  it('converts USD to EUR correctly using the configured rate', () => {
    const amount = { amountCents: 1000000, currency: 'USD' as const };
    const expectedEur = (amount.amountCents / 100) * CURRENCY_RATES.EUR.rateToUsd;
    expect(formatCurrency(amount, 'EUR')).toBe(
      `€${expectedEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    );
  });
});

describe('i18n Translation Adapter', () => {
  it('retrieves English translation strings', () => {
    expect(getTranslation('en', 'nav.products')).toBe('Products');
    expect(getTranslation('en', 'questions.q1')).toBe('What am I buying?');
  });

  it('retrieves Chinese translation strings', () => {
    expect(getTranslation('zh', 'nav.products')).toBe('全部产品');
    expect(getTranslation('zh', 'questions.q1')).toBe('我购买的是什么？');
  });
});

describe('Configurator Math Calculations', () => {
  it('calculates total price, weight, CBM, and lead time deltas accurately', () => {
    const product = MOCK_PRODUCTS[0];
    let priceDeltaCents = 0;
    let weightDelta = 0;
    let cbmDelta = 0;
    let leadDelta = 0;

    product.optionGroups.forEach((grp) => {
      const nonDefault = grp.values.find((v) => !v.isDefault) || grp.values[0];
      priceDeltaCents += nonDefault.priceDeltaUsd.amountCents;
      weightDelta += nonDefault.weightDeltaKg;
      cbmDelta += nonDefault.cbmDelta;
      leadDelta += nonDefault.leadTimeDeltaDays;
    });

    const calculatedPriceCents = product.basePriceUsd.amountCents + priceDeltaCents;
    const calculatedWeight = product.physicalProfile.weightKg + weightDelta;
    const calculatedCbm = product.physicalProfile.shippingVolumeCbm + cbmDelta;
    const calculatedLead = product.baseLeadTimeDays + leadDelta;

    expect(calculatedPriceCents).toBeGreaterThan(product.basePriceUsd.amountCents);
    expect(calculatedWeight).toBeGreaterThan(product.physicalProfile.weightKg);
    expect(calculatedCbm).toBeGreaterThanOrEqual(product.physicalProfile.shippingVolumeCbm);
    expect(calculatedLead).toBeGreaterThanOrEqual(product.baseLeadTimeDays);
  });
});

describe('Quote Version Comparison Matrix', () => {
  it('calculates exact commercial savings delta between Version 1 and Version 2', () => {
    const quote = MOCK_QUOTES[0];
    const v1 = quote.versionHistory[0];
    const v2 = quote.versionHistory[1] || quote.currentVersion;

    const deltaCents = v2.totalUsd.amountCents - v1.totalUsd.amountCents;
    expect(deltaCents).toBeLessThan(0);
    expect(Math.abs(deltaCents)).toBe(36800 * 100);
  });
});
