import type {
  CarregamentoPayload,
  GerarMapasResponse,
  MinutaCarregamento,
} from '../../dtos/expedicao/gerar-mapas.dto.js';
import { emptyCarregamentoPayload } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { BreakdownQuantidade } from './calcular-breakdown-quantidade.js';
import { calcularBreakdownQuantidade } from './calcular-breakdown-quantidade.js';
import { gerarMicroUuidMapa } from './montar-cabecalho-grupo-mapa.js';
import type {
  RemessaLinhaItemMapa,
  TransporteParaMapa,
} from './montar-grupos-mapa.js';

const SEPARADOR_CLIENTES = ' · ';

type AcumuladorQuantidades = {
  quantidadeUnidade: number;
  quantidadeCaixa: number;
  quantidadePalete: number;
  percentualCaixas: number;
  pesoKg: number;
};

type AcumuladorCliente = AcumuladorQuantidades & {
  codCliente: string;
  cliente: string;
  cidade: string;
  volumeM3: number;
};

function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null || value === '') {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function chaveEmpresa(empresa: string, categoria: string): string {
  return `${empresa}::${categoria}`;
}

function calcularBreakdownItem(
  item: RemessaLinhaItemMapa,
): BreakdownQuantidade | null {
  return calcularBreakdownQuantidade(
    item.quantidadeNormalizadaUnidades,
    item.unidadesPorCaixa,
    item.caixasPorPalete,
    item.pesoBrutoUnidade,
    item.pesoBrutoCaixa,
    item.pesoBrutoPalete,
    item.pesoLiquidoUnidade,
    item.pesoLiquidoCaixa,
    item.pesoLiquidoPalete,
  );
}

function pesoItemComBreakdown(
  item: RemessaLinhaItemMapa,
  breakdown: BreakdownQuantidade | null,
): number {
  if (breakdown) {
    const pesoBreakdown =
      (breakdown.pesoPaletes ?? 0) +
      (breakdown.pesoCaixas ?? 0) +
      (breakdown.pesoUnidades ?? 0);

    if (pesoBreakdown > 0) {
      return pesoBreakdown;
    }
  }

  return item.peso ?? 0;
}

function somarBreakdownNoAcumulador(
  acc: AcumuladorQuantidades,
  breakdown: BreakdownQuantidade | null,
  pesoKg: number,
  caixasPorPalete?: number | null,
): AcumuladorQuantidades {
  let percentualCaixas = acc.percentualCaixas;

  if (breakdown && caixasPorPalete && caixasPorPalete > 0) {
    percentualCaixas += breakdown.caixas / caixasPorPalete;
  }

  return {
    quantidadeUnidade:
      acc.quantidadeUnidade + (breakdown?.unidades ?? 0),
    quantidadeCaixa: acc.quantidadeCaixa + (breakdown?.caixas ?? 0),
    quantidadePalete: acc.quantidadePalete + (breakdown?.paletes ?? 0),
    percentualCaixas,
    pesoKg: roundKg(acc.pesoKg + pesoKg),
  };
}

function finalizarQuantidadePalete(acc: AcumuladorQuantidades): number {
  return acc.quantidadePalete + Math.ceil(acc.percentualCaixas);
}

function criarAcumuladorVazio(): AcumuladorQuantidades {
  return {
    quantidadeUnidade: 0,
    quantidadeCaixa: 0,
    quantidadePalete: 0,
    percentualCaixas: 0,
    pesoKg: 0,
  };
}

function montarCabecalhoMinuta(
  transporte: TransporteParaMapa,
  totais: MinutaCarregamento['totais'],
): GerarMapasResponse['grupos'][number]['cabecalho'] {
  const clientesVistos = new Set<string>();
  const clientes: Array<{ cod: string; nome: string }> = [];

  transporte.remessas.forEach((remessa) => {
    if (clientesVistos.has(remessa.codCliente)) {
      return;
    }

    clientesVistos.add(remessa.codCliente);
    clientes.push({ cod: remessa.codCliente, nome: remessa.cliente });
  });

  const primeiro = clientes[0] ?? { cod: '', nome: '' };
  const empresas = new Set<string>();

  transporte.remessas.forEach((remessa) => {
    remessa.itens.forEach((item) => {
      empresas.add(item.empresa);
    });
  });

  const empresaResumo =
  [...empresas].sort((a, b) => a.localeCompare(b, 'pt-BR')).join(SEPARADOR_CLIENTES) ||
    '';

  return {
    transporte: transporte.rota,
    placa: transporte.placa,
    transportadora: transporte.transportadora,
    codPrimeiroCliente: primeiro.cod,
    primeiroCliente: primeiro.nome,
    codTodosClientes: clientes.map((c) => c.cod).join(SEPARADOR_CLIENTES),
    todosClientes: clientes.map((c) => c.nome).join(SEPARADOR_CLIENTES),
    pesoTotal: totais.pesoKg,
    totalCaixas: totais.quantidadeCaixa,
    totalUnidades: totais.quantidadeUnidade,
    totalPaletes: totais.quantidadePalete,
    nomeGrupo: `Minuta de Carregamento — ${transporte.rota}`,
    quantidadeLinhas: transporte.remessas.reduce(
      (total, remessa) => total + remessa.itens.length,
      0,
    ),
    categoria: '',
    empresa: empresaResumo,
    microUuid: gerarMicroUuidMapa(transporte.rota),
  };
}

function montarMinutaTransporte(transporte: TransporteParaMapa): MinutaCarregamento {
  const empresaMap = new Map<string, AcumuladorQuantidades & {
    empresa: string;
    categoria: string;
  }>();
  const clientesMap = new Map<string, AcumuladorCliente>();
  let totaisAcc = criarAcumuladorVazio();
  let volumeM3Total = 0;

  transporte.remessas.forEach((remessa) => {
    const pesoRemessa = parseNumeric(remessa.peso);
    const volumeRemessa = parseNumeric(remessa.volume);

    let clienteAcc =
      clientesMap.get(remessa.codCliente) ??
      ({
        codCliente: remessa.codCliente,
        cliente: remessa.cliente,
        cidade: remessa.cidade,
        volumeM3: 0,
        ...criarAcumuladorVazio(),
      } satisfies AcumuladorCliente);

    clienteAcc.volumeM3 = roundKg(clienteAcc.volumeM3 + volumeRemessa);
    clienteAcc.pesoKg = roundKg(clienteAcc.pesoKg + pesoRemessa);
    volumeM3Total = roundKg(volumeM3Total + volumeRemessa);

    remessa.itens.forEach((item) => {
      const breakdown = calcularBreakdownItem(item);
      const pesoKg = pesoItemComBreakdown(item, breakdown);
      const empresaKey = chaveEmpresa(item.empresa, item.categoria);

      const empresaAcc =
        empresaMap.get(empresaKey) ??
        ({
          empresa: item.empresa,
          categoria: item.categoria,
          ...criarAcumuladorVazio(),
        });

      const empresaAtualizado = somarBreakdownNoAcumulador(
        empresaAcc,
        breakdown,
        pesoKg,
        item.caixasPorPalete,
      );
      empresaMap.set(empresaKey, { ...empresaAcc, ...empresaAtualizado });

      const clienteQuantidades = somarBreakdownNoAcumulador(
        clienteAcc,
        breakdown,
        0,
        item.caixasPorPalete,
      );
      clienteAcc = {
        ...clienteAcc,
        ...clienteQuantidades,
      };
      clientesMap.set(remessa.codCliente, clienteAcc);

      totaisAcc = somarBreakdownNoAcumulador(
        totaisAcc,
        breakdown,
        pesoKg,
        item.caixasPorPalete,
      );
    });

    if (remessa.itens.length === 0) {
      totaisAcc.pesoKg = roundKg(totaisAcc.pesoKg + pesoRemessa);
    }

    clientesMap.set(remessa.codCliente, clienteAcc);
  });

  const tabelaEmpresa = [...empresaMap.values()]
    .sort((a, b) => {
      const byEmpresa = a.empresa.localeCompare(b.empresa, 'pt-BR');
      if (byEmpresa !== 0) {
        return byEmpresa;
      }

      return a.categoria.localeCompare(b.categoria, 'pt-BR');
    })
    .map((linha) => ({
      empresa: linha.empresa,
      categoria: linha.categoria,
      quantidadeUnidade: linha.quantidadeUnidade,
      quantidadeCaixa: linha.quantidadeCaixa,
      quantidadePalete: finalizarQuantidadePalete(linha),
      pesoKg: linha.pesoKg,
    }));

  const tabelaClientes = [...clientesMap.values()]
    .sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'))
    .map((linha) => ({
      codCliente: linha.codCliente,
      cliente: linha.cliente,
      cidade: linha.cidade,
      pesoKg: linha.pesoKg,
      volumeM3: linha.volumeM3,
      quantidadeUnidade: linha.quantidadeUnidade,
      quantidadeCaixa: linha.quantidadeCaixa,
      quantidadePalete: finalizarQuantidadePalete(linha),
    }));

  const totais = {
    pesoKg: totaisAcc.pesoKg,
    volumeM3: volumeM3Total,
    quantidadeUnidade: totaisAcc.quantidadeUnidade,
    quantidadeCaixa: totaisAcc.quantidadeCaixa,
    quantidadePalete: finalizarQuantidadePalete(totaisAcc),
  };

  if (tabelaClientes.length > 0 && totais.pesoKg === 0) {
    totais.pesoKg = roundKg(
      tabelaClientes.reduce((acc, linha) => acc + linha.pesoKg, 0),
    );
  }

  return {
    transporteId: transporte.id,
    cabecalho: montarCabecalhoMinuta(transporte, totais),
    tabelaEmpresa,
    tabelaClientes,
    totais,
  };
}

export function montarMinutaCarregamento(
  transportes: TransporteParaMapa[],
): CarregamentoPayload {
  if (transportes.length === 0) {
    return emptyCarregamentoPayload();
  }

  const minutas = transportes.map(montarMinutaTransporte);

  return {
    totalMinutas: minutas.length,
    minutas,
  };
}
