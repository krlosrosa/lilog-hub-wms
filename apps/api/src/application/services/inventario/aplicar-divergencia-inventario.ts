import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';
import type {
  DivergenciaInventarioPersistedRecord,
  IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';

async function marcarDivergenciaAplicada(
  inventarioRepository: IInventarioRepository,
  divergenciaId: string,
): Promise<void> {
  await inventarioRepository.updateDivergenciaStatus(divergenciaId, {
    status: 'aplicada',
  });
}

export async function aplicarDivergenciaInventario(
  estoqueRepository: IEstoqueRepository,
  inventarioRepository: IInventarioRepository,
  divergencia: DivergenciaInventarioPersistedRecord,
  operatorId: number | null,
): Promise<void> {
  if (divergencia.status !== 'aprovada') {
    throw new Error(
      `Divergência "${divergencia.id}" não está aprovada para aplicação`,
    );
  }

  if (divergencia.tipo === 'anomalia' || divergencia.delta === 0) {
    await marcarDivergenciaAplicada(inventarioRepository, divergencia.id);
    return;
  }

  const alreadyProcessed =
    await estoqueRepository.existsMovimentacaoByDocumentoRef(
      divergencia.documentoRef,
    );

  if (alreadyProcessed) {
    await marcarDivergenciaAplicada(inventarioRepository, divergencia.id);
    return;
  }

  if (
    divergencia.tipo === 'endereco_vazio' ||
    divergencia.tipo === 'falta' ||
    divergencia.tipo === 'sobra'
  ) {
    if (!divergencia.saldoEnderecoId || !divergencia.depositoId || !divergencia.produtoId) {
      throw new Error(
        `Divergência "${divergencia.id}" não possui referência de saldo completa`,
      );
    }

    const saldoReferencia = await estoqueRepository.findSaldoEnderecoById(
      divergencia.saldoEnderecoId,
    );

    if (!saldoReferencia) {
      throw new Error(
        `Saldo "${divergencia.saldoEnderecoId}" não encontrado para divergência "${divergencia.id}"`,
      );
    }

    const delta = divergencia.delta;

    await estoqueRepository.upsertSaldoEndereco({
      unidadeId: saldoReferencia.unidadeId,
      produtoId: saldoReferencia.produtoId,
      depositoId: saldoReferencia.depositoId,
      enderecoId: saldoReferencia.enderecoId,
      lote: saldoReferencia.lote,
      validade: saldoReferencia.validade,
      numeroSerie: saldoReferencia.numeroSerie,
      natureza: saldoReferencia.natureza,
      status: saldoReferencia.status,
      motivoBloqueioId: saldoReferencia.motivoBloqueio?.id ?? null,
      observacaoBloqueio: saldoReferencia.observacaoBloqueio,
      bloqueadoPor: saldoReferencia.bloqueadoPor,
      quantidadeDelta: delta,
      unidadeMedida: saldoReferencia.unidadeMedida,
    });

    await estoqueRepository.registrarMovimentacaoEstoque({
      unidadeId: saldoReferencia.unidadeId,
      produtoId: saldoReferencia.produtoId,
      depositoOrigemId: delta < 0 ? saldoReferencia.depositoId : null,
      depositoDestinoId: delta > 0 ? saldoReferencia.depositoId : null,
      enderecoOrigemId: delta < 0 ? saldoReferencia.enderecoId : null,
      enderecoDestinoId: delta > 0 ? saldoReferencia.enderecoId : null,
      tipoMovimento: 'AJUSTE',
      quantidade: Math.abs(delta),
      unidadeMedida:
        divergencia.unidadeMedida ?? saldoReferencia.unidadeMedida,
      lote: saldoReferencia.lote,
      validade: saldoReferencia.validade,
      numeroSerie: saldoReferencia.numeroSerie,
      natureza: saldoReferencia.natureza,
      documentoRef: divergencia.documentoRef,
      motivo: 'inventario_validacao',
      operatorId,
    });
  }

  await marcarDivergenciaAplicada(inventarioRepository, divergencia.id);
}
