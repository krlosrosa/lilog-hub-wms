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
import { buildItensAguardandoArmazenagemDePaletesBipados } from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { buildUnidadesPorCaixaMap } from '../../../domain/services/unidade-medida.js';
import { buildTarefasFromItensBipados } from '../../../domain/services/build-tarefas-armazenagem-bipadas.js';
import { SugerirEnderecosPaletesService } from '../../services/armazenagem/sugerir-enderecos-paletes.service.js';

export type PreviewEnderecosPaletesBipadosRecebimentoInput = {
  recebimentoId: string;
};

@Injectable()
export class PreviewEnderecosPaletesBipadosRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    private readonly sugerirEnderecosPaletesService: SugerirEnderecosPaletesService,
  ) {}

  async execute({ recebimentoId }: PreviewEnderecosPaletesBipadosRecebimentoInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'conferido') {
      throw new BadRequestException(
        'Preview de paletes bipados só é permitido para recebimentos conferidos',
      );
    }

    if (!recebimento.dataFim) {
      throw new BadRequestException(
        'Conferência deve ser encerrada antes do preview de paletes bipados',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    const unidadesPorCaixaMap = buildUnidadesPorCaixaMap(preRecebimento.itens);
    const itensAguardandoArmazenagem = buildItensAguardandoArmazenagemDePaletesBipados(
      {
        itensConferidos,
        unidadesPorCaixaMap,
      },
    );

    const { tarefas, itensSemUnitizador } = buildTarefasFromItensBipados(
      itensAguardandoArmazenagem,
    );

    if (itensSemUnitizador.length > 0) {
      throw new BadRequestException(
        'Existem itens conferidos sem palete vinculado. Conclua a conferência com ID de palete em todos os lotes.',
      );
    }

    if (tarefas.length === 0) {
      throw new BadRequestException(
        'Nenhum palete bipado encontrado para este recebimento. Use o fluxo "Gerar Etiqueta" para gerar IDs automaticamente.',
      );
    }

    const numeroRecebimento =
      (await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        recebimentoId,
      )) ?? recebimentoId.slice(0, 8).toUpperCase();

    const paletesParaSugestao = tarefas.map((tarefa) => ({
      produtoId: tarefa.itens[0]?.produtoId ?? '',
      sequenciaGlobal: tarefa.sequencia,
    }));

    const enderecosPorSequencia = await this.sugerirEnderecosPaletesService.execute(
      preRecebimento.unidadeId,
      paletesParaSugestao,
    );

    const produtoCache = new Map<
      string,
      { sku: string; descricao: string } | null
    >();

    const paletes = await Promise.all(
      tarefas.map(async (tarefa) => {
        const unitizadorId = tarefa.unitizadorId;

        if (!unitizadorId) {
          throw new BadRequestException(
            'Tarefa de armazenagem sem unitizador vinculado',
          );
        }

        const unitizador =
          await this.armazenagemRepository.findUnitizadorById(unitizadorId);

        const itens = await Promise.all(
          tarefa.itens.map(async (item) => {
            let produtoInfo = produtoCache.get(item.produtoId);

            if (produtoInfo === undefined) {
              const produto = await this.produtoRepository.findByProdutoId(
                item.produtoId,
              );
              produtoInfo = produto
                ? { sku: produto.sku, descricao: produto.descricao }
                : null;
              produtoCache.set(item.produtoId, produtoInfo);
            }

            return {
              produtoId: item.produtoId,
              sku: produtoInfo?.sku ?? item.produtoId,
              descricao: produtoInfo?.descricao ?? item.produtoId,
              quantidade: item.quantidade,
              unidadeMedida: item.unidadeMedida,
              lote: item.lote,
              validade: item.validade?.toISOString() ?? null,
            };
          }),
        );

        const endereco = enderecosPorSequencia.get(tarefa.sequencia);

        return {
          unitizadorId,
          codigoUnitizador: unitizador?.codigo ?? unitizadorId,
          sequencia: tarefa.sequencia,
          itens,
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
      paletes,
    };
  }
}
