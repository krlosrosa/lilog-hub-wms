import type { ItemArmazenagemRecord } from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';

export function buildArmazenagemItemSaldoDocumentoRef(itemId: string): string {
  return `armazenagem-item-${itemId}`;
}

export function buildArmazenagemTarefaItemSaldoDocumentoRef(
  tarefaId: string,
  itemId: string,
): string {
  return `armazenagem-tarefa-${tarefaId}-item-${itemId}`;
}

function normalizeLote(lote: string | null): string {
  return lote?.trim() ?? '';
}

function normalizeNumeroSerie(numeroSerie: string | null): string {
  return numeroSerie?.trim() ?? '';
}

function resolveSaldoOrigemTransf(
  saldos: SaldoEndereco[],
  item: Pick<
    ItemArmazenagemRecord,
    'quantidade' | 'lote' | 'numeroSerie' | 'statusSaldo'
  >,
): SaldoEndereco | null {
  const lote = normalizeLote(item.lote);
  const numeroSerie = normalizeNumeroSerie(item.numeroSerie);

  const matching = saldos.filter(
    (saldo) =>
      normalizeLote(saldo.lote) === lote &&
      normalizeNumeroSerie(saldo.numeroSerie) === numeroSerie &&
      Number(saldo.quantidade) >= item.quantidade &&
      (item.statusSaldo ? saldo.status === item.statusSaldo : true),
  );

  if (item.statusSaldo) {
    return matching.find((saldo) => saldo.status === item.statusSaldo) ?? null;
  }

  return (
    matching.find((saldo) => saldo.status === 'liberado') ??
    matching.find((saldo) => saldo.status === 'bloqueado') ??
    null
  );
}

export type ProcessarTransferenciaSaldoArmazenagemInput = {
  unidadeId: string;
  item: ItemArmazenagemRecord;
  enderecoConfirmadoId: string;
  operatorId: number | null;
  documentoRef: string;
};

export async function processarTransferenciaSaldoArmazenagem(
  estoqueRepository: IEstoqueRepository,
  input: ProcessarTransferenciaSaldoArmazenagemInput,
): Promise<void> {
  const alreadyProcessed =
    await estoqueRepository.existsMovimentacaoByDocumentoRef(input.documentoRef);

  if (alreadyProcessed) {
    return;
  }

  const depositoTransf = await estoqueRepository.findDepositoByCodigo(
    input.unidadeId,
    'TRANSF',
  );

  if (!depositoTransf) {
    throw new Error(
      `Depósito TRANSF não encontrado para unidade "${input.unidadeId}"`,
    );
  }

  const depositoGeral = await estoqueRepository.findDepositoByCodigo(
    input.unidadeId,
    'GERAL',
  );

  if (!depositoGeral) {
    throw new Error(
      `Depósito GERAL não encontrado para unidade "${input.unidadeId}"`,
    );
  }

  const enderecoVirtual = await estoqueRepository.ensureEnderecoVirtualDeposito({
    unidadeId: input.unidadeId,
    depositoCodigo: depositoTransf.codigo,
  });

  const saldosTransf = await estoqueRepository.listSaldosEndereco({
    unidadeId: input.unidadeId,
    depositoId: depositoTransf.id,
    enderecoId: enderecoVirtual.id,
    produtoId: input.item.produtoId,
  });

  const saldoOrigem = resolveSaldoOrigemTransf(saldosTransf, input.item);

  if (!saldoOrigem) {
    throw new Error(
      `Saldo insuficiente em TRANSF para produto "${input.item.produtoId}" (item "${input.item.id}")`,
    );
  }

  await estoqueRepository.upsertSaldoEndereco({
    unidadeId: input.unidadeId,
    produtoId: input.item.produtoId,
    depositoId: depositoTransf.id,
    enderecoId: enderecoVirtual.id,
    lote: input.item.lote,
    validade: input.item.validade,
    numeroSerie: input.item.numeroSerie,
    natureza: saldoOrigem.natureza,
    status: saldoOrigem.status,
    motivoBloqueioId: saldoOrigem.motivoBloqueio?.id ?? null,
    observacaoBloqueio: saldoOrigem.observacaoBloqueio,
    bloqueadoPor: saldoOrigem.bloqueadoPor,
    quantidadeDelta: -input.item.quantidade,
    unidadeMedida: input.item.unidadeMedida,
  });

  await estoqueRepository.upsertSaldoEndereco({
    unidadeId: input.unidadeId,
    produtoId: input.item.produtoId,
    depositoId: depositoGeral.id,
    enderecoId: input.enderecoConfirmadoId,
    lote: input.item.lote,
    validade: input.item.validade,
    numeroSerie: input.item.numeroSerie,
    natureza: saldoOrigem.natureza,
    status: saldoOrigem.status,
    motivoBloqueioId: saldoOrigem.motivoBloqueio?.id ?? null,
    observacaoBloqueio: saldoOrigem.observacaoBloqueio,
    bloqueadoPor: saldoOrigem.bloqueadoPor,
    quantidadeDelta: input.item.quantidade,
    unidadeMedida: input.item.unidadeMedida,
  });

  await estoqueRepository.registrarMovimentacaoEstoque({
    unidadeId: input.unidadeId,
    produtoId: input.item.produtoId,
    depositoOrigemId: depositoTransf.id,
    depositoDestinoId: depositoGeral.id,
    enderecoOrigemId: enderecoVirtual.id,
    enderecoDestinoId: input.enderecoConfirmadoId,
    tipoMovimento: 'TRANSFERENCIA_DEPOSITO',
    quantidade: input.item.quantidade,
    unidadeMedida: input.item.unidadeMedida,
    lote: input.item.lote,
    validade: input.item.validade,
    numeroSerie: input.item.numeroSerie,
    natureza: saldoOrigem.natureza,
    documentoRef: input.documentoRef,
    motivo: 'armazenagem_confirmada',
    operatorId: input.operatorId,
  });
}
