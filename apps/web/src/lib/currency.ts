import { Currency } from '@wuchan/contracts';

export const CURRENCY_RATES: Record<Currency, { symbol: string; rateToUsd: number; label: string }> = {
  USD: { symbol: '$', rateToUsd: 1.0, label: 'USD ($)' },
  EUR: { symbol: '€', rateToUsd: 0.92, label: 'EUR (€)' },
  AUD: { symbol: 'A$', rateToUsd: 1.54, label: 'AUD (A$)' },
  AED: { symbol: 'AED ', rateToUsd: 3.67, label: 'AED (Dirham)' },
  RMB: { symbol: '¥', rateToUsd: 7.24, label: 'RMB (¥)' },
};

export function formatCurrency(amountUsd: number, currency: Currency = 'USD'): string {
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = amountUsd * info.rateToUsd;

  return `${info.symbol}${Math.round(converted).toLocaleString('en-US')}`;
}
