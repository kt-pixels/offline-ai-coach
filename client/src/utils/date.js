export function formatDate(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
