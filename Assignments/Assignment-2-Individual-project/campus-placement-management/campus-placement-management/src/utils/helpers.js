export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Returns the display value for a table column (custom value() or raw field)
export const getValue = (col, row, ctx) => {
  if (col.value) return col.value(row, ctx);
  const raw = row[col.key];
  return raw === undefined || raw === null ? '' : raw;
};

// Converts "Not Placed" -> "badge-not-placed"
export const statusClass = (status) =>
  `badge badge-${String(status).toLowerCase().replace(/\s+/g, '-')}`;

// Formats "2026-10-15" as "15 Oct 2026" without timezone shifts
export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const today = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};
