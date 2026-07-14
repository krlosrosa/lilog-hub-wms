import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type ConferenciaConferidoRecord,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import {
  SYNC_REPOSITORY,
  type ISyncRepository,
} from '../../../domain/repositories/sync/sync.repository.js';

function mapConferidoToSnapshot(conferido: ConferenciaConferidoRecord) {
  return {
    id: conferido.id,
    produtoId: conferido.produtoId,
    sku: conferido.sku,
    quantidadeRecebida: conferido.quantidadeRecebida,
    unidadeMedida: conferido.unidadeMedida,
    unidadesPorCaixa: conferido.unidadesPorCaixa,
    loteRecebido: conferido.loteRecebido,
    validade: conferido.validade?.toISOString() ?? null,
    pesoRecebido: conferido.pesoRecebido,
    etiquetaCodigo: conferido.etiquetaCodigo,
    pesagemId: conferido.pesagemId,
    recebimentoItemId: conferido.recebimentoItemId,
  };
}

export type GetRecebimentoV2SnapshotInput = {
  processId: string;
  userId: number | null;
};

export type RecebimentoV2Snapshot = {
  processId: string;
  revision: number;
  situacao: string;
  conferencias: unknown[];
  avarias: unknown[];
  temperaturas: Array<{
    etapa: string;
    temperatura: number;
  }>;
  checklist: {
    id: string;
    recebimentoId: string;
    lacre: string | null;
    tempBau: number | null;
    tempProduto: number | null;
    conditions: {
      limpeza: boolean;
      odor: boolean;
      estrutura: boolean;
      vedacao: boolean;
    };
    observacoes: string | null;
    photoCount: number;
    createdAt: string;
    docaId: string | null;
  } | null;
  encerradoEm: string | null;
};

@Injectable()
export class GetRecebimentoV2SnapshotUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SYNC_REPOSITORY)
    private readonly syncRepository: ISyncRepository,
  ) {}

  async execute(input: GetRecebimentoV2SnapshotInput): Promise<RecebimentoV2Snapshot> {
    const preRecebimento = await this.preRecebimentoRepository.findById(input.processId);
    if (!preRecebimento) {
      throw new NotFoundException(`Pré-recebimento "${input.processId}" não encontrado`);
    }

    if (input.userId !== null) {
      const accessible = await this.userRepository.listAccessibleUnidades(input.userId);
      const hasAccess = accessible.some((u) => u.id === preRecebimento.unidadeId);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Usuário não tem acesso à unidade "${preRecebimento.unidadeId}"`,
        );
      }
    }

    const [detalhe, conferenciaContext, revision] = await Promise.all([
      this.preRecebimentoRepository.findDetalheById(input.processId),
      this.conferenciaRepository.getConferenciaContext(input.processId),
      this.syncRepository.getAggregateRevision('recebimento-v2', input.processId),
    ]);

    const recebimentoId = detalhe?.recebimento?.id;
    const [conferencias, temperaturas] = await Promise.all([
      Promise.resolve((conferenciaContext?.conferidos ?? []).map(mapConferidoToSnapshot)),
      recebimentoId
        ? this.conferenciaRepository
            .listTemperaturasProduto(recebimentoId)
            .then((items) =>
              items.map((item) => ({
                etapa: item.etapa,
                temperatura: item.temperatura,
              })),
            )
            .catch(() => [] as Array<{ etapa: string; temperatura: number }>)
        : Promise.resolve([] as Array<{ etapa: string; temperatura: number }>),
    ]);

    return {
      processId: input.processId,
      revision,
      situacao: preRecebimento.situacao,
      conferencias,
      avarias: detalhe?.avarias ?? [],
      temperaturas,
      checklist: detalhe?.checklist
        ? {
            id: detalhe.checklist.id,
            recebimentoId: detalhe.checklist.recebimentoId,
            lacre: detalhe.checklist.lacre,
            tempBau: detalhe.checklist.tempBau,
            tempProduto: detalhe.checklist.tempProduto,
            conditions: detalhe.checklist.conditions,
            observacoes: detalhe.checklist.observacoes,
            photoCount: detalhe.checklist.photoCount,
            createdAt: detalhe.checklist.createdAt,
            docaId:
              detalhe.recebimento?.docaId ?? detalhe.preRecebimento.docaId ?? null,
          }
        : null,
      encerradoEm: detalhe?.recebimento?.dataFim ?? null,
    };
  }
}
