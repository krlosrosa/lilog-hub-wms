import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AvariaPatchItem,
  ChecklistPatch,
  ConferenciaPatchItem,
  DemandPatchApplied,
  DemandPatchConflict,
  DemandPatchRequest,
  DemandPatchResult,
  EncerramentoPatch,
  ImpedimentoPatch,
  TemperaturaPatchItem,
} from '@lilog/contracts';

import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  SYNC_REPOSITORY,
  type ISyncRepository,
} from '../../../domain/repositories/sync/sync.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import { ConferirItemUseCase } from '../recebimento/conferir-item.usecase.js';
import { CreateChecklistRecebimentoUseCase } from '../recebimento/create-checklist-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../recebimento/encerrar-conferencia.usecase.js';
import { IniciarRecebimentoUseCase } from '../recebimento/iniciar-recebimento.usecase.js';
import { RegistrarAvariaUseCase } from '../recebimento/registrar-avaria.usecase.js';
import { RegistrarImpedimentoRecebimentoUseCase } from '../recebimento/registrar-impedimento-recebimento.usecase.js';
import { RemoverAvariaRecebimentoUseCase } from '../recebimento/remover-avaria-recebimento.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from '../recebimento/remover-linha-conferencia-recebimento.usecase.js';
import { RemovePesagemRecebimentoUseCase } from '../recebimento/remove-pesagem-recebimento.usecase.js';
import { RetomarConferenciaImpedidaUseCase } from '../recebimento/retomar-conferencia-impedida.usecase.js';
import { UpsertTemperaturaProdutoRecebimentoUseCase } from '../recebimento/upsert-temperatura-produto-recebimento.usecase.js';

const PWA_SYNC_ADAPTER = 'recebimento-v2';

export type PushRecebimentoDemandInput = {
  demandId: string;
  request: DemandPatchRequest;
  userId: number | null;
};

