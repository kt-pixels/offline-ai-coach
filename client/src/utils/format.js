export function formatNumber(value, unit = '') {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return `0${unit}`;
  return `${Math.round(num)}${unit}`;
}

export function cap(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function shortDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
