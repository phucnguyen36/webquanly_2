import { CurrencyCode } from '../types';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, { symbol: string; prefix: boolean }> = {
  USD: { symbol: '$', prefix: true },
  EUR: { symbol: '€', prefix: true },
  GBP: { symbol: '£', prefix: true },
  AUD: { symbol: 'A$', prefix: true },
  CAD: { symbol: 'C$', prefix: true },
  SGD: { symbol: 'S$', prefix: true },
  JPY: { symbol: '¥', prefix: true },
  VND: { symbol: ' ₫', prefix: false },
  THB: { symbol: '฿', prefix: true },
  CHF: { symbol: 'CHF ', prefix: true },
  HKD: { symbol: 'HK$', prefix: true },
  CNY: { symbol: '¥', prefix: true },
  KRW: { symbol: '₩', prefix: true }
};

// Vietcombank Transfer Buy Exchange Rates in VND (Chuyển khoản Vietcombank)
export const VCB_VND_RATES: Record<CurrencyCode, number> = {
  VND: 1.0,
  USD: 26030.00,
  EUR: 29729.66,
  GBP: 34700.09,
  JPY: 161.40,
  AUD: 18150.06,
  SGD: 20118.12,
  THB: 776.49,
  CAD: 18406.17,
  CHF: 31804.84,
  HKD: 3280.74,
  CNY: 3826.05,
  KRW: 17.76
};

// Relative exchange rates to USD base (1 Unit = X USD)
export const USD_RATES: Record<CurrencyCode, number> = Object.keys(VCB_VND_RATES).reduce((acc, key) => {
  const code = key as CurrencyCode;
  acc[code] = VCB_VND_RATES[code] / VCB_VND_RATES.USD;
  return acc;
}, {} as Record<CurrencyCode, number>);

export function formatTaskCurrency(val: number, curCode: CurrencyCode = 'USD'): string {
  const cfg = CURRENCY_SYMBOLS[curCode] || CURRENCY_SYMBOLS.USD;
  const formatted = val.toLocaleString('en-US');
  return cfg.prefix ? `${cfg.symbol}${formatted}` : `${formatted}${cfg.symbol}`;
}

export function convertToUSD(val: number, fromCurrency: CurrencyCode = 'USD'): number {
  const vndVal = val * (VCB_VND_RATES[fromCurrency] || 26030.00);
  return vndVal / VCB_VND_RATES.USD;
}

export function convertFromUSD(valInUSD: number, toCurrency: CurrencyCode = 'USD'): number {
  const vndVal = valInUSD * VCB_VND_RATES.USD;
  return vndVal / (VCB_VND_RATES[toCurrency] || 1.0);
}
