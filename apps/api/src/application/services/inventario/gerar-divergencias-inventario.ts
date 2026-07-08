import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';
import type {
  ContagemRecord,
  CreateDivergenciaInput,
  IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import { calcularQuantidadeContadaUnidades } from './calcular-quantidade-contagem.js';
import { buildInventarioContagemDocumentoRef } from './reconciliar-saldos-inventario.js';

function resolveSaldoReferencia(
  saldos: Awaited<ReturnType<IEstoqueRepository['listSaldosEndereco']>>,
  contagem: ContagemRecord,
) {
  if (contagem.saldoEnderecoId) {
    const byId = saldos.find((item) => item.id === contagem.saldoEnderecoId);
    if (byId) {
      return byId;
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

  if (contagem.lote?.trim()) {
    const byLote = saldos.find(
      (item) => item.lote.trim() === contagem.lote?.trim(),
    );
    if (byLote) {
      return byLote;
    }
  }

  if (saldos.length === 1) {
    return saldos[0] ?? null;
  }

  return null;
}

function buildEnderecoVazioDivergenciaInput(
  inventarioId: string,
  contagem: ContagemRecord,
  enderecoId: string,
  saldo: Awaited<
    ReturnType<IEstoqueRepository['listSaldosEndereco']>
  >[number],
): CreateDivergenciaInput {
  const baseDocumentoRef = buildInventarioContagemDocumentoRef(
    inventarioId,
    contagem.id,
  );

  return {
    inventarioId,
    contagemId: contagem.id,
    enderecoId,
    saldoEnderecoId: saldo.id,
    depositoId: saldo.depositoId,
    produtoId: saldo.produtoId,
    sku: saldo.produtoSku,
    produtoNome: saldo.produtoNome,
    quantidadeEsperada: saldo.quantidade,
    quantidadeContada: 0,
    delta: -saldo.quantidade,
    unidadeMedida: saldo.unidadeMedida,
    lote: saldo.lote,
    tipo: 'endereco_vazio',
    documentoRef: `${baseDocumentoRef}-saldo-${saldo.id}`,
  };
}

export async function gerarDivergenciasInventario(
  inventarioRepository: IInventarioRepository,
  estoqueRepository: IEstoqueRepository,
  inventarioId: string,
): Promise<void> {
  const existentes =
    await inventarioRepository.listDivergenciasByInventario(inventarioId);

  if (existentes.length > 0) {
    return;
  }

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

  const divergencias: CreateDivergenciaInput[] = [];

  for (const item of contagens) {
    const { contagem, enderecoId } = item;
    const saldosEndereco = saldosPorEndereco.get(enderecoId) ?? [];
    const baseDocumentoRef = buildInventarioContagemDocumentoRef(
      inventarioId,
      contagem.id,
    );

    if (contagem.anomaliaEncontrada) {
      const saldoReferencia = resolveSaldoReferencia(saldosEndereco, contagem);
      const quantidadeContada = calcularQuantidadeContadaUnidades(
        contagem.quantidadeCaixas,
        contagem.quantidadeUnidades,
        saldoReferencia?.unidadesPorCaixa,
      );

      divergencias.push({
        inventarioId,
        contagemId: contagem.id,
        enderecoId,
        saldoEnderecoId: saldoReferencia?.id ?? null,
        depositoId: saldoReferencia?.depositoId ?? null,
        produtoId: contagem.produtoId ?? saldoReferencia?.produtoId ?? null,
        sku: saldoReferencia?.produtoSku ?? contagem.codigoProduto,
        produtoNome: saldoReferencia?.produtoNome ?? '—',
        quantidadeEsperada: saldoReferencia?.quantidade ?? 0,
        quantidadeContada,
        delta: 0,
        unidadeMedida: saldoReferencia?.unidadeMedida ?? null,
        lote: contagem.lote ?? saldoReferencia?.lote ?? null,
        tipo: 'anomalia',
        documentoRef: baseDocumentoRef,
      });
      continue;
    }

    if (contagem.enderecoVazio) {
      for (const saldo of saldosEndereco) {
        if (saldo.quantidade <= 0) {
          continue;
        }

        divergencias.push(
          buildEnderecoVazioDivergenciaInput(
            inventarioId,
            contagem,
            enderecoId,
            saldo,
          ),
        );
      }
      continue;
    }

    const saldoReferencia = resolveSaldoReferencia(saldosEndereco, contagem);

    if (!saldoReferencia) {
      continue;
    }

    const quantidadeEsperada = saldoReferencia.quantidade;
    const quantidadeContada = calcularQuantidadeContadaUnidades(
      contagem.quantidadeCaixas,
      contagem.quantidadeUnidades,
      saldoReferencia.unidadesPorCaixa,
    );
    const delta = quantidadeContada - quantidadeEsperada;
    const isDivergencia =
      contagem.tipo === 'cega'
        ? contagem.enderecoVazio || delta !== 0
        : contagem.enderecoVazio ||
          !contagem.correspondeAoEsperado ||
          delta !== 0;

    if (!isDivergencia || delta === 0) {
      continue;
    }

    divergencias.push({
      inventarioId,
      contagemId: contagem.id,
      enderecoId,
      saldoEnderecoId: saldoReferencia.id,
      depositoId: saldoReferencia.depositoId,
      produtoId: saldoReferencia.produtoId,
      sku: saldoReferencia.produtoSku,
      produtoNome: saldoReferencia.produtoNome,
      quantidadeEsperada,
      quantidadeContada,
      delta,
      unidadeMedida: saldoReferencia.unidadeMedida,
      lote: saldoReferencia.lote,
      tipo: delta >= 0 ? 'sobra' : 'falta',
      documentoRef: baseDocumentoRef,
    });
  }

  if (divergencias.length === 0) {
    return;
  }

  await inventarioRepository.createDivergencias(divergencias);
}
