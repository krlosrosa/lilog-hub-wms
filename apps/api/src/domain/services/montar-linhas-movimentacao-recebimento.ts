import type {
  MovimentacaoAvariaRecord,
  MovimentacaoConferidoRecord,
  MovimentacaoEsperadoRecord,
} from '../../infra/db/recebimento/get-itens-movimentacao.drizzle.js';

export type LoteMovimentacaoLinha = {
  loteOrigem: string;
  loteDestino: string;
  quantidade: number;
};

export type ConfigMovimentacaoUnidade = {
  displayUnidadePadrao: 'CX' | 'UN';
};

export type MontarLinhasMovimentacaoProdutoInput = {
  produtoId: string;
  sku: string;
  tipo: string;
  unidadesPorCaixa: number;
  pesoBrutoCaixa: number | null;
  conferidosProduto: MovimentacaoConferidoRecord[];
  esperadosProduto: MovimentacaoEsperadoRecord[];
  avarias: MovimentacaoAvariaRecord[];
  config?: ConfigMovimentacaoUnidade;
};

export class MovimentacaoLoteContabilError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MovimentacaoLoteContabilError';
  }
}

export function normalizeLote(lote: string | null | undefined): string {
  return (lote ?? '').trim();
}

function compareValidadeAsc(
  a: Date | null | undefined,
  b: Date | null | undefined,
): number {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  return a.getTime() - b.getTime();
}

function pickValidadeMaisAntiga(
  atual: Date | null | undefined,
  candidata: Date | null | undefined,
): Date | null {
  if (!atual) {
    return candidata ?? null;
  }

  if (!candidata) {
    return atual;
  }

  return candidata.getTime() < atual.getTime() ? candidata : atual;
}

function sortPoolPorValidadeAsc(pool: PoolContabilEntry[]): PoolContabilEntry[] {
  return [...pool].sort((a, b) => {
    const cmp = compareValidadeAsc(a.validadeEsperada, b.validadeEsperada);

    if (cmp !== 0) {
      return cmp;
    }

    return a.lote.localeCompare(b.lote);
  });
}

function toCaixas(
  quantidade: number,
  unidadeMedida: string,
  unidadesPorCaixa: number,
): number {
  if (unidadeMedida === 'CX') {
    return quantidade;
  }

  const upc = unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;
  return quantidade / upc;
}

function calcularAvariaCaixasProduto(
  avarias: MovimentacaoAvariaRecord[],
  produtoId: string,
  unidadesPorCaixa: number,
): number {
  const upc = unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;

  return avarias
    .filter((avaria) => avaria.produtoId === produtoId)
    .reduce(
      (total, avaria) =>
        total +
        avaria.quantidadeCaixas +
        Math.floor(avaria.quantidadeUnidades / upc),
      0,
    );
}

function calcularAvariaPesoKgProduto(
  avarias: MovimentacaoAvariaRecord[],
  produtoId: string,
  unidadesPorCaixa: number,
  pesoBrutoCaixa: number | null,
): number {
  const avariaCaixas = calcularAvariaCaixasProduto(
    avarias,
    produtoId,
    unidadesPorCaixa,
  );

  if (!pesoBrutoCaixa || pesoBrutoCaixa <= 0) {
    return 0;
  }

  return avariaCaixas * pesoBrutoCaixa;
}

export function assertLotesContabeisInformados(
  esperadosProduto: MovimentacaoEsperadoRecord[],
  sku: string,
): void {
  if (esperadosProduto.length === 0) {
    throw new MovimentacaoLoteContabilError(
      `SKU ${sku}: nenhuma linha contábil encontrada no pré-recebimento`,
    );
  }

  const linhasSemLote = esperadosProduto.filter(
    (esperado) => !normalizeLote(esperado.loteEsperado),
  );

  if (linhasSemLote.length > 0) {
    throw new MovimentacaoLoteContabilError(
      `SKU ${sku}: lote contábil (loteEsperado) obrigatório em todas as linhas do pré-recebimento`,
    );
  }
}

export type PoolContabilEntry = {
  lote: string;
  saldo: number;
  validadeEsperada: Date | null;
};

