import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  buildCodigoDemandaViagemRavex,
  buildDestinatarioPorNfIdFromEntregas,
  collectNotaFiscalIds,
  enrichNotasFiscaisComProdutos,
  mapAnomaliasToNotasFiscais,
  normalizarQuantidadesNotasFiscais,
} from '../../services/devolucao/map-anomalias-ravex-devolucao.js';
import { resolverPlacaViagemRavex } from '../../services/devolucao/resolver-placa-viagem-ravex.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import { RavexViagemClient } from '../../../infra/clients/ravex/ravex-viagem.client.js';
import type { RavexNotaFiscalItem } from '../../../infra/clients/ravex/ravex-viagem.types.js';

export type GerarDemandaDevolucaoViagemInput = {
  transporteId: string | null;
  unidadeId: string;
  viagemId: number;
};

@Injectable()
export class GerarDemandaDevolucaoViagemUseCase {
  private readonly logger = new Logger(GerarDemandaDevolucaoViagemUseCase.name);

  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(RavexViagemClient)
    private readonly ravexViagemClient: RavexViagemClient,
  ) {}

  async execute(input: GerarDemandaDevolucaoViagemInput): Promise<void> {
    const codigoDemanda = buildCodigoDemandaViagemRavex(input.viagemId);

    const existing = await this.devolucaoRepository.findDemandaByCodigo(
      input.unidadeId,
      codigoDemanda,
    );

    if (existing) {
      this.logger.log(
        `Demanda de devolução "${codigoDemanda}" já existe para viagem ${input.viagemId}`,
      );
      return;
    }

    const viagem = await this.ravexViagemClient.getViagemPorId(input.viagemId);
    const placa = resolverPlacaViagemRavex(viagem);

    const [anomalias, entregas] = await Promise.all([
      this.ravexViagemClient.listAnomalias(input.viagemId),
      this.ravexViagemClient.listEntregas(input.viagemId).catch((error: unknown) => {
        this.logger.warn(
          `Falha ao buscar entregas da viagem ${input.viagemId}: ${String(error)}`,
        );
        return [];
      }),
    ]);

    if (anomalias.length === 0) {
      this.logger.log(
        `Nenhuma anomalia encontrada para viagem ${input.viagemId}; demanda não criada`,
      );
      return;
    }

    const notaFiscalIds = collectNotaFiscalIds(anomalias);
    const itensPorNotaFiscal = new Map<number, RavexNotaFiscalItem[]>();

    await Promise.allSettled(
      notaFiscalIds.map((notaFiscalId) =>
        this.ravexViagemClient
          .listItensNotaFiscal(input.viagemId, notaFiscalId)
          .then((itens) => {
            itensPorNotaFiscal.set(notaFiscalId, itens);
          })
          .catch((error: unknown) => {
            this.logger.warn(
              `Falha ao buscar itens da NF ${notaFiscalId} da viagem ${input.viagemId}: ${String(error)}`,
            );
            itensPorNotaFiscal.set(notaFiscalId, []);
          }),
      ),
    );

    const destinatarioPorNfId = buildDestinatarioPorNfIdFromEntregas(entregas);

    const notasFiscaisMapeadas = mapAnomaliasToNotasFiscais(
      anomalias,
      itensPorNotaFiscal,
      input.transporteId,
      destinatarioPorNfId,
    );

    if (notasFiscaisMapeadas.length === 0) {
      const resumoAnomalias = anomalias.map((anomalia) => {
        const itensNf =
          anomalia.notaFiscalId != null
            ? (itensPorNotaFiscal.get(anomalia.notaFiscalId)?.length ?? 0)
            : 0;

        return (
          `anomaliaId=${anomalia.anomaliaId}, notaFiscalId=${anomalia.notaFiscalId ?? 'null'}, ` +
          `tipoRetorno=${anomalia.tipoRetorno ?? 'null'}, item.codigo=${anomalia.item?.codigo ?? 'null'}, ` +
          `item.itemId=${anomalia.item?.itemId ?? 'null'}, qtyDevolvida=${anomalia.item?.quantidadeDevolvida ?? 'null'}, ` +
          `itensNf=${itensNf}`
        );
      });

      this.logger.warn(
        `Anomalias da viagem ${input.viagemId} não geraram notas fiscais válidas ` +
          `(${anomalias.length} anomalia(s), NFs consultadas: [${notaFiscalIds.join(', ')}]). ` +
          `Detalhes: ${resumoAnomalias.join(' | ')}`,
      );
      return;
    }

    const codigosProduto = [
      ...new Set(
        notasFiscaisMapeadas.flatMap((nota) =>
          nota.itens.map((item) => item.codigoProduto ?? item.sku),
        ),
      ),
    ];

    const produtosResolvidos =
      await this.produtoRepository.findByCodigosRemessa(codigosProduto);

    const produtoPorCodigo = new Map<
      string,
      { produtoId: string; sku: string } | null
    >();

    for (const codigo of codigosProduto) {
      const produto = produtosResolvidos.get(codigo) ?? null;
      produtoPorCodigo.set(
        codigo,
        produto
          ? { produtoId: produto.produtoId, sku: produto.sku }
          : null,
      );
    }

    const notasFiscaisNormalizadas = normalizarQuantidadesNotasFiscais(
      notasFiscaisMapeadas,
      produtosResolvidos,
    );

    const notasFiscais = enrichNotasFiscaisComProdutos(
      notasFiscaisNormalizadas,
      produtoPorCodigo,
    );

    const result = await this.devolucaoRepository.criarDemandaDevolucaoViagem({
      unidadeId: input.unidadeId,
      codigoDemanda,
      transporteId: input.transporteId,
      placa,
      observacao: `Gerada automaticamente da viagem Ravex ${input.viagemId}`,
      notasFiscais,
    });

    if (result.created) {
      this.logger.log(
        `Demanda de devolução "${codigoDemanda}" criada (${notasFiscais.length} NF(s))`,
      );
      return;
    }

    this.logger.log(
      `Demanda de devolução "${codigoDemanda}" já existia após tentativa de criação`,
    );
  }
}
