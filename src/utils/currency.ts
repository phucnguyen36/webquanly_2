import { CurrencyCode } from '../types';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, { symbol: string; prefix: boolean }> = {
  USD: { symbol: '$', prefix: true },
  EUR: { symbol: '€', prefix: true },
  GBP: { symbol: '£', prefix: true },
  AUD: { symbol: 'A$', prefix: true },
  CAD: { symbol: 'C$', prefix: true },
  SGD: { symbol: 'S$', prefix: true },
  JPY: { symbol: '¥', prefix: true },
  VND: { symbol: ' ₫', prefix: false }
};

// Exchange rates relative to USD (1 USD = rate * Currency)
export const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 1.08,     // 1 EUR ≈ 1.08 USD
  GBP: 1.27,     // 1 GBP ≈ 1.27 USD
  AUD: 0.65,     // 1 AUD ≈ 0.65 USD
  CAD: 0.73,     // 1 CAD ≈ 0.73 USD
  SGD: 0.74,     // 1 SGD ≈ 0.74 USD
  JPY: 0.0067,   // 1 JPY ≈ 0.0067 USD
  VND: 0.00004   // 1 VND ≈ 0.00004 USD (25,000 VND = 1 USD)
};

export function formatTaskCurrency(val: number, curCode: CurrencyCode = 'USD'): string {
  const cfg = CURRENCY_SYMBOLS[curCode] || CURRENCY_SYMBOLS.USD;
  const formatted = val.toLocaleString('en-US');
  return cfg.prefix ? `${cfg.symbol}${formatted}` : `${formatted}${cfg.symbol}`;
}

export function convertToUSD(val: number, fromCurrency: CurrencyCode = 'USD'): number {
  const rate = USD_RATES[fromCurrency] || 1.0;
  return val * rate;
}

export function convertFromUSD(valInUSD: number, toCurrency: CurrencyCode = 'USD'): number {
  if (toCurrency === 'VND') return Math.round(valInUSD * 25000);
  const rate = USD_RATES[toCurrency] || 1.0;
  return valInUSD / rate;
}
