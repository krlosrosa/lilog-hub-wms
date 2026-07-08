import type { EtiquetaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

/** 100x150mm @ 203 DPI */
const LABEL_WIDTH_DOTS = 800;
const LABEL_HEIGHT_DOTS = 1200;

function sanitizarTextoZpl(valor: string): string {
  return valor
    .replace(/\\/g, '\\5C')
    .replace(/\^/g, '\\5E')
    .replace(/~/g, '\\7E');
}

export function gerarZplEtiqueta(etiqueta: EtiquetaSeparacao): string {
  const remessa = sanitizarTextoZpl(etiqueta.remessa);
  const nomeCliente = sanitizarTextoZpl(etiqueta.nomeCliente);
  const cliente = sanitizarTextoZpl(etiqueta.cliente);
  const caixaLabel = sanitizarTextoZpl(
    `${etiqueta.numeroCaixa}/${etiqueta.totalCaixas}`,
  );
  const codigo = sanitizarTextoZpl(etiqueta.codigo);

  return [
    '^XA',
    `^PW${LABEL_WIDTH_DOTS}`,
    `^LL${LABEL_HEIGHT_DOTS}`,
    '^CI28',
    `^FO40,40^A0N,42,42^FD${remessa}^FS`,
    `^FO40,95^A0N,34,34^FD${nomeCliente}^FS`,
    `^FO40,145^A0N,26,26^FD${cliente}^FS`,
    `^FO40,180^A0N,22,22^FDCaixa ${caixaLabel}^FS`,
    `^FO520,40^BQN,2,6^FDQA,${codigo}^FS`,
    `^FO40,1120^A0N,18,18^FD${codigo}^FS`,
    '^XZ',
  ].join('\n');
}

export function gerarZplEtiquetas(etiquetas: EtiquetaSeparacao[]): string {
  return etiquetas.map((etiqueta) => gerarZplEtiqueta(etiqueta)).join('\n');
}
