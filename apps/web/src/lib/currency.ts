import { Currency, Money } from '@wuchan/contracts';

export const CURRENCY_RATES: Record<Currency, { symbol: string; rateToUsd: number; label: string }> = {
  USD: { symbol: '$', rateToUsd: 1, label: 'USD ($)' },
  EUR: { symbol: '€', rateToUsd: 0.92, label: 'EUR (€)' },
  CNY: { symbol: '¥', rateToUsd: 7.24, label: 'CNY (¥)' },
  GBP: { symbol: '£', rateToUsd: 0.79, label: 'GBP (£)' },
  AUD: { symbol: 'A$', rateToUsd: 1.54, label: 'AUD (A$)' },
};

export function formatCurrency(value: Money | number, currency: Currency = 'USD'): string {
  const target = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const source: Money = typeof value === 'number'
    ? { amountCents: Math.round(value * 100), currency: 'USD' }
    : value;
  const sourceRate = CURRENCY_RATES[source.currency] || CURRENCY_RATES.USD;
  const usdAmount = source.currency === 'USD'
    ? source.amountCents / 100
    : (source.amountCents / 100) / sourceRate.rateToUsd;
  const converted = currency === 'USD' ? usdAmount : usdAmount * target.rateToUsd;
  return target.symbol + converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
