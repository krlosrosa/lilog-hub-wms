import type { AvariaView } from '@lilog/contracts';

import type { DamageRecord } from '@/features/recebimento-v2/local-db/schema';

export function mapAvariaViewToDamageRecord(
  preRecebimentoId: string,
  avaria: AvariaView,
): DamageRecord {
  return {
    id: avaria.id,
    demandId: preRecebimentoId,
    sku: avaria.sku ?? undefined,
    description: avaria.descricao,
    quantity: avaria.quantidadeCaixas + avaria.quantidadeUnidades,
    motivo: avaria.causa,
    tipo: avaria.tipo,
    natureza: avaria.natureza,
    causa: avaria.causa,
    lote: avaria.lote ?? undefined,
    quantidadeCaixa: avaria.quantidadeCaixas,
    quantidadeUnidade: avaria.quantidadeUnidades,
    registradoAt: avaria.createdAt,
    syncStatus: 'synced',
    replicarParaTodos: avaria.replicado,
    updatedAt: Date.parse(avaria.createdAt) || Date.now(),
    serverAvariaId: avaria.id,
  };
}

export function mapAvariaViewsToDamageRecords(
  preRecebimentoId: string,
  avarias: AvariaView[],
): DamageRecord[] {
  return avarias.map((avaria) => mapAvariaViewToDamageRecord(preRecebimentoId, avaria));
}
