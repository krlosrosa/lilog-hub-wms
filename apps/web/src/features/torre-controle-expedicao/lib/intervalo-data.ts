export type IntervaloData = {
  dataInicio: string;
  dataFim: string;
};

export function formatarDataIso(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function criarIntervaloPadraoHoje(): IntervaloData {
  const hoje = formatarDataIso(new Date());
  return { dataInicio: hoje, dataFim: hoje };
}

export function normalizarIntervaloData(intervalo: IntervaloData): IntervaloData {
  if (intervalo.dataInicio <= intervalo.dataFim) {
    return intervalo;
  }

  return {
    dataInicio: intervalo.dataFim,
    dataFim: intervalo.dataInicio,
  };
}

export function transporteNoIntervalo(
  dataTransporte: string,
  intervalo: IntervaloData,
): boolean {
  const { dataInicio, dataFim } = normalizarIntervaloData(intervalo);
  return dataTransporte >= dataInicio && dataTransporte <= dataFim;
}

export function filtrarTransportesPorIntervalo<
  T extends { dataTransporte: string },
>(transportes: readonly T[], intervalo: IntervaloData): T[] {
  const normalizado = normalizarIntervaloData(intervalo);
  return transportes.filter((transporte) =>
    transporteNoIntervalo(transporte.dataTransporte, normalizado),
  );
}

export type LoteExpedicaoResumo = {
  uploadLoteId: string;
  qtdTransportes: number;
  datasReferencia: string[];
};

export function listarLotesNoIntervalo(
  transportes: ReadonlyArray<{
    uploadLoteId?: string | null;
    dataTransporte: string;
  }>,
  intervalo: IntervaloData,
): LoteExpedicaoResumo[] {
  const noIntervalo = filtrarTransportesPorIntervalo(transportes, intervalo);
  const porLote = new Map<string, { count: number; datas: Set<string> }>();

  for (const transporte of noIntervalo) {
    if (!transporte.uploadLoteId) {
      continue;
    }

    const atual = porLote.get(transporte.uploadLoteId) ?? {
      count: 0,
      datas: new Set<string>(),
    };
    atual.count += 1;
    atual.datas.add(transporte.dataTransporte);
    porLote.set(transporte.uploadLoteId, atual);
  }

  return [...porLote.entries()]
    .map(([uploadLoteId, info]) => ({
      uploadLoteId,
      qtdTransportes: info.count,
      datasReferencia: [...info.datas].sort(),
    }))
    .sort((a, b) => b.qtdTransportes - a.qtdTransportes);
}

export function formatarRotuloLote(lote: LoteExpedicaoResumo): string {
  const datas =
    lote.datasReferencia.length === 1
      ? lote.datasReferencia[0]
      : `${lote.datasReferencia[0]} — ${lote.datasReferencia.at(-1)}`;

  return `${datas} · ${lote.qtdTransportes} transp. · ${lote.uploadLoteId.slice(0, 8)}…`;
}
