// Formatters utilitários
export function formatBRL(value) {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

export function monthLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
