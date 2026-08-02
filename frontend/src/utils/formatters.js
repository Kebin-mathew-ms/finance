/**
 * Formats a decimal number or string into a currency representation.
 */
export const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

/**
 * Formats an ISO date string or Date object into a readable representation.
 * Example: "2026-08-02" -> "Aug 2, 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Shift timezone offset if dates are formatted as local dates to prevent day shifting
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + timezoneOffset);

  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a month input (YYYY-MM) or Date into a text month name (e.g., "August 2026")
 */
export const formatMonthName = (monthString) => {
  if (!monthString) return '';
  const parts = monthString.split('-');
  if (parts.length !== 2) return monthString;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  
  const date = new Date(year, monthIdx);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};
