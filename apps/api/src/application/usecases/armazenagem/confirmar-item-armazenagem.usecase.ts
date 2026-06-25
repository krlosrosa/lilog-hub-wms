import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ConfirmarItemArmazenagemInputSchema,
  type ConfirmarItemArmazenagemInput,
} from '../../../domain/model/armazenagem/armazenagem.model.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import { resolveSaldoOrigemArmazenagem } from '../../../domain/services/resolve-saldo-origem-armazenagem.js';
import { MovimentarEstoqueUseCase } from '../estoque/movimentar-estoque.usecase.js';
import { EnsureDepositosUnidadeUseCase } from '../estoque/ensure-depositos-unidade.usecase.js';

export type ConfirmarItemArmazenagemUseCaseInput = {
  demandaId: string;
  itemId: string;
  data: ConfirmarItemArmazenagemInput;
  operatorId: number | null;
};

@Injectable()
export class ConfirmarItemArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly movimentarEstoqueUseCase: MovimentarEstoqueUseCase,
    private readonly ensureDepositosUnidadeUseCase: EnsureDepositosUnidadeUseCase,
  ) {}

  async execute({
    demandaId,
    itemId,
    data,
    operatorId,
  }: ConfirmarItemArmazenagemUseCaseInput) {
    const parsed = ConfirmarItemArmazenagemInputSchema.parse(data);
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda não está disponível para armazenagem');
    }

    const item = demanda.itens.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item "${itemId}" não encontrado na demanda`);
    }

    if (item.status === 'armazenado') {
      throw new BadRequestException('Item já foi armazenado');
    }

    const endereco = await this.enderecoRepository.findById(
      parsed.enderecoConfirmadoId,
    );

    if (!endereco) {
      throw new NotFoundException(
        `Endereço "${parsed.enderecoConfirmadoId}" não encontrado`,
      );
    }

    if (endereco.centro.unidadeId !== demanda.unidadeId) {
      throw new BadRequestException(
        'Endereço informado não pertence à unidade da demanda',
      );
    }

    const politica = await this.armazenagemRepository.getPoliticaArmazenagem(
      demanda.unidadeId,
    );

    const enderecosDivergem =
      item.enderecoSugeridoId !== null &&
      item.enderecoSugeridoId !== parsed.enderecoConfirmadoId;

    if (enderecosDivergem) {
      if (politica.enderecoDivergente === 'bloquear') {
        throw new BadRequestException(
          'Endereço confirmado difere do sugerido. A política da unidade não permite divergência.',
        );
      }

      if (
        politica.enderecoDivergente === 'permitir_com_motivo' &&
        !parsed.motivoDivergencia
      ) {
        throw new BadRequestException(
          'Informe o motivo da divergência de endereço (motivoDivergencia).',
        );
      }
    }

    let unitizadorId = item.unitizadorId;

    if (
      demanda.modoUnitizacao === 'gerar_etiqueta_na_armazenagem' &&
      !unitizadorId
    ) {
      if (!parsed.unitizadorCodigo) {
        throw new BadRequestException(
          'unitizadorCodigo é obrigatório para gerar etiqueta na armazenagem',
        );
      }

      const existing = await this.armazenagemRepository.findUnitizadorByCodigo(
        demanda.unidadeId,
        parsed.unitizadorCodigo,
      );

      if (existing) {
        const podeReutilizar =
          existing.recebimentoId === demanda.recebimentoId &&
          (existing.status === 'aguardando_armazenagem' ||
            existing.status === 'armazenado');

        if (!podeReutilizar) {
          throw new BadRequestException(
            `Unitizador "${parsed.unitizadorCodigo}" já existe`,
          );
        }

        unitizadorId = existing.id;

        if (existing.enderecoAtualId !== parsed.enderecoConfirmadoId) {
          await this.armazenagemRepository.updateUnitizadorStatus(
            existing.id,
            existing.status,
            { enderecoAtualId: parsed.enderecoConfirmadoId },
          );
        }
      } else {
        const created = await this.armazenagemRepository.criarUnitizador({
          unidadeId: demanda.unidadeId,
          codigo: parsed.unitizadorCodigo,
          tipo: 'palete',
          origem: 'gerado_sistema',
          status: 'armazenado',
          recebimentoId: demanda.recebimentoId,
          enderecoAtualId: parsed.enderecoConfirmadoId,
        });

        unitizadorId = created.id;
      }
    }

    const depositoAguard = await this.estoqueRepository.findDepositoByCodigo(
      demanda.unidadeId,
      'AGUARD_ARM',
    );
    const depositoGeral = await this.estoqueRepository.findDepositoByCodigo(
      demanda.unidadeId,
      'GERAL',
    );

    if (!depositoAguard || !depositoGeral) {
      await this.ensureDepositosUnidadeUseCase.execute(demanda.unidadeId);
    }

    const depositoAguardResolved =
      depositoAguard ??
      (await this.estoqueRepository.findDepositoByCodigo(
        demanda.unidadeId,
        'AGUARD_ARM',
      ));
    const depositoGeralResolved =
      depositoGeral ??
      (await this.estoqueRepository.findDepositoByCodigo(
        demanda.unidadeId,
        'GERAL',
      ));

    if (!depositoAguardResolved || !depositoGeralResolved) {
      throw new Error('Depósitos AGUARD_ARM ou GERAL não encontrados');
    }

    const documentoRef =
      await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        demanda.recebimentoId,
      );

    if (!documentoRef) {
      throw new NotFoundException(
        `Recebimento "${demanda.recebimentoId}" não encontrado`,
      );
    }

    const saldosAguard = await this.estoqueRepository.listSaldos({
      unidadeId: demanda.unidadeId,
      depositoCodigo: 'AGUARD_ARM',
      produtoId: item.produtoId,
    });

    const saldoOrigem = resolveSaldoOrigemArmazenagem(saldosAguard, {
      lote: item.lote,
      numeroSerie: item.numeroSerie,
      documentoRefsPrioridade: [documentoRef, ''],
    });

    if (!saldoOrigem || saldoOrigem.quantidadeDisponivel <= 0) {
      throw new BadRequestException(
        'Sem saldo em aguardando armazenagem para este item',
      );
    }

    const quantidadeTransfer = Math.min(
      item.quantidade,
      saldoOrigem.quantidadeDisponivel,
    );

    if (quantidadeTransfer <= 0) {
      throw new BadRequestException(
        'Sem saldo em aguardando armazenagem para este item',
      );
    }

    await this.movimentarEstoqueUseCase.transferirDeposito({
      unidadeId: demanda.unidadeId,
      depositoOrigemId: depositoAguardResolved.id,
      depositoDestinoId: depositoGeralResolved.id,
      produtoId: item.produtoId,
      quantidade: quantidadeTransfer,
      unidadeMedida: item.unidadeMedida,
      documentoRef: saldoOrigem.documentoRef || undefined,
      motivo: 'armazenagem_confirmada',
      operatorId,
      lote: item.lote ?? undefined,
      validade: item.validade ?? undefined,
      numeroSerie: item.numeroSerie ?? undefined,
    });

    const updatedItem = await this.armazenagemRepository.updateStatusItem(
      itemId,
      'armazenado',
      parsed.enderecoConfirmadoId,
      unitizadorId ?? undefined,
      quantidadeTransfer,
    );

    if (!updatedItem) {
      throw new Error('Failed to update item armazenagem');
    }

    if (unitizadorId) {
      await this.armazenagemRepository.updateUnitizadorStatus(
        unitizadorId,
        'armazenado',
        { enderecoAtualId: parsed.enderecoConfirmadoId },
      );
    }

    const demandaAtualizada =
      await this.armazenagemRepository.findDemandaById(demandaId);

    const todosArmazenados =
      demandaAtualizada?.itens.every((entry) => entry.status === 'armazenado') ??
      false;

    if (todosArmazenados) {
      await this.armazenagemRepository.updateStatusDemanda(demandaId, 'concluida', {
        finishedAt: new Date(),
      });
    }

    return updatedItem;
  }
}