export function buildPoolContabil(
  esperadosProduto: MovimentacaoEsperadoRecord[],
  unidadesPorCaixa: number,
): PoolContabilEntry[] {
  const saldoPorLote = new Map<
    string,
    { saldo: number; validadeEsperada: Date | null }
  >();

  for (const esperado of esperadosProduto) {
    const lote = normalizeLote(esperado.loteEsperado);
    const quantidade = toCaixas(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      unidadesPorCaixa,
    );
    const atual = saldoPorLote.get(lote) ?? {
      saldo: 0,
      validadeEsperada: null,
    };

    saldoPorLote.set(lote, {
      saldo: atual.saldo + quantidade,
      validadeEsperada: pickValidadeMaisAntiga(
        atual.validadeEsperada,
        esperado.validadeEsperada,
      ),
    });
  }

  return sortPoolPorValidadeAsc(
    [...saldoPorLote.entries()].map(([lote, entry]) => ({
      lote,
      saldo: entry.saldo,
      validadeEsperada: entry.validadeEsperada,
    })),
  );
}

export type DemandaFisicaEntry = {
  loteDestino: string;
  quantidade: number;
};

export type BuildDemandaFisicaOptions = {
  arredondarInteiro?: boolean;
};

export function buildDemandaFisica(
  conferidosProduto: MovimentacaoConferidoRecord[],
  movimentarTotal: number,
  unidadesPorCaixa: number,
  getQuantidadeConferido: (item: MovimentacaoConferidoRecord) => number,
  getLoteConferido: (item: MovimentacaoConferidoRecord) => string = (item) =>
    normalizeLote(item.loteRecebido),
  options?: BuildDemandaFisicaOptions,
): DemandaFisicaEntry[] {
  const totalRecebido = conferidosProduto.reduce(
    (total, item) => total + getQuantidadeConferido(item),
    0,
  );

  if (movimentarTotal <= 0 || totalRecebido <= 0) {
    return [];
  }

  const quantidadePorLote = new Map<
    string,
    { quantidade: number; validade: Date | null }
  >();

  for (const item of conferidosProduto) {
    const lote = getLoteConferido(item);
    const quantidade = getQuantidadeConferido(item);

    if (quantidade <= 0) {
      continue;
    }

    const atual = quantidadePorLote.get(lote) ?? {
      quantidade: 0,
      validade: null,
    };

    quantidadePorLote.set(lote, {
      quantidade: atual.quantidade + quantidade,
      validade: pickValidadeMaisAntiga(atual.validade, item.validade),
    });
  }

  const lotesOrdenados = [...quantidadePorLote.entries()].sort((a, b) => {
    const cmp = compareValidadeAsc(a[1].validade, b[1].validade);

    if (cmp !== 0) {
      return cmp;
    }

    return a[0].localeCompare(b[0]);
  });

  const demanda: DemandaFisicaEntry[] = [];
  let remaining = movimentarTotal;

  for (const [loteDestino, { quantidade: quantidadeLote }] of lotesOrdenados) {
    if (remaining <= 0) {
      break;
    }

    let quantidade: number;

    if (options?.arredondarInteiro) {
      quantidade = Math.min(
        Math.round(quantidadeLote),
        Math.round(remaining),
      );
    } else {
      quantidade = Number(Math.min(quantidadeLote, remaining).toFixed(3));
    }

    if (quantidade <= 0) {
      continue;
    }

    demanda.push({ loteDestino, quantidade });
    remaining -= quantidade;
  }

  return demanda;
}

export function alocarMovimentacaoLotes(
  pool: PoolContabilEntry[],
  demandaFisica: DemandaFisicaEntry[],
  sku: string,
): LoteMovimentacaoLinha[] {
  const poolMutavel = pool.map((entry) => ({ ...entry }));
  const linhas: LoteMovimentacaoLinha[] = [];

  for (const { loteDestino, quantidade } of demandaFisica) {
    let remaining = quantidade;

    for (const entry of poolMutavel) {
      if (remaining <= 0) {
        break;
      }

      if (entry.saldo <= 0) {
        continue;
      }

      const alocado = Number(Math.min(remaining, entry.saldo).toFixed(3));

      if (alocado <= 0) {
        continue;
      }

      linhas.push({
        loteOrigem: entry.lote,
        loteDestino,
        quantidade: alocado,
      });

      entry.saldo -= alocado;
      remaining -= alocado;
    }

    if (remaining > 0.0015) {
      throw new MovimentacaoLoteContabilError(
        `SKU ${sku}: saldo contábil insuficiente para cobrir a movimentação do lote físico "${loteDestino}" (faltam ${remaining.toFixed(3)})`,
      );
    }
  }

  return linhas;
}

