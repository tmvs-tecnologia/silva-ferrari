function parseISODateOnlyToLocalDate(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d);
}

export function formatISODateLocal(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return '-'
  try {
    const d =
      typeof value === 'string'
        ? (parseISODateOnlyToLocalDate(value) ?? new Date(value))
        : value
    if (!d || isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return String(value || '-')
  }
}

export function formatDateTimeBR(value: string | Date | null | undefined): string {
  if (!value) return '-'
  try {
    if (typeof value === 'string') {
      const local = parseISODateOnlyToLocalDate(value);
      if (local) return local.toLocaleDateString('pt-BR');
    }
    const d = typeof value === 'string' ? new Date(value) : value
    if (!d || isNaN(d.getTime())) return String(value)
    const date = d.toLocaleDateString('pt-BR')
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
  } catch {
    return String(value || '-')
  }
}
