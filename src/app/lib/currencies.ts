// ISO 4217 top-12 major currencies
export interface Currency {
  alpha3: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { alpha3: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { alpha3: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { alpha3: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { alpha3: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { alpha3: 'EUR', symbol: '€', name: 'Euro' },
  { alpha3: 'GBP', symbol: '£', name: 'British Pound' },
  { alpha3: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { alpha3: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { alpha3: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { alpha3: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { alpha3: 'USD', symbol: '$', name: 'US Dollar' },
  { alpha3: 'ZAR', symbol: 'R', name: 'South African Rand' },
].sort((a, b) => a.alpha3.localeCompare(b.alpha3)); // Sort by alpha-3 code

export const DEFAULT_CURRENCY = 'USD';

export function getCurrencyByAlpha3(alpha3: string): Currency | undefined {
  return CURRENCIES.find(c => c.alpha3 === alpha3);
}

export function formatCurrency(amount: number, currencyAlpha3: string = DEFAULT_CURRENCY): string {
  const currency = getCurrencyByAlpha3(currencyAlpha3);
  if (!currency) {
    return `$${amount.toFixed(2)}`; // Fallback to USD format
  }
  
  // Format based on currency symbol position
  // Most currencies use symbol before amount
  if (currency.alpha3 === 'JPY' || currency.alpha3 === 'CNY') {
    // Some currencies don't use decimals
    return `${currency.symbol}${Math.round(amount)}`;
  }
  
  return `${currency.symbol}${amount.toFixed(2)}`;
}

