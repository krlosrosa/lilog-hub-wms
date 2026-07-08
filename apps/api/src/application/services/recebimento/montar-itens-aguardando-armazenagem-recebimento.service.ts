import { Inject, Injectable } from '@nestjs/common';

import type { DepositoCodigo } from '../../../domain/model/estoque/deposito.model.js';
import type { TipoDivergencia } from '../../../domain/model/recebimento/recebimento.model.js';
import { buildRecebimentoFacts } from '../../../domain/services/build-recebimento-facts.js';
import {
  buildItensAguardandoArmazenagem,
  type ItemAguardandoArmazenagem,
} from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { resolverDepositoPorAcoesRegra } from '../../../domain/services/resolver-deposito-por-acao-regra.js';
import { buildUnidadesPorCaixaMap } from '../../../domain/services/unidade-medida.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ItemPreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { RecebimentoAvariaRecord } from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import type {
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
  RecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import { ExecutarRegrasProcessoUseCase } from '../../usecases/regra-processo/executar-regras-processo.usecase.js';

export type MontarItensAguardandoArmazenagemInput = {
  unidadeId: string;
  itensConferidos: ItemRecebimentoRecord[];
  itensPreRecebimento: ItemPreRecebimentoRecord[];
  avarias: RecebimentoAvariaRecord[];
  divergencias: DivergenciaRecebimentoRecord[];
  recebimento: RecebimentoRecord;
  destinosElegiveis?: DepositoCodigo[];
};

@Injectable()
export class MontarItensAguardandoArmazenagemRecebimentoService {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    private readonly executarRegrasProcessoUseCase: ExecutarRegrasProcessoUseCase,
  ) {}

  async execute(
    input: MontarItensAguardandoArmazenagemInput,
  ): Promise<ItemAguardandoArmazenagem[]> {
    const itensEsperadosPorProduto = new Map(
      input.itensPreRecebimento.map((item) => [item.produtoId, item]),
    );

    const { overridesPorItemId, overridesPorProduto } =
      await this.resolverDepositosPorRegras({
        unidadeId: input.unidadeId,
        itensConferidos: input.itensConferidos,
        itensEsperadosPorProduto,
        avarias: input.avarias,
        divergencias: input.divergencias,
        recebimento: input.recebimento,
      });

    const unidadesPorCaixaMap = buildUnidadesPorCaixaMap(input.itensPreRecebimento);
    const divergenciasPorProduto = this.groupDivergencias(input.divergencias);

    return buildItensAguardandoArmazenagem({
      itensConferidos: input.itensConferidos,
      divergenciasPorProduto,
      unidadesPorCaixaMap,
      depositoDestinoOverridesPorProduto: overridesPorProduto,
      depositoDestinoOverridesPorItemId: overridesPorItemId,
      destinosElegiveis: input.destinosElegiveis,
      avarias: input.avarias,
    });
  }

  private groupDivergencias(divergencias: DivergenciaRecebimentoRecord[]) {
    const map = new Map<
      string,
      Array<{ tipoDivergencia: TipoDivergencia }>
    >();

    for (const divergencia of divergencias) {
      if (!divergencia.produtoId) {
        continue;
      }

      const current = map.get(divergencia.produtoId) ?? [];
      current.push({ tipoDivergencia: divergencia.tipoDivergencia });
      map.set(divergencia.produtoId, current);
    }

    return map;
  }

  private async resolverDepositosPorRegras(input: {
    unidadeId: string;
    itensConferidos: ItemRecebimentoRecord[];
    itensEsperadosPorProduto: Map<string, ItemPreRecebimentoRecord>;
    avarias: RecebimentoAvariaRecord[];
    divergencias: DivergenciaRecebimentoRecord[];
    recebimento: RecebimentoRecord;
  }) {
    const overridesPorItemId = new Map<string, DepositoCodigo>();
    const overridesPorProduto = new Map<string, DepositoCodigo>();
    const produtosComItemConferido = new Set<string>();

    for (const item of input.itensConferidos) {
      produtosComItemConferido.add(item.produtoId);

      const depositoCodigo = await this.aplicarRegrasParaItem({
        ...input,
        produtoId: item.produtoId,
        item,
      });

      if (depositoCodigo) {
        overridesPorItemId.set(item.id, depositoCodigo);
      }
    }

    for (const divergencia of input.divergencias) {
      if (!divergencia.produtoId) {
        continue;
      }

      if (divergencia.tipoDivergencia === 'produto_ausente') {
        continue;
      }

      if (produtosComItemConferido.has(divergencia.produtoId)) {
        continue;
      }

      const depositoCodigo = await this.aplicarRegrasParaItem({
        ...input,
        produtoId: divergencia.produtoId,
      });

      if (depositoCodigo) {
        overridesPorProduto.set(divergencia.produtoId, depositoCodigo);
      }
    }

    return { overridesPorItemId, overridesPorProduto };
  }

  private async aplicarRegrasParaItem(input: {
    unidadeId: string;
    produtoId: string;
    item?: ItemRecebimentoRecord;
    itensEsperadosPorProduto: Map<string, ItemPreRecebimentoRecord>;
    avarias: RecebimentoAvariaRecord[];
    divergencias: DivergenciaRecebimentoRecord[];
    recebimento: RecebimentoRecord;
  }): Promise<DepositoCodigo | null> {
    const produto = await this.produtoRepository.findByProdutoId(input.produtoId);
    const facts = buildRecebimentoFacts({
      produtoId: input.produtoId,
      item: input.item,
      itemEsperado: input.itensEsperadosPorProduto.get(input.produtoId),
      produto,
      avarias: input.avarias,
      divergencias: input.divergencias,
      recebimento: input.recebimento,
    });

    const resultado = await this.executarRegrasProcessoUseCase.execute({
      unidadeId: input.unidadeId,
      gatilho: 'recebimento',
      facts,
    });

    if (resultado.acoes.length === 0) {
      return null;
    }

    return this.resolverDepositoDasAcoes(input.unidadeId, resultado.acoes);
  }

  private async resolverDepositoDasAcoes(
    unidadeId: string,
    acoes: Parameters<typeof resolverDepositoPorAcoesRegra>[0],
  ): Promise<DepositoCodigo | null> {
    for (const acao of acoes) {
      if (acao.parametros.depositoId) {
        const deposito = await this.estoqueRepository.findDepositoById(
          acao.parametros.depositoId,
        );

        if (deposito && deposito.unidadeId === unidadeId) {
          return deposito.codigo as DepositoCodigo;
        }
      }
    }

    return resolverDepositoPorAcoesRegra(acoes);
  }
}
