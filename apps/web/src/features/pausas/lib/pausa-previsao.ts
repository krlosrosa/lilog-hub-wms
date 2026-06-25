export function computePausaAtivaDeslocamentoMs(
  pausaInicio: string | null | undefined,
  now = new Date(),
): number {
  if (!pausaInicio) {
    return 0;
  }

  const inicioMs = new Date(pausaInicio).getTime();
  return Math.max(0, now.getTime() - inicioMs);
}