function normalizeChecklistTempBau(value: unknown): number | undefined {
  if (value === '' || value == null) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveChecklistPhotoCount(checklist: ChecklistPatch): number {
  if (typeof checklist.photoCount === 'number' && Number.isFinite(checklist.photoCount)) {
    return Math.max(0, Math.trunc(checklist.photoCount));
  }

  const photoMediaIds = checklist.photoMediaIds;
  if (!photoMediaIds) {
    return 0;
  }

  return [
    ...(photoMediaIds.lacre ?? []),
    ...(photoMediaIds.bauFechado ?? []),
    ...(photoMediaIds.bauAberto ?? []),
    ...(photoMediaIds.extras ?? []),
  ].length;
}

@Injectable()
export class PushRecebimentoDemandUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SYNC_REPOSITORY)
    private readonly syncRepository: ISyncRepository,
    private readonly iniciarRecebimentoUseCase: IniciarRecebimentoUseCase,
    private readonly createChecklistRecebimentoUseCase: CreateChecklistRecebimentoUseCase,
    private readonly upsertTemperaturaProdutoRecebimentoUseCase: UpsertTemperaturaProdutoRecebimentoUseCase,
    private readonly conferirItemUseCase: ConferirItemUseCase,
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
    private readonly removerAvariaRecebimentoUseCase: RemoverAvariaRecebimentoUseCase,
    private readonly registrarImpedimentoRecebimentoUseCase: RegistrarImpedimentoRecebimentoUseCase,
    private readonly retomarConferenciaImpedidaUseCase: RetomarConferenciaImpedidaUseCase,
    private readonly encerrarConferenciaUseCase: EncerrarConferenciaUseCase,
  ) {}

  async execute(input: PushRecebimentoDemandInput): Promise<DemandPatchResult> {
    const { demandId, request, userId } = input;
    const { patch, baseRevision } = request;

    const preRecebimento = await this.preRecebimentoRepository.findById(demandId);
    if (!preRecebimento) {
      throw new NotFoundException(`Pré-recebimento "${demandId}" não encontrado`);
    }

    if (userId != null) {
      const accessible = await this.userRepository.listAccessibleUnidades(userId);
      const hasAccess = accessible.some((u) => u.id === preRecebimento.unidadeId);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Usuário não tem acesso à unidade "${preRecebimento.unidadeId}"`,
        );
      }
    }

    const currentRevision = await this.syncRepository.getAggregateRevision(
      PWA_SYNC_ADAPTER,
      demandId,
    );

    if (baseRevision > 0 && currentRevision > baseRevision) {
      throw new ConflictException(
        JSON.stringify({
          code: 'REVISION_CONFLICT',
          baseRevision,
          currentRevision,
          message:
            'Dados foram modificados desde a última sincronização. Atualize e tente novamente.',
        }),
      );
    }

    let resourceId: string | null = null;
    const applied: DemandPatchApplied = {};
    const conflicts: DemandPatchConflict[] = [];
    let sectionsApplied = 0;

    const resolveRecebimentoId = async (): Promise<string | null> => {
      if (resourceId) {
        return resourceId;
      }

      const existing = await this.recebimentoRepository.findByPreRecebimentoId(demandId);
      if (existing) {
        resourceId = existing.id;
        return existing.id;
      }

      return null;
    };

    const ensureRecebimentoId = async (
      checklist?: ChecklistPatch,
    ): Promise<string | null> => {
      const existing = await resolveRecebimentoId();
      if (existing) {
        return existing;
      }

      if (!checklist) {
        return null;
      }

      const responsavelId =
        checklist.responsavelId ??
        (userId != null
          ? ((await this.userRepository.findById(userId))?.funcionarioId ?? null)
          : null);

      if (!responsavelId) {
        return null;
      }

      try {
        const created = await this.iniciarRecebimentoUseCase.execute({
          data: {
            preRecebimentoId: demandId,
            docaId: checklist.dockId,
            responsavelId,
          },
          userId,
        });
        resourceId = created.id;
        return created.id;
      } catch (err) {
        if (err instanceof ConflictException) {
          const fallback = await this.recebimentoRepository.findByPreRecebimentoId(demandId);
          resourceId = fallback?.id ?? null;
          return resourceId;
        }
        throw err;
      }
    };

    if (patch.checklist) {
      try {
        const checklistApplied = await this.applyChecklist(
          demandId,
          patch.checklist,
          userId,
          ensureRecebimentoId,
        );
        if (checklistApplied) {
          applied.checklist = true;
          sectionsApplied += 1;
        }
      } catch (error) {
        conflicts.push({
          section: 'checklist',
          clientId: patch.checklist.clientChecklistId,
          reason: error instanceof Error ? error.message : 'Erro ao aplicar checklist',
        });
      }
    }

    if (patch.temperaturas?.length) {
      const temperaturasResult = await this.applyTemperaturas(
        patch.temperaturas,
        userId,
        resolveRecebimentoId,
        conflicts,
      );
      if (temperaturasResult.accepted > 0 || temperaturasResult.rejected > 0) {
        applied.temperaturas = temperaturasResult;
        if (temperaturasResult.accepted > 0) {
          sectionsApplied += 1;
        }
      }
    }

    if (patch.conferencias?.length) {
      const conferenciasResult = await this.applyConferencias(
        demandId,
        patch.conferencias,
        userId,
        resolveRecebimentoId,
        conflicts,
      );
      if (conferenciasResult.accepted > 0 || conferenciasResult.rejected > 0) {
        applied.conferencias = conferenciasResult;
        if (conferenciasResult.accepted > 0) {
          sectionsApplied += 1;
        }
      }
    }

    if (patch.avarias?.length) {
      const avariasResult = await this.applyAvarias(
        patch.avarias,
        userId,
        resolveRecebimentoId,
        conflicts,
      );
      if (avariasResult.accepted > 0 || avariasResult.rejected > 0) {
        applied.avarias = avariasResult;
        if (avariasResult.accepted > 0) {
          sectionsApplied += 1;
        }
      }
    }

    if (patch.impedimento) {
      try {
        const impedimentoApplied = await this.applyImpedimento(
          demandId,
          patch.impedimento,
          userId,
        );
        if (impedimentoApplied) {
          applied.impedimento = true;
          sectionsApplied += 1;
        }
      } catch (error) {
        conflicts.push({
          section: 'impedimento',
          clientId: patch.impedimento.clientImpedimentoId,
          reason: error instanceof Error ? error.message : 'Erro ao aplicar impedimento',
        });
      }
    }

    if (patch.encerramento) {
      try {
        const encerrado = await this.applyEncerramento(
          patch.encerramento,
          userId,
          resolveRecebimentoId,
        );
        if (encerrado) {
          applied.encerrado = true;
          sectionsApplied += 1;
        }
      } catch (error) {
        conflicts.push({
          section: 'encerramento',
          reason: error instanceof Error ? error.message : 'Erro ao encerrar conferência',
        });
      }
    }

    let serverRevision = currentRevision;

    if (sectionsApplied > 0) {
      serverRevision = await this.syncRepository.incrementAggregateRevision(
        PWA_SYNC_ADAPTER,
        demandId,
        preRecebimento.unidadeId,
      );

      await this.syncRepository.recordChange({
        adapter: PWA_SYNC_ADAPTER,
        unidadeId: preRecebimento.unidadeId,
        entityType: 'recebimento',
        entityId: resourceId ?? demandId,
        operation: 'upsert',
        revision: serverRevision,
      });
    }

    return {
      serverRevision,
      ...(resourceId ? { resourceId } : {}),
      applied,
      ...(conflicts.length > 0 ? { conflicts } : {}),
    };
  }

  private async applyChecklist(
    demandId: string,
    checklist: ChecklistPatch,
    userId: number | null,
    ensureRecebimentoId: (checklist?: ChecklistPatch) => Promise<string | null>,
  ): Promise<boolean> {
    const preRecebimento = await this.preRecebimentoRepository.findById(demandId);
    if (preRecebimento?.situacao === 'impedido') {
      throw new BadRequestException(
        'Conferência suspensa por impedimento. Retome a conferência para sincronizar o checklist.',
      );
    }

    const recebimentoId = await ensureRecebimentoId(checklist);
    if (!recebimentoId) {
      throw new BadRequestException(
        'Não foi possível iniciar recebimento para sincronizar checklist',
      );
    }

    try {
      await this.createChecklistRecebimentoUseCase.execute({
        recebimentoId,
        userId,
        data: {
          lacre: checklist.lacre,
          tempBau: normalizeChecklistTempBau(checklist.tempBau),
          tempProduto: normalizeChecklistTempBau(checklist.tempProduto),
          conditions: {
            limpeza: checklist.conditions.limpeza ?? false,
            odor: checklist.conditions.odor ?? false,
            estrutura: checklist.conditions.estrutura ?? false,
            vedacao: checklist.conditions.vedacao ?? false,
          },
          observacoes: checklist.observacoes,
          photoCount: resolveChecklistPhotoCount(checklist),
        },
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return false;
      }
      throw err;
    }

    return true;
  }

  private async applyTemperaturas(
    items: TemperaturaPatchItem[],
    userId: number | null,
    resolveRecebimentoId: () => Promise<string | null>,
    conflicts: DemandPatchConflict[],
  ): Promise<{ accepted: number; rejected: number }> {
    let accepted = 0;
    let rejected = 0;

    const recebimentoId = await resolveRecebimentoId();
    if (!recebimentoId) {
      for (const item of items) {
        rejected += 1;
        conflicts.push({
          section: 'temperaturas',
          clientId: item.etapa,
          reason: 'Recebimento não encontrado para registrar temperatura',
        });
      }
      return { accepted, rejected };
    }

    for (const item of items) {
      try {
        await this.upsertTemperaturaProdutoRecebimentoUseCase.execute({
          recebimentoId,
          data: {
            etapa: item.etapa,
            temperatura: item.temperatura,
          },
          operatorId: userId,
        });
        accepted += 1;
      } catch (error) {
        rejected += 1;
        conflicts.push({
          section: 'temperaturas',
          clientId: item.etapa,
          reason: error instanceof Error ? error.message : 'Erro ao registrar temperatura',
        });
      }
    }

    return { accepted, rejected };
  }

  private async applyConferencias(
    demandId: string,
    items: ConferenciaPatchItem[],
    userId: number | null,
    resolveRecebimentoId: () => Promise<string | null>,
    conflicts: DemandPatchConflict[],
  ): Promise<{ accepted: number; rejected: number }> {
    let accepted = 0;
    let rejected = 0;

    const recebimentoId = await resolveRecebimentoId();

    for (const item of items) {
      if (item.deletedAt) {
        const deleteResult = await this.applyConferenciaDelete(
          demandId,
          item,
          recebimentoId,
          userId,
          conflicts,
        );
        if (deleteResult) {
          accepted += 1;
        } else {
          rejected += 1;
        }
        continue;
      }

      if (!recebimentoId) {
        rejected += 1;
        conflicts.push({
          section: 'conferencias',
          clientId: item.clientConferenceId,
          reason: 'Recebimento não encontrado para conferir item',
        });
        continue;
      }

      try {
        await this.conferirItemUseCase.execute({
          recebimentoId,
          data: {
            produtoId: item.produtoId!,
            quantidadeRecebida: item.quantidadeRecebida!,
            unidadeMedida: item.unidadeMedida!,
            loteRecebido: item.loteRecebido,
            pesoRecebido: item.pesoRecebido,
            etiquetaCodigo: item.etiquetaCodigo,
            validade: item.validade ? new Date(item.validade) : undefined,
            unitizadorCodigo: item.unitizadorCodigo,
          },
          userId,
          clientConferenceId: item.clientConferenceId,
        });
        accepted += 1;
      } catch (error) {
        if (error instanceof ConflictException) {
          accepted += 1;
          continue;
        }
        rejected += 1;
        conflicts.push({
          section: 'conferencias',
          clientId: item.clientConferenceId,
          reason: error instanceof Error ? error.message : 'Erro ao conferir item',
        });
      }
    }

    return { accepted, rejected };
  }

  private async applyConferenciaDelete(
    demandId: string,
    item: ConferenciaPatchItem,
    recebimentoId: string | null,
    userId: number | null,
    conflicts: DemandPatchConflict[],
  ): Promise<boolean> {
    if (!recebimentoId) {
      conflicts.push({
        section: 'conferencias',
        clientId: item.clientConferenceId,
        reason: 'Recebimento não encontrado para remover conferência',
      });
      return false;
    }

    if (item.serverPesagemId) {
      try {
        await this.removePesagemRecebimentoUseCase.execute({
          recebimentoId,
          pesagemId: item.serverPesagemId,
          userId,
        });
        return true;
      } catch (error) {
        if (
          error instanceof NotFoundException ||
          error instanceof ConflictException
        ) {
          return true;
        }
        conflicts.push({
          section: 'conferencias',
          clientId: item.clientConferenceId,
          reason: error instanceof Error ? error.message : 'Erro ao remover pesagem',
        });
        return false;
      }
    }

    const itemId =
      item.serverItemId ??
      (await this.resolveServerItemIdByClientConferenceId(demandId, item.clientConferenceId));

    if (!itemId) {
      return true;
    }

    try {
      await this.removerLinhaConferenciaRecebimentoUseCase.execute({
        recebimentoId,
        itemId,
        userId,
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        return true;
      }
      conflicts.push({
        section: 'conferencias',
        clientId: item.clientConferenceId,
        reason: error instanceof Error ? error.message : 'Erro ao remover conferência',
      });
      return false;
    }
  }

  private async resolveServerItemIdByClientConferenceId(
    demandId: string,
    clientConferenceId: string,
  ): Promise<string | null> {
    const context = await this.conferenciaRepository.getConferenciaContext(demandId);
    const match = context?.conferidos.find(
      (conferido) => conferido.clientConferenceId === clientConferenceId,
    );

    if (!match) {
      return null;
    }

    return match.pesagemId ?? match.recebimentoItemId ?? match.id;
  }

  private async applyAvarias(
    items: AvariaPatchItem[],
    userId: number | null,
    resolveRecebimentoId: () => Promise<string | null>,
    conflicts: DemandPatchConflict[],
  ): Promise<{ accepted: number; rejected: number }> {
    let accepted = 0;
    let rejected = 0;

    const recebimentoId = await resolveRecebimentoId();

    for (const item of items) {
      if (item.deletedAt) {
        const deleteResult = await this.applyAvariaDelete(
          item,
          recebimentoId,
          conflicts,
        );
        if (deleteResult) {
          accepted += 1;
        } else {
          rejected += 1;
        }
        continue;
      }

      if (!recebimentoId) {
        rejected += 1;
        conflicts.push({
          section: 'avarias',
          clientId: item.clientDamageId,
          reason: 'Recebimento não encontrado para registrar avaria',
        });
        continue;
      }

      try {
        await this.registrarAvariaUseCase.execute({
          recebimentoId,
          produtoId: item.produtoId,
          lote: item.lote,
          tipo: item.tipo,
          natureza: item.natureza,
          causa: item.causa,
          quantidadeCaixas: item.quantidadeCaixas,
          quantidadeUnidades: item.quantidadeUnidades,
          photoCount: item.photoCount ?? item.mediaIds?.length ?? 0,
          replicarParaTodos: item.replicarParaTodos,
          skusAlvo: item.skusAlvo,
          clientDamageId: item.clientDamageId,
          operatorId: userId ?? 0,
        });
        accepted += 1;
      } catch (error) {
        if (error instanceof ConflictException) {
          accepted += 1;
          continue;
        }
        rejected += 1;
        conflicts.push({
          section: 'avarias',
          clientId: item.clientDamageId,
          reason: error instanceof Error ? error.message : 'Erro ao registrar avaria',
        });
      }
    }

    return { accepted, rejected };
  }

  private async applyAvariaDelete(
    item: AvariaPatchItem,
    recebimentoId: string | null,
    conflicts: DemandPatchConflict[],
  ): Promise<boolean> {
    if (!recebimentoId) {
      return true;
    }

    const avariaId =
      item.serverAvariaId ??
      (await this.resolveServerAvariaIdByClientDamageId(recebimentoId, item.clientDamageId));

    if (!avariaId) {
      return true;
    }

    try {
      await this.removerAvariaRecebimentoUseCase.execute({
        recebimentoId,
        avariaId,
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        return true;
      }
      conflicts.push({
        section: 'avarias',
        clientId: item.clientDamageId,
        reason: error instanceof Error ? error.message : 'Erro ao remover avaria',
      });
      return false;
    }
  }

  private async resolveServerAvariaIdByClientDamageId(
    _recebimentoId: string,
    _clientDamageId: string,
  ): Promise<string | null> {
    // clientDamageId lookup requires server-side mapping; PWA sends serverAvariaId when known.
    return null;
  }

  private async applyImpedimento(
    demandId: string,
    impedimento: ImpedimentoPatch,
    userId: number | null,
  ): Promise<boolean> {
    if (impedimento.retomar) {
      try {
        await this.retomarConferenciaImpedidaUseCase.execute({
          preRecebimentoId: demandId,
          userId,
        });
      } catch (error) {
        if (
          error instanceof ConflictException ||
          error instanceof BadRequestException
        ) {
          return false;
        }
        throw error;
      }
      return true;
    }

    await this.registrarImpedimentoRecebimentoUseCase.execute({
      data: {
        preRecebimentoId: demandId,
        tipo: impedimento.tipo as
          | 'carreta_tombada'
          | 'veiculo_avariado'
          | 'condicao_insegura'
          | 'acidente'
          | 'outro',
        descricao: impedimento.descricao.trim(),
        photoCount: Math.trunc(impedimento.photoCount),
        registradoPorId: impedimento.registradoPorId,
      },
      userId,
    });

    return true;
  }

  private async applyEncerramento(
    encerramento: EncerramentoPatch,
    userId: number | null,
    resolveRecebimentoId: () => Promise<string | null>,
  ): Promise<boolean> {
    const recebimentoId = await resolveRecebimentoId();
    if (!recebimentoId) {
      throw new BadRequestException('Recebimento não encontrado para encerrar conferência');
    }

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);
    if (recebimento && recebimento.situacao !== 'em_conferencia') {
      return false;
    }

    try {
      await this.encerrarConferenciaUseCase.execute({
        recebimentoId,
        userId,
        quantidadePaletes: encerramento.quantidadePaletes,
        teveSobreposicaoCarga: encerramento.teveSobreposicaoCarga,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        return false;
      }
      throw error;
    }

    return true;
  }
}
