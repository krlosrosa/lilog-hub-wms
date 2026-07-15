import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type CreateRecebimentoAvariaInput,
  type IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

import type { ItemRecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';

export type RegistrarAvariaInput = {
  recebimentoId: string;
  produtoId?: string;
  lote?: string;
  validade?: Date;
  numeroSerie?: string;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount?: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
  clientDamageId?: string;
  operatorId: number;
};

function normalizeLote(lote: string | null | undefined): string {
  return (lote ?? '').trim();
}

function resolveLotesConferidosPorProduto(
  conferidos: ItemRecebimentoRecord[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const item of conferidos) {
    const lote = normalizeLote(item.loteRecebido);
    if (!lote) {
      continue;
    }

    const current = map.get(item.produtoId) ?? new Set<string>();
    current.add(lote);
    map.set(item.produtoId, current);
  }

  return map;
}

function assertLoteConferido(
  produtoId: string,
  lote: string | undefined,
  lotesPorProduto: Map<string, Set<string>>,
): string | null {
  const lotesConferidos = lotesPorProduto.get(produtoId);

  if (!lotesConferidos || lotesConferidos.size === 0) {
    return lote?.trim() ?? null;
  }

  const loteInformado = normalizeLote(lote);

  if (!loteInformado) {
    if (lotesConferidos.size === 1) {
      return [...lotesConferidos][0] ?? null;
    }

    throw new BadRequestException(
      'Selecione o lote conferido para associar a avaria',
    );
  }

  if (!lotesConferidos.has(loteInformado)) {
    throw new BadRequestException(
      `Lote "${loteInformado}" não foi conferido para este produto`,
    );
  }

  return loteInformado;
}

@Injectable()
export class RegistrarAvariaUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly avariaRepository: IRecebimentoAvariaRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(input: RegistrarAvariaInput) {
    if (input.quantidadeCaixas <= 0 && input.quantidadeUnidades <= 0) {
      throw new BadRequestException(
        'Informe caixas e/ou unidades avariadas',
      );
    }

    const recebimento = await this.recebimentoRepository.findById(
      input.recebimentoId,
    );

    if (!recebimento) {
      throw new NotFoundException(
        `Recebimento "${input.recebimentoId}" não encontrado`,
      );
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Avarias só podem ser registradas durante a conferência',
      );
    }

    const conferidos = await this.recebimentoRepository.findItemsByRecebimento(
      input.recebimentoId,
    );
    const lotesPorProduto = resolveLotesConferidosPorProduto(conferidos);

    const base: Omit<CreateRecebimentoAvariaInput, 'produtoId' | 'replicado'> = {
      recebimentoId: input.recebimentoId,
      tipo: input.tipo,
      natureza: input.natureza,
      causa: input.causa,
      quantidadeCaixas: input.quantidadeCaixas,
      quantidadeUnidades: input.quantidadeUnidades,
      validade: input.validade ?? null,
      numeroSerie: input.numeroSerie?.trim() ?? null,
      photoCount: input.photoCount ?? 0,
      clientDamageId: input.clientDamageId?.trim() || null,
      operatorId: input.operatorId,
    };

    let items: CreateRecebimentoAvariaInput[];

    if (input.replicarParaTodos) {
      if (conferidos.length === 0) {
        throw new BadRequestException(
          'Não há itens conferidos para replicar avaria',
        );
      }

      const skuFilter = new Set(
        (input.skusAlvo ?? []).map((sku) => sku.toLowerCase()),
      );

      const produtoIds = new Set<string>();
      for (const item of conferidos) {
        produtoIds.add(item.produtoId);
      }

      const produtos = await Promise.all(
        [...produtoIds].map((id) => this.produtoRepository.findByProdutoId(id)),
      );

      const produtoById = new Map(
        produtos
          .filter((produto) => produto !== null)
          .map((produto) => [produto!.produtoId, produto!]),
      );

      const targets = conferidos.filter((item) => {
        const produto = produtoById.get(item.produtoId);
        if (!produto) return false;
        if (skuFilter.size === 0) return true;
        return skuFilter.has(produto.sku.toLowerCase());
      });

      if (targets.length === 0) {
        throw new BadRequestException(
          'Nenhum SKU conferido corresponde aos alvos informados',
        );
      }

      items = targets.map((item) => ({
        ...base,
        produtoId: item.produtoId,
        lote: assertLoteConferido(item.produtoId, input.lote, lotesPorProduto),
        replicado: true,
      }));
    } else {
      let produtoId = input.produtoId ?? null;

      if (!produtoId && input.skusAlvo?.length === 1) {
        const produto = await this.produtoRepository.findBySku(
          input.skusAlvo[0]!,
        );
        produtoId = produto?.produtoId ?? null;
      }

      const lote =
        produtoId !== null
          ? assertLoteConferido(produtoId, input.lote, lotesPorProduto)
          : input.lote?.trim() ?? null;

      items = [
        {
          ...base,
          produtoId,
          lote,
          replicado: false,
        },
      ];
    }

    const created = await this.avariaRepository.createMany(items);

    return {
      items: created.map((item) => ({
        ...item,
        validade: item.validade?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
