export type EtapaProdutividade = 'separacao' | 'conferencia' | 'carregamento';

export const ETAPAS_PRODUTIVIDADE: {
  id: EtapaProdutividade;
  label: string;
}[] = [
  { id: 'separacao', label: 'Separação' },
  { id: 'conferencia', label: 'Conferência' },
  { id: 'carregamento', label: 'Carregamento' },
];

export const ETAPA_PRODUTIVIDADE_LABELS: Record<EtapaProdutividade, string> = {
  separacao: 'Separação',
  conferencia: 'Conferência',
  carregamento: 'Carregamento',
};

export function parseEtapaProdutividade(
  value: string | null | undefined,
): EtapaProdutividade {
  if (value === 'conferencia' || value === 'carregamento') {
    return value;
  }
  return 'separacao';
}
