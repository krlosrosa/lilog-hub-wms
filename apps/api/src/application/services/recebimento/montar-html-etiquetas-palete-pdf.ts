import QRCode from 'qrcode';

import { EtiquetaPaleteGeradaSchema } from '../../dtos/recebimento/etiqueta-armazenagem.dto.js';
import type { z } from 'zod';

type EtiquetaPaleteGerada = z.infer<typeof EtiquetaPaleteGeradaSchema>;

const ETIQUETAS_POR_PAGINA = 4;
const QR_SIZE = 96;

const ESTILOS_DOCUMENTO = `
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
.etiquetas-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  page-break-after: always;
  min-height: 250mm;
}
.etiquetas-page:last-child { page-break-after: auto; }
.etiqueta-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #111;
  border-radius: 4px;
  padding: 12px;
  aspect-ratio: 210 / 148;
  break-inside: avoid;
}
.etiqueta-header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
.etiqueta-qr {
  margin: 8px 0;
  padding: 8px;
  background: #fff;
  border-radius: 2px;
}
.etiqueta-body {
  width: 100%;
  text-align: center;
}
.etiqueta-codigo {
  font-family: monospace;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}
.etiqueta-sku {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.etiqueta-descricao {
  font-size: 10px;
  line-height: 1.2;
  color: #555;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.etiqueta-quantidade {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 2px;
}
.etiqueta-lote {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}
.etiqueta-endereco {
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  margin: 4px 0 0;
}
`;

const formatadorQuantidade = new Intl.NumberFormat('pt-BR');

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatQuantidade(quantidade: number, unidadeMedida: string): string {
  return `${formatadorQuantidade.format(quantidade)} ${escapeHtml(unidadeMedida)}`;
}

async function gerarQrDataUri(valor: string): Promise<string> {
  return QRCode.toDataURL(valor, {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

async function montarCardEtiqueta(etiqueta: EtiquetaPaleteGerada): Promise<string> {
  const qrDataUri = await gerarQrDataUri(etiqueta.codigo);

  const loteHtml = etiqueta.lote
    ? `<p class="etiqueta-lote">Lote: ${escapeHtml(etiqueta.lote)}</p>`
    : '';

  const enderecoHtml = etiqueta.enderecoSugeridoLabel
    ? `<p class="etiqueta-endereco">Endereço: ${escapeHtml(etiqueta.enderecoSugeridoLabel)}</p>`
    : '';

  return `<article class="etiqueta-card">
  <div class="etiqueta-header">
    <span>FranchiseOS WMS</span>
    <span>#${escapeHtml(etiqueta.numeroRecebimento)}</span>
  </div>
  <div class="etiqueta-qr">
    <img src="${qrDataUri}" width="${QR_SIZE}" height="${QR_SIZE}" alt="QR Code" style="display:block;" />
  </div>
  <div class="etiqueta-body">
    <p class="etiqueta-codigo">${escapeHtml(etiqueta.codigo)}</p>
    <p class="etiqueta-sku">${escapeHtml(etiqueta.sku)}</p>
    <p class="etiqueta-descricao">${escapeHtml(etiqueta.descricao)}</p>
    <p class="etiqueta-quantidade">${formatQuantidade(etiqueta.quantidade, etiqueta.unidadeMedida)}</p>
    ${loteHtml}
    ${enderecoHtml}
  </div>
</article>`;
}

function agruparEmPaginas(etiquetas: EtiquetaPaleteGerada[]): EtiquetaPaleteGerada[][] {
  const paginas: EtiquetaPaleteGerada[][] = [];

  for (let i = 0; i < etiquetas.length; i += ETIQUETAS_POR_PAGINA) {
    paginas.push(etiquetas.slice(i, i + ETIQUETAS_POR_PAGINA));
  }

  return paginas;
}

export async function montarHtmlEtiquetasPaletePdf(
  etiquetas: EtiquetaPaleteGerada[],
): Promise<string> {
  const paginas = agruparEmPaginas(etiquetas);

  const paginasHtml = await Promise.all(
    paginas.map(async (grupo) => {
      const cards = await Promise.all(grupo.map((etiqueta) => montarCardEtiqueta(etiqueta)));
      return `<section class="etiquetas-page">${cards.join('')}</section>`;
    }),
  );

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${ESTILOS_DOCUMENTO}</style></head><body>${paginasHtml.join('')}</body></html>`;
}
