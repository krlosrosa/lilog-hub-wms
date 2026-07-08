import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { IInventarioRepository } from '../../../domain/repositories/inventario/inventario.repository.js';
import { calcularQuantidadeContadaUnidades } from './calcular-quantidade-contagem.js';

export function buildInventarioContagemDocumentoRef(
  inventarioId: string,
  contagemId: string,
): string {
  return `inventario-${inventarioId}-contagem-${contagemId}`;
}

export async function reconciliarSaldosInventario(
  inventarioRepository: IInventarioRepository,
  estoqueRepository: IEstoqueRepository,
  inventarioId: string,
  operatorId: number | null,
): Promise<void> {
  const contagens =
    await inventarioRepository.listContagensValidacaoParaReconciliacao(
      inventarioId,
    );

  if (contagens.length === 0) {
    return;
  }

  const unidadeId = contagens[0]!.unidadeId;
  const enderecoIds = [...new Set(contagens.map((item) => item.enderecoId))];
  const saldosAtuais = await estoqueRepository.listSaldosEndereco({
    unidadeId,
    enderecoIds,
    natureza: 'fisico',
  });

  const saldosPorEndereco = new Map<string, typeof saldosAtuais>();
  for (const saldo of saldosAtuais) {
    const current = saldosPorEndereco.get(saldo.enderecoId) ?? [];
    current.push(saldo);
    saldosPorEndereco.set(saldo.enderecoId, current);
  }

  for (const item of contagens) {
    const { contagem, enderecoId } = item;

    if (contagem.anomaliaEncontrada) {
      continue;
    }

    const documentoRef = buildInventarioContagemDocumentoRef(
      inventarioId,
      contagem.id,
    );

    const alreadyProcessed =
      await estoqueRepository.existsMovimentacaoByDocumentoRef(documentoRef);

    if (alreadyProcessed) {
      continue;
    }

    const saldosEndereco = saldosPorEndereco.get(enderecoId) ?? [];

    if (contagem.enderecoVazio) {
      for (const saldo of saldosEndereco) {
        if (saldo.quantidade <= 0) {
          continue;
        }

        await estoqueRepository.upsertSaldoEndereco({
          unidadeId: saldo.unidadeId,
          produtoId: saldo.produtoId,
          depositoId: saldo.depositoId,
          enderecoId: saldo.enderecoId,
          lote: saldo.lote,
          validade: saldo.validade,
          numeroSerie: saldo.numeroSerie,
          natureza: saldo.natureza,
          status: saldo.status,
          motivoBloqueioId: saldo.motivoBloqueio?.id ?? null,
          observacaoBloqueio: saldo.observacaoBloqueio,
          bloqueadoPor: saldo.bloqueadoPor,
          quantidadeDelta: -saldo.quantidade,
          unidadeMedida: saldo.unidadeMedida,
        });

        await estoqueRepository.registrarMovimentacaoEstoque({
          unidadeId: saldo.unidadeId,
          produtoId: saldo.produtoId,
          depositoOrigemId: saldo.depositoId,
          enderecoOrigemId: saldo.enderecoId,
          tipoMovimento: 'AJUSTE',
          quantidade: saldo.quantidade,
          unidadeMedida: saldo.unidadeMedida,
          lote: saldo.lote,
          validade: saldo.validade,
          numeroSerie: saldo.numeroSerie,
          natureza: saldo.natureza,
          documentoRef: `${documentoRef}-saldo-${saldo.id}`,
          motivo: 'inventario_validacao',
          operatorId,
        });
      }

      continue;
    }

    const saldoReferencia =
      (contagem.saldoEnderecoId
        ? saldosEndereco.find((saldo) => saldo.id === contagem.saldoEnderecoId)
        : null) ??
      (contagem.lote?.trim()
        ? saldosEndereco.find(
            (saldo) => saldo.lote.trim() === contagem.lote?.trim(),
          )
        : null) ??
      (saldosEndereco.length === 1 ? saldosEndereco[0] : null);

    if (!saldoReferencia) {
      continue;
    }

    const quantidadeContada = calcularQuantidadeContadaUnidades(
      contagem.quantidadeCaixas,
      contagem.quantidadeUnidades,
      saldoReferencia.unidadesPorCaixa,
    );
    const delta = quantidadeContada - saldoReferencia.quantidade;

    if (delta === 0) {
      continue;
    }

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
      unidadeMedida: saldoReferencia.unidadeMedida,
      lote: saldoReferencia.lote,
      validade: saldoReferencia.validade,
      numeroSerie: saldoReferencia.numeroSerie,
      natureza: saldoReferencia.natureza,
      documentoRef,
      motivo: 'inventario_validacao',
      operatorId,
    });
  }
}
