export function formatarTempoEsperado(segundos: number): {
  segundos: number;
  minutos: string;
} {
  const minutos = (segundos / 60).toFixed(1);
  return { segundos, minutos };
}
