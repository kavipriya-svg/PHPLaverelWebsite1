export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";

export function formatCurrency(amount: number | string, options?: {
  showDecimals?: boolean;
  decimals?: number;
}): string {
  const { showDecimals = true, decimals = 2 } = options || {};
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  if (showDecimals) {
    return `${CURRENCY_SYMBOL}${numAmount.toFixed(decimals)}`;
  }
  
  return `${CURRENCY_SYMBOL}${Math.round(numAmount)}`;
}

export function formatCurrencyCompact(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  if (numAmount >= 10000000) {
    return `${CURRENCY_SYMBOL}${(numAmount / 10000000).toFixed(1)}Cr`;
  }
  if (numAmount >= 100000) {
    return `${CURRENCY_SYMBOL}${(numAmount / 100000).toFixed(1)}L`;
  }
  if (numAmount >= 1000) {
    return `${CURRENCY_SYMBOL}${(numAmount / 1000).toFixed(1)}K`;
  }
  
  return `${CURRENCY_SYMBOL}${numAmount.toFixed(0)}`;
}