function buildPoolContabilPeso(
  esperadosProduto: MovimentacaoEsperadoRecord[],
): PoolContabilEntry[] {
  const saldoPorLote = new Map<
    string,
    { saldo: number; validadeEsperada: Date | null }
  >();

  for (const esperado of esperadosProduto) {
    const lote = normalizeLote(esperado.loteEsperado);
    const peso = esperado.pesoEsperado ?? 0;
    const atual = saldoPorLote.get(lote) ?? {
      saldo: 0,
      validadeEsperada: null,
    };

    saldoPorLote.set(lote, {
      saldo: atual.saldo + peso,
      validadeEsperada: pickValidadeMaisAntiga(
        atual.validadeEsperada,
        esperado.validadeEsperada,
      ),
    });
  }

  return sortPoolPorValidadeAsc(
    [...saldoPorLote.entries()].map(([lote, entry]) => ({
      lote,
      saldo: entry.saldo,
      validadeEsperada: entry.validadeEsperada,
    })),
  );
}

function calcularTotalEsperadoCaixas(
  esperadosProduto: MovimentacaoEsperadoRecord[],
  unidadesPorCaixa: number,
): number {
  return esperadosProduto.reduce(
    (total, esperado) =>
      total +
      toCaixas(
        esperado.quantidadeEsperada,
        esperado.unidadeMedida,
        unidadesPorCaixa,
      ),
    0,
  );
}

function calcularTotalEsperadoPeso(
  esperadosProduto: MovimentacaoEsperadoRecord[],
  totalPesoRecebido: number,
): number {
  const totalPesoEsperado = esperadosProduto.reduce(
    (total, esperado) => total + (esperado.pesoEsperado ?? 0),
    0,
  );

  return totalPesoEsperado > 0 ? totalPesoEsperado : totalPesoRecebido;
}

export function montarLinhasMovimentacaoProduto(
  input: MontarLinhasMovimentacaoProdutoInput,
): LoteMovimentacaoLinha[] {
  const {
    produtoId,
    sku,
    tipo,
    unidadesPorCaixa,
    pesoBrutoCaixa,
    conferidosProduto,
    esperadosProduto,
    avarias,
    config,
  } = input;

  if (conferidosProduto.length === 0) {
    return [];
  }

  assertLotesContabeisInformados(esperadosProduto, sku);

  const pesoVariavel = tipo === 'PVAR';

  if (pesoVariavel) {
    const totalPesoRecebido = conferidosProduto.reduce(
      (total, item) => total + (item.pesoRecebido ?? 0),
      0,
    );
    const totalPesoEsperado = calcularTotalEsperadoPeso(
      esperadosProduto,
      totalPesoRecebido,
    );
    const totalAvariaPeso = calcularAvariaPesoKgProduto(
      avarias,
      produtoId,
      unidadesPorCaixa,
      pesoBrutoCaixa,
    );
    const movimentarTotal = Math.max(
      0,
      Math.min(totalPesoRecebido, totalPesoEsperado) - totalAvariaPeso,
    );

    const pool = buildPoolContabilPeso(esperadosProduto);
    const demandaFisica = buildDemandaFisica(
      conferidosProduto,
      movimentarTotal,
      unidadesPorCaixa,
      (item) => item.pesoRecebido ?? 0,
    );

    return alocarMovimentacaoLotes(pool, demandaFisica, sku);
  }

  const totalRecebidoCaixas = conferidosProduto.reduce(
    (total, item) =>
      total +
      toCaixas(
        item.quantidadeRecebida,
        item.unidadeMedida,
        unidadesPorCaixa,
      ),
    0,
  );
  const totalEsperadoCaixas = calcularTotalEsperadoCaixas(
    esperadosProduto,
    unidadesPorCaixa,
  );
  const totalAvariaCaixas = calcularAvariaCaixasProduto(
    avarias,
    produtoId,
    unidadesPorCaixa,
  );
  const movimentarTotal = Math.max(
    0,
    Math.min(totalRecebidoCaixas, totalEsperadoCaixas) - totalAvariaCaixas,
  );

  const usarCaixasInteiras = config?.displayUnidadePadrao === 'CX';
  const movimentarTotalFinal = usarCaixasInteiras
    ? Math.round(movimentarTotal)
    : movimentarTotal;

  const pool = buildPoolContabil(esperadosProduto, unidadesPorCaixa);
  const demandaFisica = buildDemandaFisica(
    conferidosProduto,
    movimentarTotalFinal,
    unidadesPorCaixa,
    (item) =>
      toCaixas(
        item.quantidadeRecebida,
        item.unidadeMedida,
        unidadesPorCaixa,
      ),
    undefined,
    { arredondarInteiro: usarCaixasInteiras },
  );

  return alocarMovimentacaoLotes(pool, demandaFisica, sku);
}
