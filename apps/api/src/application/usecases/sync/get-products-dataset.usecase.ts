import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
  type ProdutoRecord,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

type GetProductsDatasetInput = {
  unidadeId: string;
  cursor?: string;
  limit: number;
  userId: number | null;
};

type ProductDatasetItem = {
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: string;
  categoria: string;
  tipo: string;
  ean: string | null;
  dum: string | null;
  shelfLife: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  updatedAt: string;
  tombstone: boolean;
};

type GetProductsDatasetResult = {
  items: ProductDatasetItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

function encodeCursor(updatedAt: Date, produtoId: string): string {
  return Buffer.from(
    JSON.stringify({ updatedAt: updatedAt.toISOString(), produtoId }),
  ).toString('base64url');
}

function decodeCursor(
  cursor: string,
): { updatedAt: Date; produtoId: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { updatedAt: string; produtoId: string };
    return { updatedAt: new Date(parsed.updatedAt), produtoId: parsed.produtoId };
  } catch {
    return null;
  }
}

function mapProdutoToDataset(p: ProdutoRecord): ProductDatasetItem {
  return {
    produtoId: p.produtoId,
    sku: p.sku,
    descricao: p.descricao,
    empresa: p.empresa,
    categoria: p.categoria,
    tipo: p.tipo,
    ean: p.ean,
    dum: p.dum,
    shelfLife: p.shelfLife,
    pesoBrutoUnidade: p.pesoBrutoUnidade,
    pesoBrutoCaixa: p.pesoBrutoCaixa,
    pesoBrutoPalete: p.pesoBrutoPalete,
    pesoLiquidoUnidade: p.pesoLiquidoUnidade,
    pesoLiquidoCaixa: p.pesoLiquidoCaixa,
    pesoLiquidoPalete: p.pesoLiquidoPalete,
    unidadesPorCaixa: p.unidadesPorCaixa,
    caixasPorPalete: p.caixasPorPalete,
    updatedAt: p.updatedAt.toISOString(),
    tombstone: false,
  };
}

@Injectable()
export class GetProductsDatasetUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetProductsDatasetInput): Promise<GetProductsDatasetResult> {
    if (input.userId != null) {
      const accessibleUnidades =
        await this.userRepository.listAccessibleUnidades(input.userId);
      const hasAccess = accessibleUnidades.some((u) => u.id === input.unidadeId);
      if (!hasAccess) {
        return { items: [], nextCursor: null, hasMore: false };
      }
    }

    const cursorData = input.cursor ? decodeCursor(input.cursor) : null;

    const fetchLimit = input.limit + 1;
    const result = await this.produtoRepository.list({
      page: 1,
      limit: fetchLimit,
    });

    const products = result.items;
    let filteredProducts = products;

    if (cursorData) {
      filteredProducts = products.filter(
        (p) =>
          p.updatedAt > cursorData.updatedAt ||
          (p.updatedAt.getTime() === cursorData.updatedAt.getTime() &&
            p.produtoId > cursorData.produtoId),
      );
    }

    const hasMore = filteredProducts.length > input.limit;
    const pageItems = filteredProducts.slice(0, input.limit);

    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? encodeCursor(lastItem.updatedAt, lastItem.produtoId)
        : null;

    return {
      items: pageItems.map(mapProdutoToDataset),
      nextCursor,
      hasMore,
    };
  }
}
