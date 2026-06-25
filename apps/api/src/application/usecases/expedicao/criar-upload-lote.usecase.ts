import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';

import type { UploadLoteResponse } from '../../dtos/expedicao/upload-lote.dto.js';
import { calcularFaixaRemessaItem } from '../../services/expedicao/calcular-faixa-remessa-item.js';
import {
  isUnidadeCaixa,
  normalizarQuantidadeRemessaItem,
} from '../../services/expedicao/normalizar-quantidade-remessa-item.js';
import { parseRemessasXlsx } from '../../services/expedicao/parse-remessas-xlsx.js';
import {
  UPLOAD_LOTE_REPOSITORY,
  type IUploadLoteRepository,
  type RemessaInput,
  type RemessaItemInput,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
  type ProdutoRecord,
} from '../../../domain/repositories/produto/produto.repository.js';

export type CriarUploadLoteUseCaseInput = {
  unidadeId: string;
  dataReferencia: string;
  horarioExpectativaSaida: string;
  nomeArquivo: string;
  arquivo: Buffer;
  criadoPor: number | null;
};

@Injectable()
export class CriarUploadLoteUseCase {
  constructor(
    @Inject(UPLOAD_LOTE_REPOSITORY)
    private readonly uploadLoteRepository: IUploadLoteRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
  ) {}

  async execute(input: CriarUploadLoteUseCaseInput): Promise<UploadLoteResponse> {
    if (!input.unidadeId?.trim()) {
      throw new BadRequestException('unidadeId é obrigatório');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dataReferencia)) {
      throw new BadRequestException('dataReferencia deve estar no formato YYYY-MM-DD');
    }

    const horarioExpectativaSaida = new Date(input.horarioExpectativaSaida);

    if (Number.isNaN(horarioExpectativaSaida.getTime())) {
      throw new BadRequestException(
        'horarioExpectativaSaida deve ser uma data/hora válida',
      );
    }

    if (!input.arquivo?.length) {
      throw new BadRequestException('Arquivo vazio ou ausente');
    }

    const remessas = parseRemessasXlsx(input.arquivo);
    const remessasNormalizadas = await this.resolverItensRemessas(
      remessas,
      input.dataReferencia,
    );

    const rotasUnicas = [
      ...new Set(remessasNormalizadas.map((remessa) => remessa.numeroTransporte)),
    ];

    const rotasConflitantes = await this.transporteRepository.findDuplicados({
      unidadeId: input.unidadeId,
      dataTransporte: input.dataReferencia,
      rotas: rotasUnicas,
    });

    if (rotasConflitantes.length > 0) {
      throw new ConflictException({
        message:
          'Já existem transportes cadastrados para uma ou mais rotas nesta data. Exclua os transportes existentes antes de importar novamente.',
        rotasConflitantes: rotasConflitantes.map((transporte) => ({
          rota: transporte.rota,
          transporteId: transporte.id,
          status: transporte.status,
          ultimoMapaLoteId: transporte.ultimoMapaLoteId,
        })),
      });
    }

    const created = await this.uploadLoteRepository.criar({
      unidadeId: input.unidadeId,
      dataReferencia: input.dataReferencia,
      horarioExpectativaSaida,
      nomeArquivo: input.nomeArquivo,
      remessas: remessasNormalizadas,
      criadoPor: input.criadoPor,
    });

    return {
      loteId: created.id,
      totalRemessas: created.totalRemessas,
      totalTransportes: created.totalTransportes,
      nomeArquivo: created.nomeArquivo ?? input.nomeArquivo,
      dataReferencia: created.dataReferencia,
      createdAt: created.createdAt.toISOString(),
    };
  }

  private async resolverItensRemessas(
    remessas: RemessaInput[],
    dataReferencia: string,
  ): Promise<RemessaInput[]> {
    const skus = [
      ...new Set(
        remessas.flatMap((remessa) => remessa.itens.map((item) => item.sku)),
      ),
    ];

    const produtoPorSku = await this.produtoRepository.findByCodigosRemessa(skus);

    const skusInvalidos = new Set<string>();

    const remessasResolvidas = remessas.map((remessa) => ({
      ...remessa,
      itens: remessa.itens.map((item) =>
        this.resolverItem(item, produtoPorSku, skusInvalidos, dataReferencia),
      ),
    }));

    if (skusInvalidos.size > 0) {
      throw new BadRequestException(
        `SKUs não cadastrados ou sem unidadesPorCaixa para conversão: ${[...skusInvalidos].join(', ')}`,
      );
    }

    return remessasResolvidas;
  }

  private resolverItem(
    item: RemessaItemInput,
    produtoPorSku: Map<string, ProdutoRecord | null>,
    skusInvalidos: Set<string>,
    dataReferencia: string,
  ): RemessaItemInput {
    const produto = produtoPorSku.get(item.sku) ?? null;
    const unidadeCaixa = isUnidadeCaixa(item.unidadeMedida);
    const faixa = calcularFaixaRemessaItem(
      item.dataFabricacao,
      dataReferencia,
      produto,
    );

    if (unidadeCaixa) {
      if (!produto || !produto.unidadesPorCaixa) {
        skusInvalidos.add(item.sku);
        return item;
      }

      return {
        ...item,
        produtoId: produto.id,
        faixa,
        quantidadeNormalizadaUnidades: normalizarQuantidadeRemessaItem(
          item.quantidade,
          item.unidadeMedida,
          produto,
        ),
      };
    }

    return {
      ...item,
      produtoId: produto?.id ?? null,
      faixa,
      quantidadeNormalizadaUnidades: normalizarQuantidadeRemessaItem(
        item.quantidade,
        item.unidadeMedida,
        produto,
      ),
    };
  }
}
