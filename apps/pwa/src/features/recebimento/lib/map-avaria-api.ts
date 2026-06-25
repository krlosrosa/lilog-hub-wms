import type { RecebimentoAvariaApi } from '../types/recebimento.api';
import type { AvariaRegistro } from '../types/recebimento.schema';

export function mapAvariaApiToRegistro(
  item: RecebimentoAvariaApi,
): AvariaRegistro {
  return {
    id: item.id,
    quantidadeCaixa: item.quantidadeCaixas,
    quantidadeUnidade: item.quantidadeUnidades,
    tipo: item.tipo,
    natureza: item.natureza,
    causa: item.causa,
    photoCount: item.photoCount,
    replicado: item.replicado,
  };
}
