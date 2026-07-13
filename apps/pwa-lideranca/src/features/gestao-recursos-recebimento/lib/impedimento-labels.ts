export const TIPO_IMPEDIMENTO_LABELS: Record<string, string> = {
  carreta_tombada: 'Carreta tombada',
  veiculo_avariado: 'Veículo avariado',
  condicao_insegura: 'Condição insegura',
  acidente: 'Acidente',
  outro: 'Outro',
};

export function resolveTipoImpedimentoLabel(tipo: string): string {
  return TIPO_IMPEDIMENTO_LABELS[tipo] ?? tipo;
}
