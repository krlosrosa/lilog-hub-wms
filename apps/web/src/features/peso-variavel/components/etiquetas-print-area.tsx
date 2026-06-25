'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { EtiquetaCompacta } from '@/features/peso-variavel/components/etiqueta-compact';
import type { EtiquetaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

const PRINT_STYLE_ID = 'peso-variavel-print-styles';

const PRINT_STYLE = `
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
    @page {
      margin: 8mm;
      size: auto;
    }

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

export type EtiquetasPrintAreaProps = {
  etiquetas: EtiquetaSeparacao[];
};

function PrintStyles() {
  useEffect(() => {
    if (document.getElementById(PRINT_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = PRINT_STYLE;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
}

export function EtiquetasPrintArea({ etiquetas }: EtiquetasPrintAreaProps) {
  if (etiquetas.length === 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <PrintStyles />
      <div id="peso-variavel-print-root" aria-hidden>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {etiquetas.map((etiqueta) => (
            <EtiquetaCompacta
              key={etiqueta.codigo}
              etiqueta={etiqueta}
              variant="print"
            />
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}
