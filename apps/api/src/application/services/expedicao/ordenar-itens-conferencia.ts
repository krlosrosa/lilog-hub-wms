import type { OpcoesConferenciaInput } from '../../dtos/expedicao/gerar-mapas.dto.js';
import { ordenarItensPickway } from './ordenar-itens-pickway.js';

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
  opcoes: OpcoesConferenciaInput,
): T[] {
  if (opcoes.classificarPor === 'pickway') {
    return ordenarItensPickway(itens);
  }

  return [...itens].sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR'));
}
