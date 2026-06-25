import { MOCK_RECEBIMENTOS } from '@/features/recebimento/mocks/recebimentos-mock-data';
import type {
  ProcessoInternoRecebimento,
  RecebimentoDetalhe,
} from '@/features/recebimento/types/recebimento-detalhe.schema';
import type { RecebimentoListaItem } from '@/features/recebimento/types/recebimento-lista.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

/** Entrada principal alinhada ao protótipo (id da lista mock). */
const DETALHE_RCV001: RecebimentoDetalhe = {
  id: 'rcv-001',
  numero: 'RCV-88291',
  dataInicio: '24 out 2023, às 08:45 · Unidade Matriz',
  unidade: 'Unidade Matriz',
  placa: 'BRA2E19',
  transportador: 'TransLog SA',
  documentacaoOk: true,
  status: 'em-transito',
  processoAtual: 'conferindo',
  inspecao: {
    tempBau: -18.4,
    tempProduto: -16.8,
    anomalias: 2,
    anomaliasDescricao: 'Lacre violado (L-09) e avaria lateral',
  },
  fotoTotalInformado: 12,
  fotos: [
    {
      id: 'f1',
      legenda: 'Traseira — Baú',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx25A8O5zHGuBsNxIxMUF7AF-6N4_xqbvI__ljmljY6iadmT_6Mp-87enW-axaTFfHuDgH0yLHnFKGAtJNVOvjyAdd1RTI5vXni-M-TwT-GkEAOlD6wUYGBPkXvWMiH9HXT5JBzxmnPuyw_In8aVkaeLhUXXxuS1PsT6fTbmlAQXvEkHfa7oXMdP_T9DZRZgHJ_0jCEJPRYR82U2xQ2Ipg6NNJloXks0ukodjlxMvPzuYWfKyyUYCCDa2lH9fhe1BqRbEaM2KgAjI',
    },
    {
      id: 'f2',
      legenda: 'Carga — Nível 1',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNN5qyLR5I_4MXSiGnLTT0v3xh3v8o1MkOD8s-C1lB5v8kaJ2ymA0pBxTwZHtC0I3nk4l4_3FO0GbYcfOAGDZaYsNVp33ZEkjfsDj6Gl8ytrSE-5HRTyw86ACp4cnAgAdhv2JzMFILExsGvy5C8PA_rjB8ybP95tqJ02elRmbkYo_VeZJHz2jpkUhuXtVnPsHa76L-8tR_tmI9hk7fuuqhfgYtsKrz7Rjwa-O03ElumMss9zFtozTcp7eOLn-OyiiSWSMkYH4ERuM',
    },
  ],
  fotosAvaria: [],
  conferencia: [
    {
      id: 'c1',
      produtoId: 'prod-cs',
      sku: 'CS',
      produto: 'Cerveja Spaten 350ml',
      lote: '22891-B',
      ean: '7891991010321',
      qtdXml: 1200,
      qtdFisica: 1200,
      status: 'concluido',
      avarias: [],
    },
    {
      id: 'c2',
      produtoId: 'prod-pn',
      sku: 'PN',
      produto: 'Pepsi Black 200ml',
      lote: '44210-C',
      ean: '7891991000889',
      qtdXml: 2400,
      qtdFisica: 2392,
      status: 'faltante',
      avarias: [],
    },
    {
      id: 'c3',
      produtoId: 'prod-gu',
      sku: 'GU',
      produto: 'Guaraná Antarctica 2L',
      lote: '99102-A',
      ean: '7891991202023',
      qtdXml: 600,
      qtdFisica: 600,
      status: 'concluido',
      avarias: [],
    },
    {
      id: 'c4',
      produtoId: 'prod-su',
      sku: 'SU',
      produto: 'Suco do Bem Laranja 1L',
      lote: '10022-X',
      ean: '7891991444119',
      qtdXml: 480,
      qtdFisica: 482,
      status: 'sobra',
      avarias: [],
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `c${5 + i}`,
      produtoId: `prod-m${i + 1}`,
      sku: `M${String(i + 1).padStart(2, '0')}`,
      produto: `Item sintético de apoio ${i + 5}`,
      lote: `${9100 + i}-X`,
      ean: `7891991555${100 + i}`,
      qtdXml: 120 + i * 15,
      qtdFisica: 120 + i * 15,
      status: 'concluido' as const,
      avarias: [],
    })),
  ],
  numDivergencias: 3,
};

export const MOCK_RECEBIMENTO_DETALHES: Record<string, RecebimentoDetalhe> =
  Object.freeze({
    'rcv-001': DETALHE_RCV001,
  });

function numeroFromListaId(listaId: string): string {
  const suf = listaId.replace(/^rcv-/i, '');
  return `RCV-${suf.toUpperCase()}`;
}

function processoPorStatusLista(
  status: RecebimentoStatus,
): ProcessoInternoRecebimento {
  if (status === 'concluido') {
    return 'finalizado';
  }

  if (status === 'agendado') {
    return 'nao-iniciado';
  }

  return 'conferindo';
}

function fmtDataMock(item: RecebimentoListaItem): string {
  return `Previsto para hoje (${item.horario}) · Unidade centro`;
}

export function criarDetalheFallbackFromLista(
  item: RecebimentoListaItem,
): RecebimentoDetalhe {
  return {
    id: item.id,
    numero: numeroFromListaId(item.id),
    dataInicio: fmtDataMock(item),
    unidade: 'Centro de distribuição',
    placa: item.placa,
    transportador: item.transportador,
    documentacaoOk: true,
    status: item.status,
    processoAtual: processoPorStatusLista(item.status),
    inspecao: {
      tempBau: -15,
      tempProduto: -14.2,
      anomalias: 0,
      anomaliasDescricao: 'Nenhuma anomalia registrada',
    },
    fotoTotalInformado: 0,
    fotos: [],
    fotosAvaria: [],
    conferencia: [
      {
        id: `${item.id}-c1`,
        produtoId: `${item.id}-prod-1`,
        sku: 'MOCK',
        produto: `Resumo de volume — ${item.volumeUn} UN`,
        lote: '—',
        ean: '—',
        qtdXml: item.volumeUn,
        qtdFisica: item.volumeUn,
        status: 'concluido',
        avarias: [],
      },
      {
        id: `${item.id}-c2`,
        produtoId: `${item.id}-prod-2`,
        sku: item.empresas[0] ?? 'BR',
        produto: 'Itens vínculos XML (preview)',
        lote: '—',
        ean: '—',
        qtdXml: 0,
        qtdFisica: 0,
        status: 'concluido',
        avarias: [],
      },
    ],
    numDivergencias: 0,
  };
}

export function resolverRecebimentoDetalhe(
  recebimentoId: string,
): RecebimentoDetalhe | undefined {
  const preset = MOCK_RECEBIMENTO_DETALHES[recebimentoId];
  if (preset) {
    return preset;
  }

  const item = MOCK_RECEBIMENTOS.find((r) => r.id === recebimentoId);
  if (!item) {
    return undefined;
  }

  return criarDetalheFallbackFromLista(item);
}
