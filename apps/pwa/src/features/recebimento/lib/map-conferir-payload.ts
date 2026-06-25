import type { ConferirItemPayload } from '../types/recebimento.api';
import type { DetalheItemForm } from '../types/recebimento.schema';
import type { ConferenciaItemMeta } from './map-conferencia-itens';

export function mapConferirPayload(
  form: DetalheItemForm,
  meta: ConferenciaItemMeta,
  validade?: Date,
): ConferirItemPayload {
  const caixas = Number(form.recebidaCaixa) || 0;
  const unidadesAvulsas = Number(form.recebidaUnidade) || 0;
  const totalUnidades = caixas * meta.unidadesPorCaixa + unidadesAvulsas;

  const payload: ConferirItemPayload = {
    produtoId: meta.produtoId,
    quantidadeRecebida: totalUnidades,
    unidadeMedida: 'UN',
  };

  if (meta.config.controlaLote && form.lote.trim()) {
    payload.loteRecebido = form.lote.trim();
  }

  if (meta.config.pesoVariavel && form.peso) {
    payload.pesoRecebido = Number(form.peso);
  }

  if (meta.config.controlaValidade && validade) {
    payload.validade = validade.toISOString();
  }

  return payload;
}
