// Currency and date formatting utilities for Mozambique

export const formatMZN = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0,00 MZN';
  // Portuguese Mozambique format: 286 875,00 MZN (space as thousands separator, comma as decimal)
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} MZN`;
};

export const formatCurrency = (val: number | undefined | null, currency = 'USD'): string => {
  if (val === undefined || val === null || isNaN(val)) return `0,00 ${currency}`;
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} ${currency}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatRelativeDays = (days: number): string => {
  if (days < 0) return `Vencido há ${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
};
