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

export type RegistrarAvariaInput = {
  recebimentoId: string;
  produtoId?: string;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount?: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
  operatorId: number;
};

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

    if (recebimento.situacao !== 'em_recebimento') {
      throw new BadRequestException(
        'Avarias só podem ser registradas durante a conferência',
      );
    }

    const conferidos = await this.recebimentoRepository.findItemsByRecebimento(
      input.recebimentoId,
    );

    const base: Omit<CreateRecebimentoAvariaInput, 'produtoId' | 'replicado'> = {
      recebimentoId: input.recebimentoId,
      tipo: input.tipo,
      natureza: input.natureza,
      causa: input.causa,
      quantidadeCaixas: input.quantidadeCaixas,
      quantidadeUnidades: input.quantidadeUnidades,
      photoCount: input.photoCount ?? 0,
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
        [...produtoIds].map((id) => this.produtoRepository.findById(id)),
      );

      const produtoById = new Map(
        produtos
          .filter((produto) => produto !== null)
          .map((produto) => [produto!.id, produto!]),
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
        replicado: true,
      }));
    } else {
      let produtoId = input.produtoId ?? null;

      if (!produtoId && input.skusAlvo?.length === 1) {
        const produto = await this.produtoRepository.findBySku(
          input.skusAlvo[0]!,
        );
        produtoId = produto?.id ?? null;
      }

      items = [
        {
          ...base,
          produtoId,
          replicado: false,
        },
      ];
    }

    const created = await this.avariaRepository.createMany(items);

    return {
      items: created.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
