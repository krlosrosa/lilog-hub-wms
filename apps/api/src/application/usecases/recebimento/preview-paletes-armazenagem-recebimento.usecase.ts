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
import { MontarItensAguardandoArmazenagemRecebimentoService } from '../../services/recebimento/montar-itens-aguardando-armazenagem-recebimento.service.js';
import { DESTINOS_ESTOQUE_FISICO_ETIQUETAS } from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { MontarPaletesArmazenagemService } from '../../services/armazenagem/montar-paletes-armazenagem.service.js';
import { SugerirEnderecosPaletesService } from '../../services/armazenagem/sugerir-enderecos-paletes.service.js';

export type PreviewPaleteInput = {
  produtoId: string;
  qtdPaletes: number;
};

export type PreviewPaletesArmazenagemRecebimentoInput = {
  recebimentoId: string;
  paletes: PreviewPaleteInput[];
};

@Injectable()
export class PreviewPaletesArmazenagemRecebimentoUseCase {
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
    private readonly montarPaletesArmazenagemService: MontarPaletesArmazenagemService,
    private readonly sugerirEnderecosPaletesService: SugerirEnderecosPaletesService,
  ) {}

  async execute({
    recebimentoId,
    paletes,
  }: PreviewPaletesArmazenagemRecebimentoInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'conferido') {
      throw new BadRequestException(
        'Preview de paletes só é permitido para recebimentos conferidos',
      );
    }

    if (!recebimento.dataFim) {
      throw new BadRequestException(
        'Conferência deve ser encerrada antes do preview de paletes',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const avarias = await this.avariaRepository.listByRecebimento(recebimentoId);
    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);
    const temPaletesBipados = itensConferidos.some(
      (item) => item.unitizadorId !== null,
    );

    const itensAguardandoArmazenagem =
      await this.montarItensAguardandoArmazenagemRecebimentoService.execute({
        unidadeId: preRecebimento.unidadeId,
        itensConferidos,
        itensPreRecebimento: preRecebimento.itens,
        avarias,
        divergencias: recebimento.divergencias,
        recebimento,
        destinosElegiveis: !temPaletesBipados
          ? DESTINOS_ESTOQUE_FISICO_ETIQUETAS
          : undefined,
      });

    const numeroRecebimento =
      (await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        recebimentoId,
      )) ?? recebimentoId.slice(0, 8).toUpperCase();

    const paletesPorProduto = new Map(
      paletes.map((item) => [item.produtoId, item.qtdPaletes]),
    );

    const paletesSimulados = this.montarPaletesArmazenagemService.execute({
      itensAguardandoArmazenagem,
      paletesPorProduto,
      numeroRecebimento,
    });

    const enderecosPorSequencia = await this.sugerirEnderecosPaletesService.execute(
      preRecebimento.unidadeId,
      paletesSimulados,
    );

    const produtoCache = new Map<
      string,
      { sku: string; descricao: string } | null
    >();

    const previewPaletes = await Promise.all(
      paletesSimulados.map(async (palete) => {
        let produtoInfo = produtoCache.get(palete.produtoId);

        if (produtoInfo === undefined) {
          const produto = await this.produtoRepository.findByProdutoId(
            palete.produtoId,
          );
          produtoInfo = produto
            ? { sku: produto.sku, descricao: produto.descricao }
            : null;
          produtoCache.set(palete.produtoId, produtoInfo);
        }

        const endereco = enderecosPorSequencia.get(palete.sequenciaGlobal);

        return {
          produtoId: palete.produtoId,
          sku: produtoInfo?.sku ?? palete.produtoId,
          descricao: produtoInfo?.descricao ?? palete.produtoId,
          sequencia: palete.sequenciaGlobal,
          sequenciaProduto: palete.sequenciaProduto,
          quantidade: palete.quantidade,
          unidadeMedida: palete.unidadeMedida,
          lote: palete.lote,
          validade: palete.validade?.toISOString() ?? null,
          codigoUnitizador: palete.codigoUnitizador,
          enderecoSugeridoId: endereco?.enderecoSugeridoId ?? null,
          enderecoSugeridoLabel: endereco?.enderecoSugeridoLabel ?? null,
          disponivel: endereco?.disponivel ?? false,
          alerta: endereco?.alerta ?? null,
        };
      }),
    );

    return {
      recebimentoId,
      numeroRecebimento,
      unidadeId: preRecebimento.unidadeId,
      itensAguardandoArmazenagem: itensAguardandoArmazenagem.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        validade: item.validade?.toISOString() ?? null,
      })),
      paletes: previewPaletes,
    };
  }
}
