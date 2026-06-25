import type { RegrasPausaPadraoMap } from '@/features/config-operacional/types/configuracao-operacional.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import type {
  SessaoFuncionarioPausaApi,
  SessaoPausaTipoApi,
} from '@/features/pausas/types/pausas.api';
import type {
  MonitorStats,
  OperadorEmPausa,
  PausaMonitorStatus,
  PausaRegistroDetalhe,
  PausaRegistroStatus,
} from '@/features/pausas/types/pausas.schema';

const PAUSA_LIMITE_MINUTOS_FALLBACK: Record<SessaoPausaTipoApi, number | null> = {
  termica: 20,
  refeicao: 75,
  outros: null,
};

export function getPausaLimiteMinutos(
  tipo: SessaoPausaTipoApi,
  regrasPausa?: RegrasPausaPadraoMap,
): number | null {
  const fromRules = regrasPausa?.[tipo]?.duracaoPausaMinutos;

  if (fromRules != null && fromRules > 0) {
    return fromRules;
  }

  return PAUSA_LIMITE_MINUTOS_FALLBACK[tipo];
}

export function formatTimeFromIso(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, '0')}min`;
  }
  return `${m} min`;
}

export function diffMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60_000));
}

export function getElapsedMinutes(startIso: string, now = new Date()): number {
  return diffMinutes(startIso, now.toISOString());
}

export function getElapsedSeconds(startIso: string, now = new Date()): number {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / 1000));
}

export function getPausaMonitorInfo(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  now = new Date(),
  regrasPausa?: RegrasPausaPadraoMap,
) {
  const limiteMinutos = getPausaLimiteMinutos(tipo, regrasPausa);
  const elapsed = getElapsedMinutes(inicioIso, now);
  const status =
    limiteMinutos == null
      ? ('em-tempo' as const)
      : elapsed > limiteMinutos
        ? ('atrasado' as const)
        : ('em-tempo' as const);

  return {
    elapsed,
    limiteMinutos,
    status,
    previsaoRetorno: getPrevisaoRetorno(inicioIso, tipo, regrasPausa),
    tempoRestante: getTempoRestante(inicioIso, tipo, now, regrasPausa),
  };
}

function getPrevisaoRetorno(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  regrasPausa?: RegrasPausaPadraoMap,
): string {
  const limite = getPausaLimiteMinutos(tipo, regrasPausa);
  if (limite == null) {
    return '—';
  }
  const previsao = new Date(new Date(inicioIso).getTime() + limite * 60_000);
  return formatTimeFromIso(previsao.toISOString());
}

function getMonitorStatus(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  now = new Date(),
  regrasPausa?: RegrasPausaPadraoMap,
): PausaMonitorStatus {
  const limite = getPausaLimiteMinutos(tipo, regrasPausa);
  if (limite == null) {
    return 'em-tempo';
  }
  const elapsed = getElapsedMinutes(inicioIso, now);
  return elapsed > limite ? 'atrasado' : 'em-tempo';
}

function getTempoRestante(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  now = new Date(),
  regrasPausa?: RegrasPausaPadraoMap,
): string {
  const limite = getPausaLimiteMinutos(tipo, regrasPausa);
  if (limite == null) {
    return formatDurationMinutes(getElapsedMinutes(inicioIso, now));
  }
  const elapsed = getElapsedMinutes(inicioIso, now);
  const remaining = limite - elapsed;
  if (remaining <= 0) {
    return `+${formatDurationMinutes(elapsed - limite)}`;
  }
  return `${remaining} min`;
}

export function mapToOperadorEmPausa(
  funcionario: SessaoFuncionarioApi,
  pausa: SessaoFuncionarioPausaApi,
  now = new Date(),
  regrasPausa?: RegrasPausaPadraoMap,
): OperadorEmPausa {
  return {
    id: String(funcionario.funcionarioId),
    funcionarioId: funcionario.funcionarioId,
    nome: funcionario.nome,
    matricula: funcionario.matricula,
    tipo: pausa.tipo,
    inicio: formatTimeFromIso(pausa.inicio),
    previsaoRetorno: getPrevisaoRetorno(pausa.inicio, pausa.tipo, regrasPausa),
    status: getMonitorStatus(pausa.inicio, pausa.tipo, now, regrasPausa),
    tempoRestante: getTempoRestante(pausa.inicio, pausa.tipo, now, regrasPausa),
    pausaId: pausa.id,
  };
}

export function mapToPausaRegistroDetalhe(
  funcionario: SessaoFuncionarioApi,
  pausa: SessaoFuncionarioPausaApi,
  equipeNome: string,
  regrasPausa?: RegrasPausaPadraoMap,
): PausaRegistroDetalhe {
  const duracaoMin = pausa.fim
    ? diffMinutes(pausa.inicio, pausa.fim)
    : getElapsedMinutes(pausa.inicio);
  const limite = getPausaLimiteMinutos(pausa.tipo, regrasPausa);
  const status: PausaRegistroStatus =
    limite != null && duracaoMin > limite ? 'excedente' : 'regular';

  return {
    id: pausa.id,
    funcionario: funcionario.nome,
    departamento: equipeNome,
    inicio: formatTimeFromIso(pausa.inicio),
    fim: pausa.fim ? formatTimeFromIso(pausa.fim) : '—',
    duracao: formatDurationMinutes(duracaoMin),
    tipo: pausa.tipo,
    status,
  };
}

export function computeMonitorStats(
  operadoresEmPausa: OperadorEmPausa[],
  totalElegiveis: number,
  totalPausadoMinutos: number,
  pausasDoDia: SessaoFuncionarioPausaApi[],
): MonitorStats {
  const atrasosCriticos = operadoresEmPausa.filter(
    (op) => op.status === 'atrasado',
  ).length;

  let pausaMaisLongaMin = 0;
  let pausaMaisLongaOperador = '—';

  for (const pausa of pausasDoDia) {
    const min = pausa.fim
      ? diffMinutes(pausa.inicio, pausa.fim)
      : getElapsedMinutes(pausa.inicio);
    if (min > pausaMaisLongaMin) {
      pausaMaisLongaMin = min;
    }
  }

  const opMaisLonga = operadoresEmPausa.find((op) => {
    const pausa = pausasDoDia.find((p) => p.id === op.pausaId);
    if (!pausa) return false;
    const min = pausa.fim
      ? diffMinutes(pausa.inicio, pausa.fim)
      : getElapsedMinutes(pausa.inicio);
    return min === pausaMaisLongaMin;
  });

  if (opMaisLonga) {
    pausaMaisLongaOperador = opMaisLonga.nome;
  } else if (pausasDoDia.length > 0 && pausaMaisLongaMin > 0) {
    pausaMaisLongaOperador = '—';
  }

  return {
    emPausa: operadoresEmPausa.length,
    totalOperadores: totalElegiveis,
    atrasosCriticos,
    totalPausadoMinutos,
    pausaMaisLonga: formatDurationMinutes(pausaMaisLongaMin),
    pausaMaisLongaOperador,
  };
}

export function isFuncionarioElegivelPausa(
  status: SessaoFuncionarioApi['status'],
): boolean {
  return status === 'presente' || status === 'atraso';
}

export function normalizeMatricula(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatMatriculaDisplay(matricula: string): string {
  const digits = normalizeMatricula(matricula);
  if (digits.length >= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
  }
  return matricula;
}
