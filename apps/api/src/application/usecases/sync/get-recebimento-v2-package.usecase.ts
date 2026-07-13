import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import {
  SYNC_REPOSITORY,
  type ISyncRepository,
} from '../../../domain/repositories/sync/sync.repository.js';

type GetRecebimentoV2PackageInput = {
  demandId: string;
  unidadeId?: string;
  userId: number | null;
};

@Injectable()
export class GetRecebimentoV2PackageUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly recebimentoAvariaRepository: IRecebimentoAvariaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SYNC_REPOSITORY)
    private readonly syncRepository: ISyncRepository,
  ) {}

  async execute(input: GetRecebimentoV2PackageInput) {
    const preRecebimento = await this.preRecebimentoRepository.findById(
      input.demandId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${input.demandId}" não encontrado`,
      );
    }

    if (input.unidadeId && preRecebimento.unidadeId !== input.unidadeId) {
      throw new BadRequestException(
        'Acesso negado a este pré-recebimento',
      );
    }

    if (input.userId != null) {
      const accessible = await this.userRepository.listAccessibleUnidades(
        input.userId,
      );
      const hasAccess = accessible.some(
        (u) => u.id === preRecebimento.unidadeId,
      );
      if (!hasAccess) {
        throw new BadRequestException(
          'Usuário não tem acesso a este pré-recebimento',
        );
      }
    }

    const [detalhe, recebimento, serverRevision] = await Promise.all([
      this.preRecebimentoRepository.findDetalheById(input.demandId),
      this.recebimentoRepository.findByPreRecebimentoId(input.demandId),
      this.syncRepository.getAggregateRevision('recebimento-v2', input.demandId),
    ]);

    const [checklist, temperaturas, avarias] = await Promise.all([
      recebimento
        ? this.conferenciaRepository
            .findChecklistByRecebimentoId(recebimento.id)
            .catch(() => null)
        : Promise.resolve(null),
      recebimento
        ? this.conferenciaRepository
            .listTemperaturasProduto(recebimento.id)
            .catch(() => [])
        : Promise.resolve([]),
      recebimento
        ? this.recebimentoAvariaRepository
            .listByRecebimento(recebimento.id)
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const produtosById = new Map(
      (detalhe?.produtos ?? []).map((produto) => [produto.produtoId, produto]),
    );

    return {
      manifestId: `pkg-${input.demandId}-${serverRevision}`,
      demandId: input.demandId,
      adapter: 'recebimento-v2' as const,
      serverRevision,
      generatedAt: new Date().toISOString(),
      preRecebimento: {
        id: preRecebimento.id,
        unidadeId: preRecebimento.unidadeId,
        situacao: preRecebimento.situacao,
        horarioPrevisto: preRecebimento.horarioPrevisto,
        transportadoraNome: preRecebimento.transportadoraNome,
        placa: preRecebimento.placa,
        observacao: preRecebimento.observacao,
        docaId: preRecebimento.docaId,
        itens: preRecebimento.itens.map((item) => {
          const produto = produtosById.get(item.produtoId);
          return {
            id: item.id,
            produtoId: item.produtoId,
            sku: produto?.sku ?? item.produtoId,
            descricao: produto?.descricao ?? '',
            quantidadeEsperada: item.quantidadeEsperada,
            unidadeMedida: item.unidadeMedida,
            loteEsperado: item.loteEsperado,
            pesoEsperado: item.pesoEsperado,
            validadeEsperada: item.validadeEsperada?.toISOString() ?? null,
            unidadesPorCaixa: item.unidadesPorCaixa,
          };
        }),
        notasFiscais: preRecebimento.notasFiscais,
      },
      recebimento: recebimento
        ? {
            id: recebimento.id,
            situacao: recebimento.situacao,
            dataInicio: recebimento.dataInicio,
            dataFim: recebimento.dataFim,
            responsavelId: recebimento.responsavelId,
            docaId: recebimento.docaId,
          }
        : null,
      detalhe: detalhe ?? null,
      checklist: checklist ?? null,
      temperaturas: temperaturas ?? [],
      avarias: avarias ?? [],
    };
  }
}
