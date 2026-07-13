'use client';

import { parseFabricacaoFromLote } from '@lilog/contracts';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';
import type { DadosRecebimentoImpressao } from '@/features/cnc/hooks/use-cnc-print';
import type { CncDetalhe, CncItem } from '@/features/cnc/types/cnc.schema';
import { CNC_SUBTIPO_LABELS } from '@/features/cnc/types/cnc.schema';
import type { CncImpressaoOpcoes } from '@/features/cnc/types/cnc-impressao.schema';
import type {
  FotoEvidencia,
  InspecaoTermica,
} from '@/features/recebimento/types/recebimento-detalhe.schema';

const PRINT_STYLE_ID = 'cnc-print-styles';
const PRINT_ROOT_ID = 'cnc-print-root';
const HEADER_BLUE = '#1a3f7a';
const FONT = 'Arial, Helvetica, sans-serif';
const BORDER = '1px solid #000';
const FOTOS_POR_PAGINA_EXTRA = 10;
const LINHAS_VAZIAS_PRODUTO = 10;

const PRODUTO_COLUNAS_BASE = [
  { header: 'Motivo', width: '5%' },
  { header: 'Código', width: '11%' },
  { header: 'Descrição do Produto (SAP/R3)', width: '34%' },
  { header: 'SIF', width: '6%' },
  { header: 'Fabricação', width: '10%' },
  { header: 'Vencimento', width: '10%' },
  { header: 'Lote', width: '9%' },
  { header: 'Quantidade', width: '15%', quantidadeKey: 'CX' as const },
  { header: 'Quantidade', width: '15%', quantidadeKey: 'UN' as const },
] as const;

function buildProdutoColunas(unidadePadrao: 'CX' | 'UN') {
  return PRODUTO_COLUNAS_BASE.filter(
    (coluna) =>
      !('quantidadeKey' in coluna) || coluna.quantidadeKey === unidadePadrao,
  ).map((coluna) =>
    'quantidadeKey' in coluna
      ? { header: 'Quantidade', width: coluna.width }
      : coluna,
  );
}

function formatDiferencaPesoPrint(item: CncItem): string | null {
  const esperado = item.pesoEsperado;
  const recebido = item.pesoRecebido;

  if (esperado === null || recebido === null) {
    return item.quantidadeDivergente !== null
      ? `${item.quantidadeDivergente.toLocaleString('pt-BR', {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })} Kg`
      : null;
  }

  const diff = Math.abs(esperado - recebido);

  if (diff === 0) {
    return '0,000 Kg';
  }

  const sinal = recebido > esperado ? '+' : '-';
  const valor = diff.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return `${sinal}${valor} Kg`;
}

function resolverMotivoCodigoItem(item: CncItem): string {
  if (
    item.subtipoOcorrencia === 'falta' ||
    item.subtipoOcorrencia === 'peso_divergente'
  ) {
    return '88';
  }

  return formatValor(item.causaAvaria ?? undefined);
}

function resolverMotivoLabelItem(item: CncItem): string {
  if (item.subtipoOcorrencia) {
    return CNC_SUBTIPO_LABELS[item.subtipoOcorrencia];
  }

  return item.tipo === 'avaria' ? 'Avaria' : 'Divergência';
}

function formatMotivosItensAtuais(itens: CncItem[]): string {
  if (itens.length === 0) {
    return '';
  }

  const motivosUnicos = [
    ...new Set(itens.map((item) => resolverMotivoLabelItem(item))),
  ];

  return motivosUnicos.join('; ');
}

const PRINT_STYLE_CSS = `
  @media screen {
    #${PRINT_ROOT_ID} {
      position: fixed;
      left: 0;
      top: 0;
      z-index: -9999;
      width: 0;
      height: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }

  @media print {
    body > *:not(#${PRINT_ROOT_ID}) {
      display: none !important;
    }

    #${PRINT_ROOT_ID} {
      display: block !important;
      position: static !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      clip: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
    }

    #${PRINT_ROOT_ID} * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      margin: 8mm 10mm;
      size: A4 portrait;
    }

    .cnc-print-page-break {
      break-before: page;
      page-break-before: always;
    }

    .cnc-print-registro-bloco {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .cnc-print-foto-linha {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .cnc-print-foto-cell {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .cnc-print-foto-cell img {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .cnc-print-fotos-pagina {
      break-after: page;
      page-break-after: always;
    }

    .cnc-print-fotos-pagina:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`;

