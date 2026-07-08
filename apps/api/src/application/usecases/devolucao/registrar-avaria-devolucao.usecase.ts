import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RegistrarAvariaDevolucaoResponseDto } from '../../dtos/devolucao/registrar-conferencia-devolucao.dto.js';
import {
  resolveSkusValidacaoAvaria,
  validateAvariaQuantidadeDevolucao,
} from '../../services/devolucao/validate-avaria-quantidade-devolucao.js';
import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_DEVOLUCAO,
  ParametrosDevolucaoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type RegistrarAvariaDevolucaoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class RegistrarAvariaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(
    input: RegistrarAvariaDevolucaoInput,
  ): Promise<RegistrarAvariaDevolucaoResponseDto> {
    const [demanda, avarias, configuracoes] = await Promise.all([
      this.devolucaoRepository.buscarDemanda({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
      }),
      this.devolucaoRepository.listarAvariasDemanda(
        input.demandaId,
        input.unidadeId,
      ),
      this.configuracaoOperacionalRepository.list({
        unidadeId: input.unidadeId,
        dominio: DOMINIO_DEVOLUCAO,
        categoria: CATEGORIA_CONFERENCIA,
        subtipo: SUBTIPO_PARAMETROS,
        ativo: true,
      }),
    ]);

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    const configPadrao =
      configuracoes.find((config) => config.isPadrao) ?? configuracoes[0];
    const parametros = ParametrosDevolucaoConferenciaSchema.parse(
      configPadrao?.parametros ?? {},
    );

    const items = demanda.notasFiscais.flatMap((nf) => nf.itens);
    const itemAtivo = input.itemId
      ? items.find((item) => item.id === input.itemId)
      : undefined;

    const skus = resolveSkusValidacaoAvaria({
      itemSku: itemAtivo?.sku,
      replicarSkus: input.replicarSkus,
    });

    if (skus.length === 0) {
      throw new BadRequestException('Informe o item ou SKUs para registrar a avaria.');
    }

    const validationError = validateAvariaQuantidadeDevolucao({
      skus,
      quantidadeCaixa: input.quantidadeCaixa ?? 0,
      quantidadeUnidade: input.quantidadeUnidade ?? 0,
      items: items.map((item) => ({
        sku: item.sku,
        qtdConferida: item.qtdConferida,
      })),
      avarias,
      quantidadeModo: parametros.quantidadeModo,
    });

    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const result = await this.devolucaoRepository.registrarAvaria(input);

    if (!result) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    return result;
  }
}
