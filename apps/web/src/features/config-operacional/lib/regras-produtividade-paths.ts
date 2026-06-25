import type { EtapaProdutividade } from '@/features/config-operacional/types/regra-produtividade-tabs';

export const REGRAS_PRODUTIVIDADE_BASE = '/config-operacional/regras-produtividade';

export function regrasProdutividadeListaPath(aba: EtapaProdutividade = 'separacao'): string {
  return `${REGRAS_PRODUTIVIDADE_BASE}?aba=${aba}`;
}

export function regrasProdutividadeNovaPath(tipo: EtapaProdutividade): string {
  return `${REGRAS_PRODUTIVIDADE_BASE}/nova?tipo=${tipo}`;
}

export function regrasProdutividadeEditPath(
  tipo: EtapaProdutividade,
  id: string,
): string {
  return `${REGRAS_PRODUTIVIDADE_BASE}/${id}?tipo=${tipo}`;
}