type CncPrintDocumentProps = {
  cnc: CncDetalhe;
  dadosRecebimento: DadosRecebimentoImpressao | null;
  opcoesImpressao: CncImpressaoOpcoes;
  unidadeNome: string;
  inspecao: InspecaoTermica | null;
  fotosChecklist: FotoEvidencia[];
  fotosPorReferencia: Map<string, FotoEvidencia[]>;
};

function PrintStyles() {
  useEffect(() => {
    document.getElementById(PRINT_STYLE_ID)?.remove();

    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = PRINT_STYLE_CSS;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
}

function formatPrintDate(iso: string | null | undefined) {
  if (!iso) {
    return '';
  }

  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatValor(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function formatSerieCnc(numeroNf: string | null | undefined): string {
  const ano = new Date().getFullYear();
  const nf = formatValor(numeroNf);

  if (!nf) {
    return String(ano);
  }

  const nfSemZeros = nf.replace(/^0+/, '') || '0';
  return `${ano}-${nfSemZeros}`;
}

function primeirosDigitos(
  lote: string | null | undefined,
  tamanho = 4,
): string {
  if (!lote) {
    return '';
  }

  return lote.replace(/\D/g, '').slice(0, tamanho);
}

function somarDiasIso(isoDate: string, dias: number): Date {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dias);
  return date;
}

function resolverLoteItem(item: CncItem): string | null {
  return item.loteRecebido ?? item.loteEsperado ?? null;
}

function resolverFabricacaoDoLote(lote: string | null) {
  if (!lote) {
    return null;
  }

  const parsed = parseFabricacaoFromLote(lote);
  return parsed.ok ? parsed : null;
}

function resolverVencimentoDoLote(
  fabricacaoIsoDate: string | null,
  shelfLifeDias: number | null,
): Date | null {
  if (!fabricacaoIsoDate || shelfLifeDias === null || shelfLifeDias <= 0) {
    return null;
  }

  return somarDiasIso(fabricacaoIsoDate, shelfLifeDias);
}

function coletarTodasFotos(
  fotosChecklist: FotoEvidencia[],
  cnc: CncDetalhe,
  fotosPorReferencia: Map<string, FotoEvidencia[]>,
) {
  const vistas = new Set<string>();
  const fotos: FotoEvidencia[] = [];

  const adicionar = (lista: FotoEvidencia[]) => {
    for (const foto of lista) {
      if (vistas.has(foto.id)) {
        continue;
      }

      vistas.add(foto.id);
      fotos.push(foto);
    }
  };

  adicionar(fotosChecklist);

  for (const item of cnc.itens) {
    adicionar(fotosPorReferencia.get(item.referenciaId) ?? []);
  }

  return fotos;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function origemAvariaChecks(opcoes: CncImpressaoOpcoes) {
  return {
    transferencia: opcoes.origemAvaria === 'transferencia',
    avariaInterna: opcoes.origemAvaria === 'avaria_interna',
    devolucao: opcoes.origemAvaria === 'devolucao',
  };
}

function tipoCargaChecks(opcoes: CncImpressaoOpcoes) {
  return {
    estivada: opcoes.tipoCarga === 'estivada',
    paletizada: opcoes.tipoCarga === 'paletizada',
    paletizadaEstivada: opcoes.tipoCarga === 'paletizada_estivada',
  };
}

function palletAvariadoChecks(opcoes: CncImpressaoOpcoes) {
  return {
    padrao: opcoes.palletAvariado === 'padrao',
    misto: opcoes.palletAvariado === 'misto',
    padraoMisto: opcoes.palletAvariado === 'padrao_misto',
  };
}

function localAvariaChecks(opcoes: CncImpressaoOpcoes) {
  return {
    parteSuperior: opcoes.localAvaria.includes('parte_superior'),
    meio: opcoes.localAvaria.includes('meio'),
    baseInferior: opcoes.localAvaria.includes('base_inferior'),
  };
}

function LactalisLogo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '4px 8px',
      }}
    >
      <svg
        viewBox="0 0 120 32"
        style={{ width: '90px', height: '28px' }}
        aria-label="Lactalis"
      >
        <text
          x="0"
          y="24"
          style={{
            fontFamily: FONT,
            fontSize: '22px',
            fontWeight: 700,
            fill: '#1a3f7a',
            letterSpacing: '1px',
          }}
        >
          LACTALIS
        </text>
      </svg>
    </div>
  );
}

