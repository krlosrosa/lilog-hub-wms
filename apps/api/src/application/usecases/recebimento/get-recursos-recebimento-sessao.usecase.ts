import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RecursosRecebimentoSessaoResponseDto } from '../../dtos/recebimento/recursos-recebimento-sessao.dto.js';
import {
  calcularAlertaPausa,
  calcularProximaPausa,
  obterReferenciaTrabalhoContinuoIso,
} from '../../../domain/model/pausas/calcular-alerta-pausa.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type DemandaRecebimentoComAlocacao,
  type IRecebimentoAlocacaoRepository,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import { buildSessaoFuncionariosComDemanda } from '../../services/recebimento/resolve-demandas-ativas-operador.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
  type SessaoFuncionarioRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const PRESENCA_ELEGIVEL = new Set<SessaoFuncionarioRecord['status']>([
  'presente',
  'atraso',
]);

function resolveStatusDemanda(
  demanda: DemandaRecebimentoComAlocacao,
): 'disponivel' | 'atribuida' | 'em_conferencia' | 'impedido' {
  if (demanda.situacao === 'impedido') {
    return 'impedido';
  }
  if (demanda.recebimentoId) {
    return 'em_conferencia';
  }
  if (demanda.alocacaoId && demanda.alocacaoStatus === 'atribuida') {
    return 'atribuida';
  }
  return 'disponivel';
}

function computeKpisRecebimento(
  funcionarios: Array<{
    id: string;
    funcionarioId: number;
    pausaAtiva: unknown;
    alertaPausa: { precisaPausa: boolean } | null;
  }>,
  demandas: Array<{
    statusDemanda: string;
    alocacao: { sessaoFuncionarioId: string } | null;
    conferente: { id: number } | null;
    apoios?: Array<{ funcionarioId: number; status: string }>;
  }>,
  totalFuncionarios: number,
) {
  const sessaoFuncionariosComDemanda = buildSessaoFuncionariosComDemanda(
    demandas,
    funcionarios,
  );

  let emPausa = 0;
  let atuando = 0;
  let ociosos = 0;
  let precisamPausa = 0;

  for (const funcionario of funcionarios) {
    if (funcionario.alertaPausa?.precisaPausa) {
      precisamPausa += 1;
    }

    const temDemanda = sessaoFuncionariosComDemanda.has(funcionario.id);

    if (funcionario.pausaAtiva != null) {
      emPausa += 1;
      if (temDemanda) atuando += 1;
      continue;
    }

    if (temDemanda) {
      atuando += 1;
      continue;
    }

    ociosos += 1;
  }

  const demandasPendentes = demandas.filter((d) => d.statusDemanda === 'disponivel').length;
  const demandasAtribuidas = demandas.filter((d) => d.statusDemanda === 'atribuida').length;
  const demandasEmConferencia = demandas.filter((d) => d.statusDemanda === 'em_conferencia').length;
  const demandasImpedidas = demandas.filter((d) => d.statusDemanda === 'impedido').length;

  return [
    {
      id: 'total-operadores',
      label: 'Total de Operadores',
      value: String(funcionarios.length),
      suffix: `/ ${totalFuncionarios} na sessão`,
      progress:
        totalFuncionarios > 0
          ? Math.round((funcionarios.length / totalFuncionarios) * 100)
          : 0,
      accent: 'primary' as const,
    },
    {
      id: 'atuando',
      label: 'Atuando',
      value: String(atuando).padStart(2, '0'),
      suffix: 'COM DEMANDA',
      accent: 'tertiary' as const,
    },
    {
      id: 'precisam-pausa',
      label: 'Precisam pausa',
      value: String(precisamPausa).padStart(2, '0'),
      suffix: 'ORIENTAR',
      footer: precisamPausa > 0 ? 'REGISTRAR PAUSA RECOMENDADO' : undefined,
      accent: 'warning' as const,
    },
    {
      id: 'ociosos',
      label: 'Ociosos',
      value: String(ociosos).padStart(2, '0'),
      suffix: 'SEM MISSÃO',
      footer: ociosos > 0 ? 'INTERVENÇÃO RECOMENDADA' : undefined,
      accent: 'destructive' as const,
    },
    {
      id: 'em-pausa',
      label: 'Em Pausa',
      value: String(emPausa).padStart(2, '0'),
      suffix: 'AGORA',
      accent: 'muted' as const,
    },
    {
      id: 'demandas-pendentes',
      label: 'Demandas pendentes',
      value: String(demandasPendentes).padStart(2, '0'),
      suffix: 'SEM CONFERENTE',
      footer: demandasPendentes > 0 ? 'ATRIBUIÇÃO NECESSÁRIA' : undefined,
      accent: demandasPendentes > 0 ? ('destructive' as const) : ('muted' as const),
    },
    {
      id: 'demandas-atribuidas',
      label: 'Atribuídas',
      value: String(demandasAtribuidas).padStart(2, '0'),
      suffix: 'AGUARDANDO INÍCIO',
      accent: 'primary' as const,
    },
    {
      id: 'demandas-em-conferencia',
      label: 'Em conferência',
      value: String(demandasEmConferencia).padStart(2, '0'),
      suffix: 'EM ANDAMENTO',
      accent: 'tertiary' as const,
    },
    {
      id: 'demandas-impedidas',
      label: 'Impedidas',
      value: String(demandasImpedidas).padStart(2, '0'),
      suffix: 'AGUARDANDO LIBERAÇÃO',
      footer: demandasImpedidas > 0 ? 'LIBERAR PARA CONFERÊNCIA' : undefined,
      accent: demandasImpedidas > 0 ? ('warning' as const) : ('muted' as const),
    },
  ];
}

