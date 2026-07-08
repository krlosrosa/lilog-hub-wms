import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RecursosDevolucaoSessaoResponseDto } from '../../dtos/devolucao/recursos-devolucao-sessao.dto.js';
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
  DEVOLUCAO_REPOSITORY,
  type DevolucaoAlocacaoComContexto,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
  type SessaoFuncionarioRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const PRESENCA_ELEGIVEL = new Set<SessaoFuncionarioRecord['status']>([
  'presente',
  'atraso',
]);

function mapAlocacaoToDto(alocacao: DevolucaoAlocacaoComContexto) {
  return {
    id: alocacao.id,
    demandaId: alocacao.demandaId,
    codigoDemanda: alocacao.codigoDemanda,
    status: alocacao.demandaStatus,
    etapa: alocacao.etapa,
    totalNfs: alocacao.totalNfs,
    totalItens: alocacao.totalItens,
    pesoDevolvido: alocacao.pesoDevolvido,
    cliente: alocacao.cliente,
    placa: alocacao.placa,
    transporteId: alocacao.transporteId,
    sessaoFuncionarioId: alocacao.sessaoFuncionarioId,
    funcionarioId: alocacao.funcionarioId,
    funcao: alocacao.funcao,
    atribuidoEm: alocacao.atribuidoEm.toISOString(),
    inicioEm: alocacao.inicioEm?.toISOString() ?? null,
    tempoEsperadoMinutos: alocacao.tempoEsperadoMinutos,
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
  alocacoes: Array<{ sessaoFuncionarioId: string }>,
  totalFuncionarios: number,
) {
  const alocacoesAtivasPorSessaoFuncionario = new Set(
    alocacoes.map((alocacao) => alocacao.sessaoFuncionarioId),
  );

  let emPausa = 0;
  let atuando = 0;
  let ociosos = 0;
  let precisamPausa = 0;

  for (const funcionario of funcionarios) {
    if (funcionario.alertaPausa?.precisaPausa) {
      precisamPausa += 1;
    }

    const temAlocacaoAtiva = alocacoesAtivasPorSessaoFuncionario.has(
      funcionario.id,
    );

    if (funcionario.pausaAtiva != null) {
      emPausa += 1;
      if (temAlocacaoAtiva) {
        atuando += 1;
      }
      continue;
    }

    if (temAlocacaoAtiva) {
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
export class GetRecursosDevolucaoSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(sessaoId: string): Promise<RecursosDevolucaoSessaoResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const [funcionariosRaw, alocacoes, regrasPausa] = await Promise.all([
      this.sessaoOperacaoRepository.listSessaoFuncionarios(sessaoId),
      this.devolucaoRepository.listarAlocacoesPorSessao(
        sessaoId,
        sessao.unidadeId,
      ),
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

    const alocacoesDto = alocacoes.map(mapAlocacaoToDto);

    return {
      sessaoId: sessao.id,
      unidadeId: sessao.unidadeId,
      funcionarios,
      alocacoes: alocacoesDto,
      kpis: computeKpis(funcionarios, alocacoesDto, sessao.totalFuncionarios),
    };
  }
}
