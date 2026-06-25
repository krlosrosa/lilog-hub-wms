export function formatIntervaloTrabalho(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) {
    return `${h}h${m.toString().padStart(2, '0')}min`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  return `${m} min`;
}
