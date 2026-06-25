import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RecursosSessaoResponseDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
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
  DEMANDA_SEPARACAO_REPOSITORY,
  type DemandaFuncionarioRecord,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
  type SessaoFuncionarioRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const PRESENCA_ELEGIVEL = new Set<SessaoFuncionarioRecord['status']>([
  'presente',
  'atraso',
]);

function mapDemandaFuncionarioToDto(funcionario: DemandaFuncionarioRecord) {
  return {
    id: funcionario.id,
    demandaId: funcionario.demandaId,
    sessaoFuncionarioId: funcionario.sessaoFuncionarioId,
    funcionarioId: funcionario.funcionarioId,
    papel: funcionario.papel,
    entrouEm: funcionario.entrouEm.toISOString(),
    saiuEm: funcionario.saiuEm?.toISOString() ?? null,
  };
}

function mapDemandaToDto(
  demanda: Awaited<
    ReturnType<IDemandaSeparacaoRepository['listBySessaoId']>
  >[number],
  funcionariosPorDemanda: Map<string, DemandaFuncionarioRecord[]>,
) {
  const base = {
    id: demanda.id,
    sessaoId: demanda.sessaoId,
    mapaGrupoId: demanda.mapaGrupoId,
    mapaGrupoTitulo: demanda.mapaGrupoTitulo,
    mapaGrupoMicroUuid: demanda.mapaGrupoMicroUuid,
    mapaGrupoProcesso: demanda.mapaGrupoProcesso,
    transporteId: demanda.transporteId,
    transporteRota: demanda.transporteRota,
    transporteDocaId: demanda.transporteDocaId,
    transporteLacreCarregamento: demanda.transporteLacreCarregamento,
    sessaoFuncionarioId: demanda.sessaoFuncionarioId,
    funcionarioId: demanda.funcionarioId,
    status: demanda.status,
    atribuidoEm: demanda.atribuidoEm.toISOString(),
    iniciadoEm: demanda.iniciadoEm?.toISOString() ?? null,
    finalizadoEm: demanda.finalizadoEm?.toISOString() ?? null,
    tempoEsperadoMinutos: demanda.tempoEsperadoMinutos,
  };

  if (demanda.mapaGrupoProcesso !== 'carregamento') {
    return base;
  }

  const auxiliares = funcionariosPorDemanda.get(demanda.id) ?? [];
  const responsavel: DemandaFuncionarioRecord = {
    id: `responsavel-${demanda.id}`,
    demandaId: demanda.id,
    sessaoFuncionarioId: demanda.sessaoFuncionarioId,
    funcionarioId: demanda.funcionarioId,
    papel: 'responsavel',
    entrouEm: demanda.iniciadoEm ?? demanda.atribuidoEm,
    saiuEm: null,
  };

  return {
    ...base,
    funcionarios: [responsavel, ...auxiliares].map(mapDemandaFuncionarioToDto),
  };
}

function mapAlertaPausaToDto(
  alerta: ReturnType<typeof calcularAlertaPausa>,
) {
  if (!alerta) {
    return null;
  }

  return {
    precisaPausa: alerta.precisaPausa,
    tipoSugerido: alerta.tipoSugerido,
    tempoTrabalhoContinuoMinutos: alerta.tempoTrabalhoContinuoMinutos,
    intervaloReferenciaMinutos: alerta.intervaloReferenciaMinutos,
    duracaoPausaMinutos: alerta.duracaoPausaMinutos,
    atrasoMinutos: alerta.atrasoMinutos,
    referenciaTrabalhoIso: alerta.referenciaTrabalhoIso,
  };
}

function mapProximaPausaToDto(
  proxima: ReturnType<typeof calcularProximaPausa>,
) {
  if (!proxima) {
    return null;
  }

  return {
    precisaPausa: proxima.precisaPausa,
    tipoSugerido: proxima.tipoSugerido,
    tempoTrabalhoContinuoMinutos: proxima.tempoTrabalhoContinuoMinutos,
    intervaloReferenciaMinutos: proxima.intervaloReferenciaMinutos,
    duracaoPausaMinutos: proxima.duracaoPausaMinutos,
    atrasoMinutos: proxima.atrasoMinutos,
    referenciaTrabalhoIso: proxima.referenciaTrabalhoIso,
    tempoRestanteMinutos: proxima.tempoRestanteMinutos,
  };
}