function CncTopHeader({
  numeroNf,
  pageLabel,
}: {
  numeroNf: string | null | undefined;
  pageLabel?: string;
}) {
  const serie = formatSerieCnc(numeroNf);

  return (
    <div style={{ position: 'relative', marginBottom: pageLabel ? '2px' : 0 }}>
      {pageLabel ? (
        <div
          style={{
            position: 'absolute',
            top: '-14px',
            right: 0,
            fontSize: '9px',
          }}
        >
          {pageLabel}
        </div>
      ) : null}

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '22%',
                border: BORDER,
                verticalAlign: 'middle',
                height: '48px',
              }}
            >
              <LactalisLogo />
            </td>
            <td
              style={{
                border: BORDER,
                textAlign: 'center',
                verticalAlign: 'middle',
                fontWeight: 700,
                fontSize: '13px',
                padding: '6px',
              }}
            >
              Comunicado de Não-Conformidade
            </td>
            <td
              style={{
                width: '18%',
                border: BORDER,
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: 0,
              }}
            >
              <div
                style={{
                  borderBottom: BORDER,
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 4px',
                }}
              >
                Série
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 4px',
                }}
              >
                {serie}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionBar({ title }: { title: string }) {
  return (
    <div
      style={{
        background: HEADER_BLUE,
        color: '#fff',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '10px',
        padding: '3px 6px',
        borderLeft: BORDER,
        borderRight: BORDER,
        borderBottom: BORDER,
      }}
    >
      {title}
    </div>
  );
}

function GridCell({
  children,
  colSpan = 1,
  align = 'left',
  minHeight = '22px',
}: {
  children: ReactNode;
  colSpan?: number;
  align?: 'left' | 'center' | 'right';
  minHeight?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        border: BORDER,
        padding: '3px 6px',
        fontSize: '9px',
        verticalAlign: 'middle',
        textAlign: align,
        minHeight,
      }}
    >
      {children}
    </td>
  );
}

function CheckboxCell({
  label,
  checked = false,
}: {
  label: string;
  checked?: boolean;
}) {
  return (
    <>
      {label}
      {checked ? ' *' : ''}
    </>
  );
}

