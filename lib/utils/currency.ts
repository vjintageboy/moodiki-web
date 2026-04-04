/**
 * Centralized Currency Utility
 * 
 * Rules:
 * - VND: Stored as whole units (e.g. 100000 = 100,000 VND). Scale = 1.
 * - USD: Stored as cents (e.g. 500 = $5.00). Scale = 100.
 */

/**
 * Format raw database currency amount based on current locale.
 * Automatically handles scaling (cents to dollars for USD).
 */
export function formatCurrency(amount: number, locale: string): string {
  const isVND = locale === 'vi';
  const scaledAmount = isVND ? amount : amount / 100;
  
  return new Intl.NumberFormat(isVND ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: isVND ? 'VND' : 'USD',
    maximumFractionDigits: isVND ? 0 : 2,
  }).format(scaledAmount);
}

/**
 * Get the currency symbol based on current locale.
 */
export function getCurrencySymbol(locale: string): string {
  return locale === 'vi' ? '₫' : '$';
}

/**
 * Get the scaling factor used for the raw database amount.
 */
export function getCurrencyScale(locale: string): number {
  return locale === 'vi' ? 1 : 100;
}
