import type { OpcoesConferenciaMapa } from '@/features/transporte/types/transporte.schema';
import { ordenarItensPickway } from '@/features/transporte/lib/ordenar-itens-pickway';

export type ItemOrdenavelConferencia = {
  sku: string;
  endereco?: string | null;
  slottingOrdem?: number | null;
  zona?: string | null;
  rua?: string | null;
  posicao?: string | null;
  nivel?: string | null;
  prioridadePicking?: number | null;
};

export function ordenarItensConferencia<T extends ItemOrdenavelConferencia>(
  itens: T[],
  opcoes: OpcoesConferenciaMapa,
): T[] {
  if (opcoes.classificarPor === 'pickway') {
    return ordenarItensPickway(itens);
  }

  return [...itens].sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR'));
}
