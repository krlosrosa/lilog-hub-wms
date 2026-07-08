import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { EtiquetaPaleteGerada } from '../../usecases/recebimento/finalizar-recebimento.usecase.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

@Injectable()
export class CarregarEtiquetasGeradasRecebimentoService {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute(recebimentoId: string): Promise<EtiquetaPaleteGerada[]> {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);
    const temPaletesBipados = itensConferidos.some(
      (item) => item.unitizadorId !== null,
    );

    if (
      recebimento.modoUnitizacao !== 'gerar_etiqueta_na_armazenagem' &&
      temPaletesBipados
    ) {
      throw new BadRequestException(
        'Reimpressão de etiquetas não se aplica ao modo de unitização atual',
      );
    }

    const demanda =
      await this.armazenagemRepository.findDemandaByRecebimentoId(recebimentoId);

    if (!demanda?.tarefas?.length) {
      throw new BadRequestException(
        'Nenhuma etiqueta de palete foi gerada para este recebimento',
      );
    }

    const numeroRecebimento =
      (await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        recebimentoId,
      )) ?? recebimentoId.slice(0, 8).toUpperCase();

    const etiquetas: EtiquetaPaleteGerada[] = [];

    for (const tarefa of demanda.tarefas) {
      if (!tarefa.unitizadorId || !tarefa.unitizadorCodigo) {
        continue;
      }

      const item = tarefa.itens[0];

      if (!item) {
        continue;
      }

      etiquetas.push({
        unitizadorId: tarefa.unitizadorId,
        codigo: tarefa.unitizadorCodigo,
        produtoId: item.produtoId,
        sku: item.produtoSku ?? item.produtoId,
        descricao: item.produtoNome ?? item.produtoId,
        quantidade: item.quantidade,
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        validade: item.validade?.toISOString() ?? null,
        enderecoSugeridoLabel: tarefa.enderecoSugeridoLabel,
        numeroRecebimento,
      });
    }

    if (etiquetas.length === 0) {
      throw new BadRequestException(
        'Nenhuma etiqueta de palete foi gerada para este recebimento',
      );
    }

    return etiquetas;
  }
}
