import type {
  ParametrosPausaApi,
  RegrasPausaPadraoMap,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import type { PausaTipo } from '@/features/pausas/types/pausas.schema';

export type AlertaPausaResult = {
  precisaPausa: boolean;
  tipoSugerido: PausaTipo;
  tempoTrabalhoContinuoMinutos: number;
  intervaloReferenciaMinutos: number;
  duracaoPausaMinutos: number;
  atrasoMinutos: number;
  referenciaTrabalhoIso: string;
};

export type ProximaPausaResult = AlertaPausaResult & {
  tempoRestanteMinutos: number;
};

function diffMinutes(startIso: string, end: Date): number {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.round((end.getTime() - start) / 60_000));
}

export function obterReferenciaTrabalhoContinuoIso(
  checkIn: string | null | undefined,
  pausasFinalizadas: Array<{ fim: string }>,
): string | null {
  if (!checkIn) {
    return null;
  }

  let referenciaMs = new Date(checkIn).getTime();

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
  tipo: PausaTipo,
  regra: ParametrosPausaApi,
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

  for (const tipo of ['termica', 'refeicao', 'outros'] as const) {
    const regra = regras[tipo];
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

export function formatIntervaloTrabalho(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) {
    return `${h}h${m.toString().padStart(2, '0')}min`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  return `${m} min`;
}
