import type {
  ArmazemLayoutOcupacaoRecord,
  ArmazemLayoutRecord,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';

export function mapArmazemLayoutResponse(record: ArmazemLayoutRecord) {
  return {
    id: record.id,
    unidadeId: record.unidadeId,
    name: record.nome,
    gridCols: record.gridCols,
    gridRows: record.gridRows,
    versao: record.versao,
    publicadoEm: record.publicadoEm?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    elements: record.elements.map((element) => ({
      id: element.clientKey,
      type: element.type,
      gx: element.gx,
      gy: element.gy,
      gw: element.gw,
      gh: element.gh,
      label: element.label,
      levels: element.levels ?? undefined,
      zona: element.zona ?? undefined,
    })),
    slots: record.slots.map((slot) => ({
      id: slot.id,
      elementClientKey: slot.elementClientKey,
      slotIndex: slot.slotIndex,
      nivel: slot.nivel,
      enderecoId: slot.enderecoId,
    })),
  };
}

export function mapArmazemLayoutOcupacaoResponse(
  record: ArmazemLayoutOcupacaoRecord,
) {
  const base = mapArmazemLayoutResponse(record);

  return {
    ...base,
    slots: record.slots.map((slot) => ({
      id: slot.id,
      elementClientKey: slot.elementClientKey,
      slotIndex: slot.slotIndex,
      nivel: slot.nivel,
      enderecoId: slot.enderecoId,
      endereco: slot.endereco,
    })),
  };
}
