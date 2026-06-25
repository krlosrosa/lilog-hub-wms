import type {
  ParametrosPausa,
  RegrasPausaPadraoMap,
  SubtipoPausa,
} from '../configuracao-operacional/configuracao-operacional.model.js';

export type AlertaPausaResult = {
  precisaPausa: boolean;
  tipoSugerido: SubtipoPausa;
  tempoTrabalhoContinuoMinutos: number;
  intervaloReferenciaMinutos: number;
  duracaoPausaMinutos: number;
  atrasoMinutos: number;
  referenciaTrabalhoIso: string;
};

export type ProximaPausaResult = AlertaPausaResult & {
  tempoRestanteMinutos: number;
};

export type PausaFinalizadaRef = {
  fim: Date | string;
};

function diffMinutes(startIso: string, end: Date): number {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.round((end.getTime() - start) / 60_000));
}

export function obterReferenciaTrabalhoContinuoIso(
  checkIn: Date | string | null | undefined,
  pausasFinalizadas: PausaFinalizadaRef[],
): string | null {
  if (!checkIn) {
    return null;
  }

  const checkInIso = new Date(checkIn).toISOString();
  let referenciaMs = new Date(checkInIso).getTime();

  for (const pausa of pausasFinalizadas) {
    const fimMs = new Date(pausa.fim).getTime();
    if (fimMs > referenciaMs) {
      referenciaMs = fimMs;
    }
  }

  return new Date(referenciaMs).toISOString();
}

function avaliarRegraProxima(
  referenciaIso: string,
  now: Date,
  tipo: SubtipoPausa,
  regra: ParametrosPausa,
): ProximaPausaResult | null {
  if (regra.intervaloTrabalhoMinutos <= 0) {
    return null;
  }

  const tempoTrabalhoContinuoMinutos = diffMinutes(referenciaIso, now);
  const intervaloReferenciaMinutos = regra.intervaloTrabalhoMinutos;
  const precisaPausa =
    tempoTrabalhoContinuoMinutos >= intervaloReferenciaMinutos;
  const atrasoMinutos = precisaPausa
    ? tempoTrabalhoContinuoMinutos - intervaloReferenciaMinutos
    : 0;
  const tempoRestanteMinutos = Math.max(
    0,
    intervaloReferenciaMinutos - tempoTrabalhoContinuoMinutos,
  );

  return {
    precisaPausa,
    tipoSugerido: tipo,
    tempoTrabalhoContinuoMinutos,
    intervaloReferenciaMinutos,
    duracaoPausaMinutos: regra.duracaoPausaMinutos,
    atrasoMinutos,
    referenciaTrabalhoIso: referenciaIso,
    tempoRestanteMinutos,
  };
}

export function calcularProximaPausa(
  referenciaTrabalhoIso: string | null,
  now: Date,
  regras: RegrasPausaPadraoMap,
): ProximaPausaResult | null {
  if (!referenciaTrabalhoIso) {
    return null;
  }

  const candidatos: ProximaPausaResult[] = [];

  for (const [tipo, regra] of Object.entries(regras) as Array<
    [SubtipoPausa, ParametrosPausa | undefined]
  >) {
    if (!regra) {
      continue;
    }

    const preview = avaliarRegraProxima(referenciaTrabalhoIso, now, tipo, regra);

    if (preview) {
      candidatos.push(preview);
    }
  }

  if (candidatos.length === 0) {
    return null;
  }

  const atrasados = candidatos.filter((item) => item.precisaPausa);

  if (atrasados.length > 0) {
    atrasados.sort((a, b) => b.atrasoMinutos - a.atrasoMinutos);
    return atrasados[0] ?? null;
  }

  candidatos.sort((a, b) => a.tempoRestanteMinutos - b.tempoRestanteMinutos);

  return candidatos[0] ?? null;
}

export function calcularAlertaPausa(
  referenciaTrabalhoIso: string | null,
  now: Date,
  regras: RegrasPausaPadraoMap,
): AlertaPausaResult | null {
  const proxima = calcularProximaPausa(referenciaTrabalhoIso, now, regras);

  if (!proxima?.precisaPausa) {
    return null;
  }

  return proxima;
}
