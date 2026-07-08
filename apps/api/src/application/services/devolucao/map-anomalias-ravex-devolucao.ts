import type {
  CriarDevolucaoItemInput,
  CriarDevolucaoNotaFiscalInput,
  DevolucaoNotaFiscalTipo,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type {
  RavexAnomaliaViagem,
  RavexEntrega,
  RavexEntregaDestinatario,
  RavexNotaFiscalItem,
} from '../../../infra/clients/ravex/ravex-viagem.types.js';
import {
  isUnidadeCaixa,
  normalizarQuantidadeRemessaItem,
} from '../expedicao/normalizar-quantidade-remessa-item.js';
import { resolverPesoPorUnidadeProduto } from '../expedicao/calcular-breakdown-quantidade.js';

const TIPO_RETORNO_MAP: Record<number, DevolucaoNotaFiscalTipo> = {
  1: 'devolucao_total',
  2: 'devolucao_parcial',
  3: 'reentrega',
};

export function mapTipoRetornoRavex(
  tipoRetorno: number | undefined,
): DevolucaoNotaFiscalTipo {
  if (tipoRetorno && TIPO_RETORNO_MAP[tipoRetorno]) {
    return TIPO_RETORNO_MAP[tipoRetorno];
  }

  return 'devolucao_parcial';
}

export function buildCodigoDemandaViagemRavex(viagemId: number): string {
  return `RVX-${viagemId}`;
}

export function buildDestinatarioPorNfIdFromEntregas(
  entregas: RavexEntrega[],
): Map<number, RavexEntregaDestinatario> {
  const map = new Map<number, RavexEntregaDestinatario>();

  for (const entrega of entregas) {
    const destinatario = entrega.destinatario;

    if (!destinatario) {
      continue;
    }

    for (const notaFiscal of entrega.notasFiscais ?? []) {
      map.set(notaFiscal.id, destinatario);
    }
  }

  return map;
}

function resolveDestinatarioFields(
  notaFiscalId: number,
  destinatarioPorNfId: Map<number, RavexEntregaDestinatario>,
): Pick<CriarDevolucaoNotaFiscalInput, 'codCliente' | 'cliente' | 'cidade'> {
  const destinatario = destinatarioPorNfId.get(notaFiscalId);

  if (!destinatario) {
    return { codCliente: null, cliente: null, cidade: null };
  }

  return {
    codCliente: destinatario.codigo?.trim() || null,
    cliente: destinatario.nome?.trim() || null,
    cidade: destinatario.municipio?.trim() || null,
  };
}

type NotaFiscalGroupKey = `${number}:${DevolucaoNotaFiscalTipo}`;

function buildNotaFiscalGroupKey(anomalia: RavexAnomaliaViagem): NotaFiscalGroupKey {
  const notaFiscalId = anomalia.notaFiscalId ?? 0;
  const tipo = mapTipoRetornoRavex(anomalia.tipoRetorno);

  return `${notaFiscalId}:${tipo}`;
}

function resolveCodigoProduto(
  anomalia: RavexAnomaliaViagem,
  nfItem: RavexNotaFiscalItem | undefined,
): string | null {
  const codigoAnomalia = anomalia.item?.codigo?.trim();
  if (codigoAnomalia) {
    return codigoAnomalia;
  }

  const codigoProduto = nfItem?.produto?.codigo?.trim();
  if (codigoProduto) {
    return codigoProduto;
  }

  return nfItem?.referenciaItem?.trim() || null;
}

function findNotaFiscalItem(
  anomalia: RavexAnomaliaViagem,
  itensNota: RavexNotaFiscalItem[],
): RavexNotaFiscalItem | undefined {
  const itemId = anomalia.item?.itemId;

  if (itemId != null) {
    const byId = itensNota.find((item) => item.id === itemId);
    if (byId) {
      return byId;
    }
  }

  const codigo = anomalia.item?.codigo?.trim();

  if (codigo) {
    return itensNota.find(
      (item) =>
        item.produto?.codigo?.trim() === codigo ||
        item.referenciaItem?.trim() === codigo,
    );
  }

  return undefined;
}

function resolveUnidadeMedida(
  nfItem: RavexNotaFiscalItem | undefined,
): string {
  const unidade =
    nfItem?.unidade?.trim() || nfItem?.produto?.unidade?.trim() || null;

  return unidade || 'UN';
}

function resolveDataFabricacao(
  nfItem: RavexNotaFiscalItem | undefined,
): string | null {
  const raw = nfItem?.dataFabricacao?.trim();

  if (!raw) {
    return null;
  }

  return raw.slice(0, 10);
}

function resolveDescricaoProduto(
  nfItem: RavexNotaFiscalItem | undefined,
): string | null {
  if (nfItem?.descricaoItem?.trim()) {
    return nfItem.descricaoItem.trim();
  }

  if (nfItem?.produto?.descricao?.trim()) {
    return nfItem.produto.descricao.trim();
  }

  return null;
}

function resolveQuantidade(
  anomalia: RavexAnomaliaViagem,
  nfItem: RavexNotaFiscalItem | undefined,
): number {
  const quantidadeDevolvida = anomalia.item?.quantidadeDevolvida ?? 0;

  if (quantidadeDevolvida > 0) {
    return quantidadeDevolvida;
  }

  const quantidadeNota = nfItem?.quantidade ?? 0;

  if (quantidadeNota > 0) {
    return quantidadeNota;
  }

  return 0;
}

function resolvePesoDevolvido(
  anomalia: RavexAnomaliaViagem,
  nfItem: RavexNotaFiscalItem | undefined,
  quantidade: number,
): number | null {
  const pesoBrutoAnomalia = anomalia.item?.pesoBrutoDevolvido ?? 0;
  if (pesoBrutoAnomalia > 0) {
    return pesoBrutoAnomalia;
  }

  const pesoLiquidoAnomalia = anomalia.item?.pesoLiquidoDevolvido ?? 0;
  if (pesoLiquidoAnomalia > 0) {
    return pesoLiquidoAnomalia;
  }

  if (!nfItem || quantidade <= 0) {
    return null;
  }

  const pesoBrutoNota = nfItem.pesoBruto ?? 0;
  const quantidadeNota = nfItem.quantidade ?? 0;

  if (pesoBrutoNota > 0) {
    if (quantidadeNota > 0 && quantidadeNota !== quantidade) {
      return (pesoBrutoNota / quantidadeNota) * quantidade;
    }

    return pesoBrutoNota;
  }

  const pesoLiquidoNota = nfItem.pesoLiquido ?? 0;

  if (pesoLiquidoNota > 0) {
    if (quantidadeNota > 0 && quantidadeNota !== quantidade) {
      return (pesoLiquidoNota / quantidadeNota) * quantidade;
    }

    return pesoLiquidoNota;
  }

  return null;
}

function buildMotivoItem(anomalia: RavexAnomaliaViagem): string | null {
  return (
    anomalia.item?.motivo?.descricao?.trim() ??
    anomalia.motivo?.descricao?.trim() ??
    null
  );
}

function buildObservacaoItem(anomalia: RavexAnomaliaViagem): string | null {
  return anomalia.observacaoAnomalia?.trim() ?? anomalia.observacao?.trim() ?? null;
}

function mapAnomaliaToItem(
  anomalia: RavexAnomaliaViagem,
  itensNota: RavexNotaFiscalItem[],
): CriarDevolucaoItemInput | null {
  const nfItem = findNotaFiscalItem(anomalia, itensNota);
  const codigoProduto = resolveCodigoProduto(anomalia, nfItem);
  const quantidade = resolveQuantidade(anomalia, nfItem);

  if (!codigoProduto || quantidade <= 0) {
    return null;
  }

  return {
    codigoProduto,
    sku: codigoProduto,
    descricaoProduto: resolveDescricaoProduto(nfItem),
    dataFabricacao: resolveDataFabricacao(nfItem),
    quantidade,
    unidadeMedida: resolveUnidadeMedida(nfItem),
    quantidadeNormalizadaUnidades: quantidade,
    pesoDevolvido: resolvePesoDevolvido(anomalia, nfItem, quantidade),
    motivoItem: buildMotivoItem(anomalia),
    observacao: buildObservacaoItem(anomalia),
  };
}

function mapNotaFiscalItensToDevolucaoItens(
  itensNota: RavexNotaFiscalItem[],
  anomaliaBase: RavexAnomaliaViagem,
): CriarDevolucaoItemInput[] {
  const itens: CriarDevolucaoItemInput[] = [];

  for (const nfItem of itensNota) {
    const codigoProduto =
      nfItem.produto?.codigo?.trim() ||
      nfItem.referenciaItem?.trim() ||
      null;
    const quantidade = nfItem.quantidade ?? 0;

    if (!codigoProduto || quantidade <= 0) {
      continue;
    }

    itens.push({
      codigoProduto,
      sku: codigoProduto,
      descricaoProduto: resolveDescricaoProduto(nfItem),
      dataFabricacao: resolveDataFabricacao(nfItem),
      quantidade,
      unidadeMedida: resolveUnidadeMedida(nfItem),
      quantidadeNormalizadaUnidades: quantidade,
      pesoDevolvido: resolvePesoDevolvido(anomaliaBase, nfItem, quantidade),
      motivoItem: buildMotivoItem(anomaliaBase),
      observacao: buildObservacaoItem(anomaliaBase),
    });
  }

  return itens;
}

function resolveNumeroNf(anomalia: RavexAnomaliaViagem): string {
  const numeroNotaFiscal = anomalia.numeroNotaFiscal?.trim();

  if (numeroNotaFiscal) {
    return numeroNotaFiscal;
  }

  if (anomalia.notaFiscalId != null) {
    return String(anomalia.notaFiscalId);
  }

  return 'SEM-NF';
}

export function mapAnomaliasToNotasFiscais(
  anomalias: RavexAnomaliaViagem[],
  itensPorNotaFiscal: Map<number, RavexNotaFiscalItem[]>,
  transporteId: string | null,
  destinatarioPorNfId: Map<number, RavexEntregaDestinatario> = new Map(),
): CriarDevolucaoNotaFiscalInput[] {
  const groups = new Map<
    NotaFiscalGroupKey,
    {
      anomaliaBase: RavexAnomaliaViagem;
      anomalias: RavexAnomaliaViagem[];
    }
  >();

  for (const anomalia of anomalias) {
    if (anomalia.notaFiscalId == null) {
      continue;
    }

    const key = buildNotaFiscalGroupKey(anomalia);
    const existing = groups.get(key);

    if (existing) {
      existing.anomalias.push(anomalia);
      continue;
    }

    groups.set(key, {
      anomaliaBase: anomalia,
      anomalias: [anomalia],
    });
  }

  return Array.from(groups.values()).flatMap(({ anomaliaBase, anomalias: anomaliasGrupo }) => {
      const notaFiscalId = anomaliaBase.notaFiscalId!;
      const itensNota = itensPorNotaFiscal.get(notaFiscalId) ?? [];
      const tipo = mapTipoRetornoRavex(anomaliaBase.tipoRetorno);

      let itens = anomaliasGrupo
        .map((anomalia) => mapAnomaliaToItem(anomalia, itensNota))
        .filter((item): item is CriarDevolucaoItemInput => item != null);

      if (itens.length === 0 && tipo === 'devolucao_total') {
        itens = mapNotaFiscalItensToDevolucaoItens(itensNota, anomaliaBase);
      }

      if (itens.length === 0 && tipo === 'devolucao_total') {
        const numeroNf = resolveNumeroNf(anomaliaBase);
        itens = [
          {
            sku: `NF-${numeroNf}`,
            quantidade: 1,
            unidadeMedida: 'UN',
            quantidadeNormalizadaUnidades: 1,
            motivoItem: buildMotivoItem(anomaliaBase),
            observacao: `Devolução total sem itens disponíveis na Ravex — NF ${numeroNf}`,
          },
        ];
      }

      if (itens.length === 0) {
        return [];
      }

      const nota: CriarDevolucaoNotaFiscalInput = {
        numeroNf: resolveNumeroNf(anomaliaBase),
        tipo,
        motivo:
          anomaliaBase.motivo?.descricao?.trim() ||
          anomaliaBase.observacaoAnomalia?.trim() ||
          anomaliaBase.observacao?.trim() ||
          'Devolução registrada na viagem Ravex',
        observacao:
          [
            anomaliaBase.numeroNotaFiscal?.trim()
              ? `NF ${anomaliaBase.numeroNotaFiscal.trim()}`
              : null,
            anomaliaBase.observacaoAnomalia?.trim() ??
              anomaliaBase.observacao?.trim(),
          ]
            .filter(Boolean)
            .join(' — ') || null,
        transporteId,
        ...resolveDestinatarioFields(notaFiscalId, destinatarioPorNfId),
        itens,
      };

      return [nota];
    });
}

export function collectNotaFiscalIds(anomalias: RavexAnomaliaViagem[]): number[] {
  return [
    ...new Set(
      anomalias
        .map((anomalia) => anomalia.notaFiscalId)
        .filter((notaFiscalId): notaFiscalId is number => notaFiscalId != null),
    ),
  ];
}

export function enrichNotasFiscaisComProdutos(
  notasFiscais: CriarDevolucaoNotaFiscalInput[],
  produtoPorCodigo: Map<string, { produtoId: string; sku: string } | null>,
): CriarDevolucaoNotaFiscalInput[] {
  return notasFiscais.map((nota) => ({
    ...nota,
    itens: nota.itens.map((item) => {
      const codigo = item.codigoProduto ?? item.sku;
      const produto = produtoPorCodigo.get(codigo) ?? null;

      return {
        ...item,
        produtoId: produto?.produtoId ?? null,
        sku: produto?.sku ?? item.sku,
      };
    }),
  }));
}

function resolveQuantidadeNormalizadaUnidades(
  item: CriarDevolucaoItemInput,
  produto: ProdutoRecord | null,
): number {
  if (!isUnidadeCaixa(item.unidadeMedida)) {
    return item.quantidade;
  }

  if (!produto?.unidadesPorCaixa) {
    return item.quantidade;
  }

  return normalizarQuantidadeRemessaItem(
    item.quantidade,
    item.unidadeMedida,
    produto,
  );
}

function resolvePesoDevolvidoNormalizado(
  item: CriarDevolucaoItemInput,
  produto: ProdutoRecord | null,
  quantidadeNormalizadaUnidades: number,
): number | null {
  if (!produto || quantidadeNormalizadaUnidades <= 0) {
    return item.pesoDevolvido ?? null;
  }

  const pesoPorUnidade = resolverPesoPorUnidadeProduto({
    unidadesPorCaixa: produto.unidadesPorCaixa,
    caixasPorPalete: produto.caixasPorPalete,
    pesoBrutoUnidade: produto.pesoBrutoUnidade,
    pesoBrutoCaixa: produto.pesoBrutoCaixa,
    pesoBrutoPalete: produto.pesoBrutoPalete,
    pesoLiquidoUnidade: produto.pesoLiquidoUnidade,
    pesoLiquidoCaixa: produto.pesoLiquidoCaixa,
    pesoLiquidoPalete: produto.pesoLiquidoPalete,
  });

  if (pesoPorUnidade == null) {
    return item.pesoDevolvido ?? null;
  }

  return (
    Math.round(pesoPorUnidade * quantidadeNormalizadaUnidades * 1000) / 1000
  );
}

function normalizarItemDevolucao(
  item: CriarDevolucaoItemInput,
  produto: ProdutoRecord | null,
): CriarDevolucaoItemInput {
  const quantidadeNormalizadaUnidades = resolveQuantidadeNormalizadaUnidades(
    item,
    produto,
  );

  return {
    ...item,
    quantidadeNormalizadaUnidades,
    pesoDevolvido: resolvePesoDevolvidoNormalizado(
      item,
      produto,
      quantidadeNormalizadaUnidades,
    ),
  };
}

export function normalizarQuantidadesNotasFiscais(
  notasFiscais: CriarDevolucaoNotaFiscalInput[],
  produtoPorCodigo: Map<string, ProdutoRecord | null>,
): CriarDevolucaoNotaFiscalInput[] {
  return notasFiscais.map((nota) => ({
    ...nota,
    itens: nota.itens.map((item) => {
      const codigo = item.codigoProduto ?? item.sku;
      const produto = produtoPorCodigo.get(codigo) ?? null;

      return normalizarItemDevolucao(item, produto);
    }),
  }));
}
