import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';
import type {
  ContagemRecord,
  DivergenciaInventarioPersistedRecord,
  IInventarioRepository,
  UpdateDivergenciaContagemInput,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import { calcularQuantidadeContadaUnidades } from './calcular-quantidade-contagem.js';
import { buildInventarioContagemDocumentoRef } from './reconciliar-saldos-inventario.js';

function resolveSaldoReferencia(
  saldos: Awaited<ReturnType<IEstoqueRepository['listSaldosEndereco']>>,
  contagem: ContagemRecord,
  divergencia: DivergenciaInventarioPersistedRecord,
) {
  if (divergencia.saldoEnderecoId) {
    const byDivergencia = saldos.find(
      (item) => item.id === divergencia.saldoEnderecoId,
    );
    if (byDivergencia) {
      return byDivergencia;
    }
  }

  if (contagem.saldoEnderecoId) {
    const byId = saldos.find((item) => item.id === contagem.saldoEnderecoId);
    if (byId) {
      return byId;
    }
  }

  if (divergencia.produtoId) {
    const byProduto = saldos.find(
      (item) => item.produtoId === divergencia.produtoId,
    );
    if (byProduto) {
      return byProduto;
    }
  }

  if (contagem.produtoId) {
    const byProduto = saldos.find(
      (item) => item.produtoId === contagem.produtoId,
    );
    if (byProduto) {
      return byProduto;
    }
  }

  const loteRef = contagem.lote?.trim() || divergencia.lote?.trim();
  if (loteRef) {
    const byLote = saldos.find((item) => item.lote.trim() === loteRef);
    if (byLote) {
      return byLote;
    }
  }

  if (saldos.length === 1) {
    return saldos[0] ?? null;
  }

  return null;
}

function buildUpdateFromContagem(
  inventarioId: string,
  divergencia: DivergenciaInventarioPersistedRecord,
  contagem: ContagemRecord,
  saldoReferencia: Awaited<
    ReturnType<IEstoqueRepository['listSaldosEndereco']>
  >[number] | null,
): UpdateDivergenciaContagemInput {
  const baseDocumentoRef = buildInventarioContagemDocumentoRef(
    inventarioId,
    contagem.id,
  );

  if (contagem.anomaliaEncontrada) {
    const quantidadeContada = calcularQuantidadeContadaUnidades(
      contagem.quantidadeCaixas,
      contagem.quantidadeUnidades,
      saldoReferencia?.unidadesPorCaixa,
    );
    const quantidadeEsperada = saldoReferencia?.quantidade ?? 0;

    return {
      contagemId: contagem.id,
      saldoEnderecoId: saldoReferencia?.id ?? divergencia.saldoEnderecoId,
      depositoId: saldoReferencia?.depositoId ?? divergencia.depositoId,
      produtoId:
        contagem.produtoId ??
        saldoReferencia?.produtoId ??
        divergencia.produtoId,
      quantidadeEsperada,
      quantidadeContada,
      delta: quantidadeContada - quantidadeEsperada,
      lote: contagem.lote ?? saldoReferencia?.lote ?? divergencia.lote,
      tipo: 'anomalia',
      documentoRef: baseDocumentoRef,
    };
  }

  if (contagem.enderecoVazio) {
    const quantidadeEsperada = saldoReferencia?.quantidade ?? 0;

    return {
      contagemId: contagem.id,
      saldoEnderecoId: saldoReferencia?.id ?? divergencia.saldoEnderecoId,
      depositoId: saldoReferencia?.depositoId ?? divergencia.depositoId,
      produtoId: saldoReferencia?.produtoId ?? divergencia.produtoId,
      quantidadeEsperada,
      quantidadeContada: 0,
      delta: -quantidadeEsperada,
      lote: saldoReferencia?.lote ?? divergencia.lote,
      tipo: 'endereco_vazio',
      documentoRef: saldoReferencia
        ? `${baseDocumentoRef}-saldo-${saldoReferencia.id}`
        : baseDocumentoRef,
    };
  }

  const quantidadeEsperada =
    saldoReferencia?.quantidade ?? divergencia.quantidadeEsperada;
  const quantidadeContada = calcularQuantidadeContadaUnidades(
    contagem.quantidadeCaixas,
    contagem.quantidadeUnidades,
    saldoReferencia?.unidadesPorCaixa,
  );
  const delta = quantidadeContada - quantidadeEsperada;

  return {
    contagemId: contagem.id,
    saldoEnderecoId: saldoReferencia?.id ?? divergencia.saldoEnderecoId,
    depositoId: saldoReferencia?.depositoId ?? divergencia.depositoId,
    produtoId:
      saldoReferencia?.produtoId ??
      contagem.produtoId ??
      divergencia.produtoId,
    quantidadeEsperada,
    quantidadeContada,
    delta,
    lote: contagem.lote ?? saldoReferencia?.lote ?? divergencia.lote,
    tipo:
      delta === 0
        ? divergencia.tipo
        : delta > 0
          ? 'sobra'
          : 'falta',
    documentoRef: baseDocumentoRef,
  };
}

export async function reconciliarDivergenciaRecontagem(
  inventarioRepository: IInventarioRepository,
  estoqueRepository: IEstoqueRepository,
  demandaId: string,
  contagem: ContagemRecord,
  enderecoId: string,
  unidadeId: string,
): Promise<void> {
  const recontagem =
    await inventarioRepository.findRecontagemAbertaByDemanda(demandaId);

  if (!recontagem) {
    return;
  }

  const divergencia = await inventarioRepository.findDivergenciaById(
    recontagem.divergenciaId,
  );

  if (!divergencia || divergencia.status !== 'pendente') {
    return;
  }

  const saldos = await estoqueRepository.listSaldosEndereco({
    unidadeId,
    enderecoIds: [enderecoId],
    natureza: 'fisico',
  });

  const saldoReferencia = resolveSaldoReferencia(saldos, contagem, divergencia);
  const update = buildUpdateFromContagem(
    divergencia.inventarioId,
    divergencia,
    contagem,
    saldoReferencia,
  );

  await inventarioRepository.updateDivergenciaContagem(
    divergencia.id,
    update,
  );
  await inventarioRepository.concluirDemandaContagemSeCompleta(demandaId);
}

export async function reconciliarDivergenciasRecontagemPendentes(
  inventarioRepository: IInventarioRepository,
  estoqueRepository: IEstoqueRepository,
  inventarioId: string,
): Promise<void> {
  const pendentes =
    await inventarioRepository.listRecontagensComContagemPendenteReconciliacao(
      inventarioId,
    );

  for (const item of pendentes) {
    await reconciliarDivergenciaRecontagem(
      inventarioRepository,
      estoqueRepository,
      item.demandaId,
      item.contagem,
      item.enderecoId,
      item.unidadeId,
    );
  }
}
