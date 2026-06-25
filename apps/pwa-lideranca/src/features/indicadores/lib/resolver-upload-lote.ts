export type TransporteComLote = {
  uploadLoteId?: string | null;
  dataTransporte?: string;
};

function dataReferenciaHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resolverUploadLoteIdTransportes(
  transportes: ReadonlyArray<TransporteComLote>,
): string | null {
  if (transportes.length === 0) {
    return null;
  }

  const contagem = new Map<string, number>();

  for (const transporte of transportes) {
    if (!transporte.uploadLoteId) {
      continue;
    }

    contagem.set(
      transporte.uploadLoteId,
      (contagem.get(transporte.uploadLoteId) ?? 0) + 1,
    );
  }

  if (contagem.size === 0) {
    return null;
  }

  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

export function resolverUploadLoteIdDoDia(
  transportes: ReadonlyArray<TransporteComLote>,
): string | null {
  const hoje = dataReferenciaHoje();
  const transportesHoje = transportes.filter(
    (transporte) => transporte.dataTransporte === hoje,
  );

  return (
    resolverUploadLoteIdTransportes(transportesHoje) ??
    resolverUploadLoteIdTransportes(transportes)
  );
}
