import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  calcularCapacidadePaleteUN,
  calcularQtdPaletesSugerida,
} from '../../../domain/services/calcular-capacidade-palete.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  DESTINOS_ESTOQUE_FISICO_ETIQUETAS,
  type ItemAguardandoArmazenagem,
} from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { MontarItensAguardandoArmazenagemRecebimentoService } from '../../services/recebimento/montar-itens-aguardando-armazenagem-recebimento.service.js';

function aggregateItensPorProduto(
  itens: ItemAguardandoArmazenagem[],
): ItemAguardandoArmazenagem[] {
  const map = new Map<string, ItemAguardandoArmazenagem>();

  for (const item of itens) {
    const existing = map.get(item.produtoId);

    if (!existing) {
      map.set(item.produtoId, { ...item });
      continue;
    }

    existing.quantidade += item.quantidade;
  }

  return [...map.values()];
}

export type SugerirEtiquetasRecebimentoInput = {
  recebimentoId: string;
};

@Injectable()
export class SugerirEtiquetasRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly avariaRepository: IRecebimentoAvariaRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    private readonly montarItensAguardandoArmazenagemRecebimentoService: MontarItensAguardandoArmazenagemRecebimentoService,
  ) {}

  async execute({ recebimentoId }: SugerirEtiquetasRecebimentoInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'conferido') {
      throw new BadRequestException(
        'Sugestão de etiquetas só é permitida para recebimentos conferidos',
      );
    }

    if (!recebimento.dataFim) {
      throw new BadRequestException(
        'Conferência deve ser encerrada antes de gerar etiquetas',
      );
    }

    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);
    const temPaletesBipados = itensConferidos.some(
      (item) => item.unitizadorId !== null,
    );

    if (temPaletesBipados) {
      throw new BadRequestException(
        'Sugestão de etiquetas não se aplica quando há paletes bipados na conferência',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const avarias = await this.avariaRepository.listByRecebimento(recebimentoId);

    const itensAguardandoArmazenagem = aggregateItensPorProduto(
      await this.montarItensAguardandoArmazenagemRecebimentoService.execute({
        unidadeId: preRecebimento.unidadeId,
        itensConferidos,
        itensPreRecebimento: preRecebimento.itens,
        avarias,
        divergencias: recebimento.divergencias,
        recebimento,
        destinosElegiveis: DESTINOS_ESTOQUE_FISICO_ETIQUETAS,
      }),
    );

    const numeroRecebimento =
      (await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        recebimentoId,
      )) ?? recebimentoId.slice(0, 8).toUpperCase();

    const itens = await Promise.all(
      itensAguardandoArmazenagem.map(async (item) => {
        const produto = await this.produtoRepository.findByProdutoId(
          item.produtoId,
        );
        const capacidadePorPaleteUN = calcularCapacidadePaleteUN(produto);

        return {
          produtoId: item.produtoId,
          sku: produto?.sku ?? item.produtoId,
          descricao: produto?.descricao ?? item.produtoId,
          quantidadeTotalUN: item.quantidade,
          capacidadePorPaleteUN,
          qtdPaletesSugerida: calcularQtdPaletesSugerida(
            item.quantidade,
            capacidadePorPaleteUN,
          ),
          lote: item.lote,
          validade: item.validade?.toISOString() ?? null,
        };
      }),
    );

    return {
      recebimentoId,
      numeroRecebimento,
      itens,
    };
  }
}