function CncFichaPrincipal({
  cnc,
  dadosRecebimento,
  opcoesImpressao,
  unidadeNome,
  inspecao,
  totalPaginas,
  produtoColunas,
  formatQtdValue,
}: {
  cnc: CncDetalhe;
  dadosRecebimento: DadosRecebimentoImpressao | null;
  opcoesImpressao: CncImpressaoOpcoes;
  unidadeNome: string;
  inspecao: InspecaoTermica | null;
  totalPaginas: number;
  produtoColunas: ReturnType<typeof buildProdutoColunas>;
  formatQtdValue: (value: number | null, unidade?: string | null) => string;
}) {
  const primeiraNf = dadosRecebimento?.nfs[0];
  const origemAvaria = origemAvariaChecks(opcoesImpressao);
  const tipoCarga = tipoCargaChecks(opcoesImpressao);
  const palletAvariado = palletAvariadoChecks(opcoesImpressao);
  const localAvaria = localAvariaChecks(opcoesImpressao);
  const motivos = formatMotivosItensAtuais(cnc.itens);
  const lotePrimeiroItem = cnc.itens[0]
    ? resolverLoteItem(cnc.itens[0])
    : null;
  const origem = primeirosDigitos(lotePrimeiroItem) || '—';
  const transporte =
    formatValor(dadosRecebimento?.origemNome ?? undefined) ||
    formatValor(primeiraNf?.fornecedorNome ?? undefined) ||
    '—';
  const numeroNf = formatValor(primeiraNf?.numeroNf ?? undefined) || '—';

  return (
    <div style={{ fontFamily: FONT, color: '#000', background: '#fff' }}>
      <CncTopHeader
        numeroNf={primeiraNf?.numeroNf}
        pageLabel={`Página 1 de ${totalPaginas}`}
      />

      <SectionBar title="Descrição" />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>
            <GridCell colSpan={2}>
              <strong>De:</strong> {unidadeNome}
            </GridCell>
            <GridCell colSpan={2}>
              <strong>Para:</strong> Garantia da Qualidade Logística
            </GridCell>
          </tr>
          <tr>
            <GridCell>
              <strong>Data:</strong> {formatPrintDate(cnc.createdAt)}
            </GridCell>
            <GridCell>
              <strong>Origem:</strong> {origem}
            </GridCell>
            <GridCell>
              <strong>Recebimento:</strong> {unidadeNome}
            </GridCell>
            <GridCell>
              <strong>Placa:</strong>{' '}
              {formatValor(dadosRecebimento?.placa ?? undefined) || '—'}
            </GridCell>
          </tr>
          <tr>
            <GridCell colSpan={2}>
              <strong>Transportadora:</strong>{' '}
              {formatValor(dadosRecebimento?.transportadora ?? undefined) || '—'}
            </GridCell>
            <GridCell>
              <strong>Transporte:</strong> {transporte}
            </GridCell>
            <GridCell>
              <strong>NF:</strong> {numeroNf}
            </GridCell>
          </tr>
        </tbody>
      </table>

      <SectionBar title="Detalhes das Avarias" />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>
            <GridCell>
              <strong>Origem da Avaria:</strong>
            </GridCell>
            <GridCell>
              <CheckboxCell label="Transferência" checked={origemAvaria.transferencia} />
            </GridCell>
            <GridCell>
              <CheckboxCell
                label="Avaria Interna"
                checked={origemAvaria.avariaInterna}
              />
            </GridCell>
            <GridCell>
              <CheckboxCell label="Devolução" checked={origemAvaria.devolucao} />
            </GridCell>
          </tr>
          <tr>
            <GridCell>
              <strong>Tipo de carga:</strong>
            </GridCell>
            <GridCell>
              <CheckboxCell label="Carga Estivada" checked={tipoCarga.estivada} />
            </GridCell>
            <GridCell>
              <CheckboxCell label="Carga Paletizada" checked={tipoCarga.paletizada} />
            </GridCell>
            <GridCell>
              <CheckboxCell
                label="Paletizada e Estivada"
                checked={tipoCarga.paletizadaEstivada}
              />
            </GridCell>
          </tr>
          <tr>
            <GridCell>
              <strong>Pallet avariado:</strong>
            </GridCell>
            <GridCell>
              <CheckboxCell label="Pallet Padrão" checked={palletAvariado.padrao} />
            </GridCell>
            <GridCell>
              <CheckboxCell label="Pallet Misto" checked={palletAvariado.misto} />
            </GridCell>
            <GridCell>
              <CheckboxCell
                label="Padrão e Misto"
                checked={palletAvariado.padraoMisto}
              />
            </GridCell>
          </tr>
          <tr>
            <GridCell>
              <strong>Local da avaria/pallet:</strong>
            </GridCell>
            <GridCell>
              <CheckboxCell
                label="Parte superior"
                checked={localAvaria.parteSuperior}
              />
            </GridCell>
            <GridCell>
              <CheckboxCell label="Meio" checked={localAvaria.meio} />
            </GridCell>
            <GridCell>
              <CheckboxCell
                label="Base/Inferior"
                checked={localAvaria.baseInferior}
              />
            </GridCell>
          </tr>
          <tr>
            <GridCell colSpan={4}>
              <strong>OBS:</strong>{' '}
              {formatValor(inspecao?.observacoes ?? undefined) || ' '}
            </GridCell>
          </tr>
          <tr>
            <GridCell colSpan={4} minHeight="28px">
              <strong>Motivos:</strong> {motivos || ' '}
            </GridCell>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          marginTop: '-1px',
        }}
      >
        <colgroup>
          {produtoColunas.map((coluna) => (
            <col key={coluna.header} style={{ width: coluna.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {produtoColunas.map((coluna) => (
              <th
                key={coluna.header}
                style={{
                  border: BORDER,
                  background: HEADER_BLUE,
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '4px 3px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {coluna.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cnc.itens.length > 0 ? (
            cnc.itens.map((item) => (
              <ProdutoPrintRow
                key={item.id}
                item={item}
                formatQtdValue={formatQtdValue}
              />
            ))
          ) : (
            <tr>
              <td
                colSpan={produtoColunas.length}
                style={{
                  border: BORDER,
                  height: '22px',
                  fontSize: '9px',
                  textAlign: 'center',
                }}
              >
                —
              </td>
            </tr>
          )}
          {Array.from({ length: LINHAS_VAZIAS_PRODUTO }).map((_, index) => (
            <tr key={`linha-vazia-${index}`}>
              {produtoColunas.map((coluna) => (
                <td
                  key={`vazio-${index}-${coluna.header}`}
                  style={{
                    border: BORDER,
                    height: '20px',
                    fontSize: '9px',
                  }}
                >
                  &nbsp;
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td
              colSpan={produtoColunas.length}
              style={{
                border: BORDER,
                padding: '6px 8px',
                fontSize: '9px',
              }}
            >
              <strong>Assinatura Qualidade Logística:</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ProdutoPrintRow({
  item,
  formatQtdValue,
}: {
  item: CncItem;
  formatQtdValue: (value: number | null, unidade?: string | null) => string;
}) {
  const isPesoDivergente = item.subtipoOcorrencia === 'peso_divergente';
  const lote = resolverLoteItem(item);
  const fabricacaoParsed = resolverFabricacaoDoLote(lote);
  const vencimento = resolverVencimentoDoLote(
    fabricacaoParsed?.isoDate ?? null,
    item.shelfLifeDias,
  );
  const motivo = resolverMotivoCodigoItem(item);
  const diferencaPeso = isPesoDivergente
    ? formatDiferencaPesoPrint(item)
    : null;
  const quantidadeDescartada = isPesoDivergente
    ? null
    : item.subtipoOcorrencia === 'falta'
      ? item.quantidadeDivergente
      : item.quantidadeCaixas ??
        (item.tipo === 'avaria' ? item.quantidadeDivergente : null);
  const sif = primeirosDigitos(lote) || '—';

  const cellBase = {
    border: BORDER,
    padding: '3px 4px',
    fontSize: '8px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    height: '20px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  };

  return (
    <tr>
      <td style={cellBase}>{motivo || '—'}</td>
      <td style={cellBase}>{formatValor(item.sku ?? undefined) || '—'}</td>
      <td
        style={{
          ...cellBase,
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }}
      >
        {formatValor(item.descricaoProduto ?? undefined) || '—'}
      </td>
      <td style={cellBase}>{sif}</td>
      <td style={cellBase}>{fabricacaoParsed?.display || '—'}</td>
      <td style={cellBase}>
        {vencimento ? formatPrintDate(vencimento.toISOString()) : '—'}
      </td>
      <td style={cellBase}>{formatValor(lote ?? undefined) || '—'}</td>
      <td style={cellBase}>
        {diferencaPeso ??
          (quantidadeDescartada !== null
            ? formatQtdValue(quantidadeDescartada, item.unidadeMedida)
            : '—')}
      </td>
    </tr>
  );
}

function FotoCelula({
  numero,
  foto,
}: {
  numero: number;
  foto?: FotoEvidencia;
}) {
  return (
    <div
      className="cnc-print-foto-cell"
      style={{
        border: BORDER,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '52mm',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 0',
          borderBottom: BORDER,
          flexShrink: 0,
        }}
      >
        {numero}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          overflow: 'hidden',
        }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.url}
            alt={foto.legenda}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function FotoLinha({
  esquerda,
  direita,
}: {
  esquerda: { numero: number; foto?: FotoEvidencia };
  direita?: { numero: number; foto?: FotoEvidencia };
}) {
  return (
    <div
      className="cnc-print-foto-linha"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        width: '100%',
      }}
    >
      <FotoCelula numero={esquerda.numero} foto={esquerda.foto} />
      {direita ? (
        <FotoCelula numero={direita.numero} foto={direita.foto} />
      ) : (
        <div
          className="cnc-print-foto-cell"
          style={{
            border: BORDER,
            height: '52mm',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}

function FotosGrid({
  fotos,
  offsetNumero = 1,
}: {
  fotos: FotoEvidencia[];
  offsetNumero?: number;
}) {
  const pares = chunkArray(fotos, 2);

  return (
    <div
      style={{
        width: '100%',
        border: BORDER,
        borderTop: 'none',
      }}
    >
      {pares.map((par, index) => (
        <FotoLinha
          key={`foto-linha-${offsetNumero + index * 2}`}
          esquerda={{ numero: offsetNumero + index * 2, foto: par[0] }}
          direita={
            par[1]
              ? { numero: offsetNumero + index * 2 + 1, foto: par[1] }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function CncRegistroFotograficoInline({
  numeroNf,
  fotos,
}: {
  numeroNf: string | null | undefined;
  fotos: FotoEvidencia[];
}) {
  if (fotos.length === 0) {
    return null;
  }

  return (
    <div
      className="cnc-print-registro-bloco cnc-print-fotos-pagina"
      style={{ marginTop: '8px' }}
    >
      <CncTopHeader numeroNf={numeroNf} />
      <SectionBar title="Registro fotográfico" />
      <FotosGrid fotos={fotos} offsetNumero={1} />
    </div>
  );
}

function CncFotosPaginaExtra({
  fotos,
  offsetNumero,
  pageLabel,
  isLast = false,
}: {
  fotos: FotoEvidencia[];
  offsetNumero: number;
  pageLabel: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`cnc-print-registro-bloco ${isLast ? '' : 'cnc-print-fotos-pagina'}`}
      style={{
        fontFamily: FONT,
        color: '#000',
        background: '#fff',
        position: 'relative',
        breakBefore: 'page',
        pageBreakBefore: 'always',
      }}
    >
      <div
        style={{
          textAlign: 'right',
          fontSize: '9px',
          marginBottom: '4px',
        }}
      >
        {pageLabel}
      </div>

      <FotosGrid fotos={fotos} offsetNumero={offsetNumero} />
    </div>
  );
}

export function CncPrintDocument({
  cnc,
  dadosRecebimento,
  opcoesImpressao,
  unidadeNome,
  inspecao,
  fotosChecklist,
  fotosPorReferencia,
}: CncPrintDocumentProps) {
  const { config, formatQtdValue } = useDisplayConfig();

  if (typeof document === 'undefined') {
    return null;
  }

  const produtoColunas = buildProdutoColunas(config.unidadePadrao);
  const numeroNf = dadosRecebimento?.nfs[0]?.numeroNf;

  const todasFotos = coletarTodasFotos(
    fotosChecklist,
    cnc,
    fotosPorReferencia,
  );

  const fotosPagina1 = todasFotos.slice(0, 2);
  const fotosRestantes = todasFotos.slice(2);
  const paginasExtras = chunkArray(fotosRestantes, FOTOS_POR_PAGINA_EXTRA);
  const totalPaginas = 1 + paginasExtras.length;

  return createPortal(
    <>
      <PrintStyles />
      <div id={PRINT_ROOT_ID} aria-hidden>
        <div style={{ fontFamily: FONT, color: '#000', background: '#fff' }}>
          <CncFichaPrincipal
            cnc={cnc}
            dadosRecebimento={dadosRecebimento}
            opcoesImpressao={opcoesImpressao}
            unidadeNome={unidadeNome}
            inspecao={inspecao}
            totalPaginas={totalPaginas}
            produtoColunas={produtoColunas}
            formatQtdValue={formatQtdValue}
          />
          <CncRegistroFotograficoInline
            numeroNf={numeroNf}
            fotos={fotosPagina1}
          />
        </div>

        {paginasExtras.map((pagina, index) => (
          <CncFotosPaginaExtra
            key={`pagina-fotos-${index}`}
            fotos={pagina}
            offsetNumero={3 + index * FOTOS_POR_PAGINA_EXTRA}
            pageLabel={`Página ${index + 2} de ${totalPaginas}`}
            isLast={index === paginasExtras.length - 1}
          />
        ))}
      </div>
    </>,
    document.body,
  );
}