@Injectable()
export class GetRecursosRecebimentoSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(
    sessaoId: string,
    unidadeId: string,
  ): Promise<RecursosRecebimentoSessaoResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const [funcionariosRaw, demandasRaw, regrasPausa] = await Promise.all([
      this.sessaoOperacaoRepository.listSessaoFuncionarios(sessaoId),
      this.recebimentoAlocacaoRepository.listDemandasComAlocacao(sessaoId, unidadeId),
      this.configuracaoOperacionalRepository.findRegrasPausaPadrao(sessao.unidadeId),
    ]);

    const funcionariosElegiveis = funcionariosRaw.filter((f) =>
      PRESENCA_ELEGIVEL.has(f.status),
    );

    const ultimasMissoes =
      await this.recebimentoAlocacaoRepository.listUltimasMissoesFinalizadasPorSessao(
        sessaoId,
        unidadeId,
        sessao.inicioReal ?? sessao.inicioPlanejado,
        funcionariosElegiveis.map((funcionario) => funcionario.funcionarioId),
      );

    const ultimasMissoesPorFuncionario = new Map(
      ultimasMissoes.map((item) => [
        item.funcionarioId,
        item.ultimaMissaoFinalizadaEm.toISOString(),
      ]),
    );

    const now = new Date();

    const funcionarios = await Promise.all(
      funcionariosElegiveis.map(async (funcionario) => {
        const pausas =
          await this.sessaoOperacaoRepository.listSessaoFuncionarioPausas(
            sessaoId,
            funcionario.funcionarioId,
          );

        const pausaAtiva = pausas.emPausaAgora
          ? {
              id: pausas.emPausaAgora.id,
              tipo: pausas.emPausaAgora.tipo,
              inicio: pausas.emPausaAgora.inicio.toISOString(),
            }
          : null;

        const pausasFinalizadas = pausas.items
          .filter((item) => item.fim != null)
          .map((item) => ({ fim: item.fim! }));

        const referenciaTrabalho = obterReferenciaTrabalhoContinuoIso(
          funcionario.checkIn,
          pausasFinalizadas,
        );

        const proximaPausa =
          pausaAtiva == null
            ? calcularProximaPausa(referenciaTrabalho, now, regrasPausa)
            : null;

        const alertaPausa =
          proximaPausa?.precisaPausa === true
            ? calcularAlertaPausa(referenciaTrabalho, now, regrasPausa)
            : null;

        return {
          id: funcionario.id,
          funcionarioId: funcionario.funcionarioId,
          matricula: funcionario.matricula,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          statusPresenca: funcionario.status,
          checkIn: funcionario.checkIn?.toISOString() ?? null,
          checkOut: funcionario.checkOut?.toISOString() ?? null,
          pausaAtiva,
          alertaPausa: alertaPausa
            ? {
                precisaPausa: alertaPausa.precisaPausa,
                tipoSugerido: alertaPausa.tipoSugerido,
                tempoTrabalhoContinuoMinutos: alertaPausa.tempoTrabalhoContinuoMinutos,
                intervaloReferenciaMinutos: alertaPausa.intervaloReferenciaMinutos,
                duracaoPausaMinutos: alertaPausa.duracaoPausaMinutos,
                atrasoMinutos: alertaPausa.atrasoMinutos,
                referenciaTrabalhoIso: alertaPausa.referenciaTrabalhoIso,
              }
            : null,
          proximaPausa: proximaPausa
            ? {
                precisaPausa: proximaPausa.precisaPausa,
                tipoSugerido: proximaPausa.tipoSugerido,
                tempoTrabalhoContinuoMinutos: proximaPausa.tempoTrabalhoContinuoMinutos,
                intervaloReferenciaMinutos: proximaPausa.intervaloReferenciaMinutos,
                duracaoPausaMinutos: proximaPausa.duracaoPausaMinutos,
                atrasoMinutos: proximaPausa.atrasoMinutos,
                referenciaTrabalhoIso: proximaPausa.referenciaTrabalhoIso,
                tempoRestanteMinutos: proximaPausa.tempoRestanteMinutos,
              }
            : null,
          tipoVinculo: funcionario.tipoVinculo,
          equipeOrigemNome: funcionario.equipeOrigemNome,
          apoioInicio: funcionario.apoioInicio?.toISOString() ?? null,
          ultimaMissaoFinalizadaEm:
            ultimasMissoesPorFuncionario.get(funcionario.funcionarioId) ?? null,
        };
      }),
    );

    const demandas = await Promise.all(
      demandasRaw.map(async (demanda) => {
        const statusDemanda = resolveStatusDemanda(demanda);
        const apoios =
          await this.recebimentoAlocacaoRepository.listApoiosByPreRecebimentoId(
            demanda.preRecebimentoId,
          );

        return {
          preRecebimentoId: demanda.preRecebimentoId,
          placa: demanda.placa,
          transportadoraNome: demanda.transportadoraNome,
          horarioPrevisto: demanda.horarioPrevisto.toISOString(),
          skuCount: demanda.skuCount,
          dock: demanda.dock,
          statusDemanda,
          recebimentoId: demanda.recebimentoId,
          recebimentoDataInicio: demanda.recebimentoDataInicio?.toISOString() ?? null,
          alocacao:
            demanda.alocacaoId &&
            demanda.alocacaoSessaoFuncionarioId &&
            demanda.alocacaoFuncionarioId &&
            demanda.alocacaoFuncionarioNome &&
            demanda.alocacaoFuncionarioMatricula &&
            demanda.alocacaoAtribuidoEm
              ? {
                  id: demanda.alocacaoId,
                  sessaoFuncionarioId: demanda.alocacaoSessaoFuncionarioId,
                  funcionarioId: demanda.alocacaoFuncionarioId,
                  funcionarioNome: demanda.alocacaoFuncionarioNome,
                  funcionarioMatricula: demanda.alocacaoFuncionarioMatricula,
                  atribuidoEm: demanda.alocacaoAtribuidoEm.toISOString(),
                }
              : null,
          conferente:
            demanda.conferenteId && demanda.conferenteNome
              ? {
                  id: demanda.conferenteId,
                  nome: demanda.conferenteNome,
                }
              : null,
          apoios: apoios.map((apoio) => ({
            id: apoio.id,
            funcionarioId: apoio.funcionarioId,
            funcionarioNome: apoio.funcionarioNome,
            funcionarioMatricula: apoio.funcionarioMatricula,
            status: apoio.status,
            atribuidoEm: apoio.atribuidoEm.toISOString(),
          })),
          empresas: demanda.empresas,
          categorias: demanda.categorias,
        };
      }),
    );

    return {
      sessaoId: sessao.id,
      unidadeId: sessao.unidadeId,
      funcionarios,
      demandas,
      kpis: computeKpisRecebimento(funcionarios, demandas, sessao.totalFuncionarios),
    };
  }
}
