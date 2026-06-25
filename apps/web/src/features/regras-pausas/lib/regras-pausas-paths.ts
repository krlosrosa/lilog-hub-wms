import type { TipoPausaRegra } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';

export const REGRAS_PAUSAS_BASE = '/config-operacional/regras-pausas';

export function regrasPausasListaPath(aba: TipoPausaRegra = 'termica'): string {
  return `${REGRAS_PAUSAS_BASE}?aba=${aba}`;
}

export function regrasPausasNovaPath(tipo: TipoPausaRegra): string {
  return `${REGRAS_PAUSAS_BASE}/nova?tipo=${tipo}`;
}

export function regrasPausasEditPath(tipo: TipoPausaRegra, id: string): string {
  return `${REGRAS_PAUSAS_BASE}/${id}?tipo=${tipo}`;
}
