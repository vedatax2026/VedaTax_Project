const LOCALES = { USD: 'en-US', CAD: 'en-CA', INR: 'en-IN' };

export function formatPrice(amount, currency) {
  return new Intl.NumberFormat(LOCALES[currency] || 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
