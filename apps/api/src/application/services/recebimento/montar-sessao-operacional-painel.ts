import type { RecebimentoPainelSnapshotDto } from '../../dtos/recebimento/recebimento-painel-snapshot.dto.js';
import type { RecursosRecebimentoSessaoResponseDto } from '../../dtos/recebimento/recursos-recebimento-sessao.dto.js';
import { getReferenciaOciosidadeRecebimentoIso } from './referencia-ociosidade-recebimento.js';
import { getDemandasAtivasDoOperador } from './resolve-demandas-ativas-operador.js';
import type {
  SessaoFuncionarioRecord,
  SessaoRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

type DemandaRecurso = RecursosRecebimentoSessaoResponseDto['demandas'][number];
type FuncionarioRecurso =
  RecursosRecebimentoSessaoResponseDto['funcionarios'][number];

export type SessaoOperacionalPainelInput = {
  sessao: SessaoRecord;
  recursos: RecursosRecebimentoSessaoResponseDto;
  todosFuncionarios: SessaoFuncionarioRecord[];
};

type StatusOperacionalPainel =
  | 'atuando'
  | 'disponivel'
  | 'em_pausa'
  | 'indisponivel';

function formatarHora(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getElapsedMinutes(fromIso: string, now: Date): number {
  const diff = now.getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(diff / 60_000));
}

function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function getDemandaIdentificador(demanda: DemandaRecurso): string {
  return demanda.placa ?? demanda.transportadoraNome ?? 'Recebimento';
}

function getDemandasAtivas(
  demandas: DemandaRecurso[],
  sessaoFuncionarioId: string,
  funcionarioId: number,
): DemandaRecurso[] {
  return getDemandasAtivasDoOperador(
    demandas,
    sessaoFuncionarioId,
    funcionarioId,
  );
}

function pickDemandaPrincipal(
  demandas: DemandaRecurso[],
): DemandaRecurso | undefined {
  return (
    demandas.find((demanda) => demanda.statusDemanda === 'em_conferencia') ??
    demandas.find((demanda) => demanda.statusDemanda === 'atribuida') ??
    demandas[0]
  );
}

function formatAtividadeDemanda(demanda: DemandaRecurso): string {
  const identificador = getDemandaIdentificador(demanda);
  const doca = demanda.dock ? ` · ${demanda.dock}` : '';

  if (demanda.statusDemanda === 'em_conferencia') {
    return `Conferindo ${identificador}${doca}`;
  }

  return `Atribuído · ${identificador}${doca}`;
}

function resolveStatusOperacional(
  funcionario: FuncionarioRecurso,
  demandasAtivas: DemandaRecurso[],
): StatusOperacionalPainel {
  if (funcionario.pausaAtiva && demandasAtivas.length === 0) {
    return 'em_pausa';
  }

  if (demandasAtivas.length > 0) {
    return 'atuando';
  }

  if (
    funcionario.statusPresenca === 'presente' ||
    funcionario.statusPresenca === 'atraso'
  ) {
    return 'disponivel';
  }

  return 'indisponivel';
}

export function mapOperadorPainel(
  funcionario: FuncionarioRecurso,
  demandas: DemandaRecurso[],
  now: Date,
): RecebimentoPainelSnapshotDto['sessaoOperacional']['operadores'][number] {
  const demandasAtivas = getDemandasAtivas(
    demandas,
    funcionario.id,
    funcionario.funcionarioId,
  );
  const principal = pickDemandaPrincipal(demandasAtivas);
  const statusOperacional = resolveStatusOperacional(funcionario, demandasAtivas);
  const precisaPausa = funcionario.alertaPausa?.precisaPausa === true;

  let atividade: string | null = null;
  let placaAtual: string | null = null;
  let docaAtual: string | null = null;

  if (statusOperacional === 'atuando' && principal) {
    atividade = formatAtividadeDemanda(principal);
    placaAtual = principal.placa;
    docaAtual = principal.dock;
  } else if (statusOperacional === 'em_pausa' && funcionario.pausaAtiva) {
    const tipo =
      funcionario.pausaAtiva.tipo === 'termica'
        ? 'térmica'
        : funcionario.pausaAtiva.tipo === 'refeicao'
          ? 'refeição'
          : 'outros';
    atividade = `Em pausa ${tipo} · desde ${formatarHora(funcionario.pausaAtiva.inicio)}`;
  } else if (statusOperacional === 'disponivel') {
    const referencia = getReferenciaOciosidadeRecebimentoIso(
      funcionario.checkIn,
      funcionario.ultimaMissaoFinalizadaEm,
    );
    const minutos = referencia ? getElapsedMinutes(referencia, now) : 0;
    atividade = `Disponível · ${formatDurationMinutes(minutos)} sem missão`;
  } else if (funcionario.statusPresenca === 'atraso') {
    atividade = 'Aguardando início de atividade';
  }

  if (precisaPausa && statusOperacional === 'atuando') {
    atividade = `${atividade ?? 'Atuando'} · pausa recomendada`;
  }

  return {
    id: funcionario.id,
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    status: funcionario.statusPresenca,
    statusOperacional,
    atividade,
    placaAtual,
    docaAtual,
    precisaPausa,
    tipoVinculo: funcionario.tipoVinculo,
  };
}

function extrairKpiValor(
  kpis: RecursosRecebimentoSessaoResponseDto['kpis'],
  id: string,
): number {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) return 0;
  const parsed = Number.parseInt(kpi.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function criarSessaoVaziaPainel(): RecebimentoPainelSnapshotDto['sessaoOperacional'] {
  return {
    sessaoId: null,
    semSessaoAtiva: true,
    equipeNome: 'Sem sessão ativa',
    escalaNome: '—',
    status: 'planejada',
    horaInicio: '00:00',
    horaFim: '00:00',
    presenca: {
      presentes: 0,
      esperados: 0,
      faltas: 0,
      atrasos: 0,
      folgas: 0,
    },
    kpis: [],
    conferentesAtivos: 0,
    emConferencia: 0,
    atuando: 0,
    ociosos: 0,
    emPausa: 0,
    precisamPausa: 0,
    demandasPendentes: 0,
    apoiosTotal: 0,
    gestaoRecursosPath: null,
    operadores: [],
  };
}

export function montarSessaoOperacionalPainel(
  input: SessaoOperacionalPainelInput | null,
  now = new Date(),
): RecebimentoPainelSnapshotDto['sessaoOperacional'] {
  if (!input) {
    return criarSessaoVaziaPainel();
  }

  const { sessao, recursos, todosFuncionarios } = input;

  const presentes = todosFuncionarios.filter(
    (f) => f.status === 'presente',
  ).length;
  const faltas = todosFuncionarios.filter((f) => f.status === 'falta').length;
  const atrasos = todosFuncionarios.filter((f) => f.status === 'atraso').length;
  const folgas = todosFuncionarios.filter((f) => f.status === 'folga').length;
  const apoiosTotal = todosFuncionarios.filter(
    (f) => f.tipoVinculo === 'apoio',
  ).length;

  const operadores = recursos.funcionarios.map((funcionario) =>
    mapOperadorPainel(funcionario, recursos.demandas, now),
  );

  const atuando = extrairKpiValor(recursos.kpis, 'atuando');
  const ociosos = extrairKpiValor(recursos.kpis, 'ociosos');
  const emPausa = extrairKpiValor(recursos.kpis, 'em-pausa');
  const precisamPausa = extrairKpiValor(recursos.kpis, 'precisam-pausa');
  const demandasPendentes = extrairKpiValor(
    recursos.kpis,
    'demandas-pendentes',
  );
  const emConferencia = extrairKpiValor(
    recursos.kpis,
    'demandas-em-conferencia',
  );

  const conferentesAtivos = operadores.filter(
    (op) =>
      op.statusOperacional === 'atuando' || op.statusOperacional === 'disponivel',
  ).length;

  const kpisPainel = recursos.kpis.filter((kpi) =>
    [
      'atuando',
      'ociosos',
      'em-pausa',
      'precisam-pausa',
      'demandas-pendentes',
      'demandas-em-conferencia',
    ].includes(kpi.id),
  );

  return {
    sessaoId: sessao.id,
    semSessaoAtiva: false,
    equipeNome: sessao.equipeNome,
    escalaNome: sessao.escalaNome,
    status: sessao.status,
    horaInicio: sessao.horaInicioPlanejada,
    horaFim: sessao.horaFimPlanejada,
    presenca: {
      presentes,
      esperados: sessao.totalFuncionarios,
      faltas,
      atrasos,
      folgas,
    },
    kpis: kpisPainel,
    conferentesAtivos,
    emConferencia,
    atuando,
    ociosos,
    emPausa,
    precisamPausa,
    demandasPendentes,
    apoiosTotal,
    gestaoRecursosPath: '/recebimento/gestao-recursos',
    operadores,
  };
}