function computeKpis(
  funcionarios: Array<{
    id: string;
    pausaAtiva: unknown;
    alertaPausa: { precisaPausa: boolean } | null;
  }>,
  demandas: Array<{
    status: string;
    sessaoFuncionarioId: string;
    mapaGrupoProcesso: string;
    funcionarios?: Array<{ sessaoFuncionarioId: string }>;
  }>,
  totalFuncionarios: number,
) {
  const demandasAtivasPorSessaoFuncionario = new Set<string>();

  for (const demanda of demandas) {
    if (demanda.status !== 'pendente' && demanda.status !== 'em_andamento') {
      continue;
    }

    demandasAtivasPorSessaoFuncionario.add(demanda.sessaoFuncionarioId);

    if (demanda.mapaGrupoProcesso === 'carregamento' && demanda.funcionarios) {
      for (const funcionario of demanda.funcionarios) {
        demandasAtivasPorSessaoFuncionario.add(funcionario.sessaoFuncionarioId);
      }
    }
  }

  let emPausa = 0;
  let atuando = 0;
  let ociosos = 0;
  let precisamPausa = 0;

  for (const funcionario of funcionarios) {
    if (funcionario.alertaPausa?.precisaPausa) {
      precisamPausa += 1;
    }

    const temDemandaAtiva = demandasAtivasPorSessaoFuncionario.has(funcionario.id);

    if (funcionario.pausaAtiva != null) {
      emPausa += 1;
      if (temDemandaAtiva) {
        atuando += 1;
      }
      continue;
    }

    if (temDemandaAtiva) {
      atuando += 1;
      continue;
    }

    ociosos += 1;
  }

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
      footer:
        precisamPausa > 0 ? 'REGISTRAR PAUSA RECOMENDADO' : undefined,
      accent: 'warning' as const,
    },
    {
      id: 'ociosidade-critica',
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
  ];
}

@Injectable()
export class GetRecursosSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(sessaoId: string): Promise<RecursosSessaoResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const [funcionariosRaw, demandas, regrasPausa] = await Promise.all([
      this.sessaoOperacaoRepository.listSessaoFuncionarios(sessaoId),
      this.demandaSeparacaoRepository.listBySessaoId(sessaoId),
      this.configuracaoOperacionalRepository.findRegrasPausaPadrao(
        sessao.unidadeId,
      ),
    ]);

    const funcionariosElegiveis = funcionariosRaw.filter((f) =>
      PRESENCA_ELEGIVEL.has(f.status),
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
            ? mapProximaPausaToDto(
                calcularProximaPausa(referenciaTrabalho, now, regrasPausa),
              )
            : null;

        const alertaPausa =
          proximaPausa?.precisaPausa === true
            ? mapAlertaPausaToDto(
                calcularAlertaPausa(referenciaTrabalho, now, regrasPausa),
              )
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
          alertaPausa,
          proximaPausa,
        };
      }),
    );

    const demandasCarregamentoIds = demandas
      .filter((demanda) => demanda.mapaGrupoProcesso === 'carregamento')
      .map((demanda) => demanda.id);

    const funcionariosAuxiliares =
      demandasCarregamentoIds.length > 0
        ? await this.demandaSeparacaoRepository.listFuncionariosByDemandaIds(
            demandasCarregamentoIds,
          )
        : [];

    const funcionariosPorDemanda = new Map<string, DemandaFuncionarioRecord[]>();

    for (const funcionario of funcionariosAuxiliares) {
      const list = funcionariosPorDemanda.get(funcionario.demandaId) ?? [];
      list.push(funcionario);
      funcionariosPorDemanda.set(funcionario.demandaId, list);
    }

    const demandasDto = demandas.map((demanda) =>
      mapDemandaToDto(demanda, funcionariosPorDemanda),
    );

    return {
      sessaoId: sessao.id,
      unidadeId: sessao.unidadeId,
      funcionarios,
      demandas: demandasDto,
      kpis: computeKpis(funcionarios, demandasDto, sessao.totalFuncionarios),
    };
  }
}
