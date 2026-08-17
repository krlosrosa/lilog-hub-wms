export type EtapaProdutividade = 'conferencia';

export const ETAPAS_PRODUTIVIDADE: {
  id: EtapaProdutividade;
  label: string;
}[] = [{ id: 'conferencia', label: 'Conferência' }];

export const ETAPA_PRODUTIVIDADE_LABELS: Record<EtapaProdutividade, string> = {
  conferencia: 'Conferência',
};

export function parseEtapaProdutividade(
  _value: string | null | undefined,
): EtapaProdutividade {
  return 'conferencia';
}
