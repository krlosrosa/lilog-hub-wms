'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { EtiquetaCompacta } from '@/features/peso-variavel/components/etiqueta-compact';
import { QrCodePreview } from '@/features/peso-variavel/components/qr-code-preview';
import type { EtiquetaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

const PRINT_STYLE_ID = 'peso-variavel-print-styles';

const PRINT_STYLE_BASE = `
  @media screen {
    #peso-variavel-print-root {
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
    body > *:not(#peso-variavel-print-root) {
      display: none !important;
    }

    #peso-variavel-print-root {
      display: block !important;
      position: static !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      clip: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    #peso-variavel-print-root * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

const PRINT_STYLE_NORMAL = `
  ${PRINT_STYLE_BASE}

  @media print {
    @page {
      margin: 8mm;
      size: auto;
    }

    .peso-variavel-print-page {
      break-after: page;
      page-break-after: always;
      width: 100%;
      box-sizing: border-box;
    }

    .peso-variavel-print-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`;

const PRINT_STYLE_ZEBRA = `
  ${PRINT_STYLE_BASE}

  @media print {
    @page {
      size: 100mm 150mm;
      margin: 2mm;
    }

    .peso-variavel-zebra-page {
      break-after: page;
      page-break-after: always;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .peso-variavel-zebra-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`;

export type EtiquetasPrintVariante = 'normal' | 'zebra';

export type EtiquetasPrintAreaProps = {
  etiquetas: EtiquetaSeparacao[];
  variante?: EtiquetasPrintVariante;
};

function PrintStyles({ css }: { css: string }) {
  useEffect(() => {
    document.getElementById(PRINT_STYLE_ID)?.remove();

    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [css]);

  return null;
}

function EtiquetaZebraPage({ etiqueta }: { etiqueta: EtiquetaSeparacao }) {
  const caixaLabel = `${etiqueta.numeroCaixa}/${etiqueta.totalCaixas}`;

  return (
    <div
      className="peso-variavel-zebra-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '146mm',
        padding: '4mm',
        boxSizing: 'border-box',
        color: '#000',
        background: '#fff',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flex: 1, gap: '4mm', alignItems: 'flex-start' }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '2mm',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {etiqueta.remessa}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {etiqueta.nomeCliente}
          </p>
          <p
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: '3mm',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: 1.3,
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {etiqueta.cliente}
            </span>
            <span style={{ flexShrink: 0, fontSize: '12px', opacity: 0.7 }}>
              {caixaLabel}
            </span>
          </p>
        </div>

        <QrCodePreview
          value={etiqueta.codigo}
          qrSize={96}
          className="h-24 w-24 shrink-0 border-black"
          title={`QR code da etiqueta ${etiqueta.codigo}`}
        />
      </div>

      <p
        style={{
          margin: 0,
          marginTop: '4mm',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          opacity: 0.7,
          wordBreak: 'break-all',
        }}
      >
        {etiqueta.codigo}
      </p>
    </div>
  );
}

export function EtiquetasPrintArea({
  etiquetas,
  variante = 'normal',
}: EtiquetasPrintAreaProps) {
  if (etiquetas.length === 0 || typeof document === 'undefined') {
    return null;
  }

  const printCss = variante === 'zebra' ? PRINT_STYLE_ZEBRA : PRINT_STYLE_NORMAL;

  return createPortal(
    <>
      <PrintStyles css={printCss} />
      <div id="peso-variavel-print-root" aria-hidden>
        {variante === 'zebra' ? (
          etiquetas.map((etiqueta) => (
            <EtiquetaZebraPage key={etiqueta.codigo} etiqueta={etiqueta} />
          ))
        ) : (
          etiquetas.map((etiqueta) => (
            <div key={etiqueta.codigo} className="peso-variavel-print-page">
              <EtiquetaCompacta etiqueta={etiqueta} variant="print" />
            </div>
          ))
        )}
      </div>
    </>,
    document.body,
  );
}
