import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ExpectedItemView } from '@lilog/contracts';

import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  ParametrosRecebimentoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import type { ProdutoConferenciaConfig } from '../../../domain/services/recebimento-produto-rules.js';
import {
  resolveProdutoConferenciaConfig,
} from '../../../domain/services/recebimento-produto-rules.js';

export type AdicionarItemManualRecebimentoInput = {
  preRecebimentoId: string;
  produtoId: string;
  sku: string;
};

function applyParametrosToItemConfig(
  config: ProdutoConferenciaConfig,
  solicitarPesoPvar: boolean,
  exigirEtiquetaPesoVariavel: boolean,
): ProdutoConferenciaConfig {
  if (!solicitarPesoPvar) {
    return {
      ...config,
      controlaPeso: false,
      pesoVariavel: false,
      exigirEtiquetaPesoVariavel: false,
    };
  }

  return {
    ...config,
    exigirEtiquetaPesoVariavel:
      config.pesoVariavel && exigirEtiquetaPesoVariavel,
  };
}

@Injectable()
export class AdicionarItemManualRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(input: AdicionarItemManualRecebimentoInput): Promise<ExpectedItemView> {
    const preRecebimento = await this.preRecebimentoRepository.findById(
      input.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${input.preRecebimentoId}" não encontrado`,
      );
    }

    const recebimento = await this.recebimentoRepository.findByPreRecebimentoId(
      input.preRecebimentoId,
    );

    if (!recebimento) {
      throw new BadRequestException(
        'Recebimento não iniciado para esta demanda',
      );
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Só é possível adicionar item manual com recebimento em conferência',
      );
    }

    const produto = await this.produtoRepository.findByProdutoId(input.produtoId);

    if (!produto) {
      throw new NotFoundException(`Produto "${input.produtoId}" não encontrado`);
    }

    const normalizedSku = input.sku.trim().toUpperCase();
    const produtoSku = produto.sku.trim().toUpperCase();
    const produtoEan = produto.ean?.trim().toUpperCase();

    if (
      normalizedSku !== produtoSku &&
      (!produtoEan || normalizedSku !== produtoEan)
    ) {
      throw new BadRequestException('SKU informado não corresponde ao produto');
    }

    const configuracoes = await this.configuracaoOperacionalRepository.list({
      unidadeId: preRecebimento.unidadeId,
      dominio: DOMINIO_RECEBIMENTO,
      categoria: CATEGORIA_CONFERENCIA,
      subtipo: SUBTIPO_PARAMETROS,
      ativo: true,
    });

    const configPadrao =
      configuracoes.find((item) => item.isPadrao) ?? configuracoes[0];
    const parametrosConferencia = ParametrosRecebimentoConferenciaSchema.parse(
      configPadrao?.parametros ?? {},
    );

    const config = applyParametrosToItemConfig(
      resolveProdutoConferenciaConfig(
        produto,
        parametrosConferencia.solicitarPesoPvar,
        parametrosConferencia.exigirEtiquetaPesoVariavel,
      ),
      parametrosConferencia.solicitarPesoPvar,
      parametrosConferencia.exigirEtiquetaPesoVariavel,
    );

    const existingItem = preRecebimento.itens.find(
      (item) => item.produtoId === produto.produtoId,
    );
    if (existingItem) {
      throw new BadRequestException('Item já existe na carga');
    }

    await this.preRecebimentoRepository.addManualExpectedItem(
      input.preRecebimentoId,
      produto.produtoId,
    );

    return {
      preRecebimentoId: input.preRecebimentoId,
      produtoId: produto.produtoId,
      sku: produto.sku,
      descricao: produto.descricao?.trim() || produto.sku,
      unidadeMedida: 'UN',
      unidadesPorCaixa: produto.unidadesPorCaixa && produto.unidadesPorCaixa > 0
        ? produto.unidadesPorCaixa
        : 1,
      quantidadeEsperada: 0,
      config: {
        controlaLote: config.controlaLote,
        controlaValidade: config.controlaValidade,
        controlaPeso: config.controlaPeso,
        pesoVariavel: config.pesoVariavel,
        exigirEtiquetaPesoVariavel: config.exigirEtiquetaPesoVariavel,
        controlaNumeroSerie: config.controlaNumeroSerie,
      },
      isNovo: true,
    };
  }

  async removeManualItem(input: {
    preRecebimentoId: string;
    produtoId: string;
  }): Promise<boolean> {
    const preRecebimento = await this.preRecebimentoRepository.findById(
      input.preRecebimentoId,
    );
    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${input.preRecebimentoId}" não encontrado`,
      );
    }

    const recebimento = await this.recebimentoRepository.findByPreRecebimentoId(
      input.preRecebimentoId,
    );
    if (!recebimento) {
      throw new BadRequestException(
        'Recebimento não iniciado para esta demanda',
      );
    }
    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Só é possível remover item manual com recebimento em conferência',
      );
    }

    const item = preRecebimento.itens.find(
      (entry) => entry.produtoId === input.produtoId,
    );
    if (!item) {
      return false;
    }

    const isManualItem =
      Number(item.quantidadeEsperada) === 0 && item.unidadeMedida === 'UN';
    if (!isManualItem) {
      throw new BadRequestException('Este item não pode ser excluído');
    }

    return this.preRecebimentoRepository.removeManualExpectedItem(
      input.preRecebimentoId,
      input.produtoId,
    );
  }
}
