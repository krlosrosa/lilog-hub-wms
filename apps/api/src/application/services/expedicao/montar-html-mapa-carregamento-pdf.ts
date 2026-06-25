import {
  QR_CODE_VARIAVEL,
  aplicarVariaveisCabecalhoMapa,
  montarHtmlTabelaClientes,
  montarHtmlTabelaEmpresa,
  type OpcoesTabelasCarregamento,
} from '@lilog/contracts';
import QRCode from 'qrcode';

import type { MinutaCarregamento } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { ConfiguracaoImpressaoConteudo } from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import type { MinutaImpressaoCarregamento } from './resolver-minutas-impressao-carregamento.js';
import {
  ESTILOS_DOCUMENTO,
  formatarHorarioImpressaoPtBr,
  type MetadadosImpressaoPdf,
} from './montar-html-mapa-separacao-pdf.js';

type QrCodeConfig = ConfiguracaoImpressaoConteudo['qrCodeMapa']['carregamento'];

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function gerarQrDataUri(valor: string, tamanho: number): Promise<string> {
  return QRCode.toDataURL(valor, {
    width: tamanho,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

function montarImgQr(dataUri: string, tamanho: number): string {
  return `<img src="${dataUri}" width="${tamanho}" height="${tamanho}" alt="QR Code" style="display:block;" />`;
}

function montarQrCantoHtml(
  posicao: Exclude<QrCodeConfig['posicao'], 'no_html'>,
  qrDataUri: string,
  tamanho: number,
): string {
  return `<div class="qr-canto qr-${posicao}">${montarImgQr(qrDataUri, tamanho)}</div>`;
}

function montarRodapeHtml(
  entrada: MinutaImpressaoCarregamento,
  metadados: MetadadosImpressaoPdf,
): string {
  const rota = escapeHtml(entrada.minuta.cabecalho.transporte);
  const horario = formatarHorarioImpressaoPtBr(metadados.horarioImpressao);
  const impressoPor = escapeHtml(metadados.impressoPor);

  return `<footer class="mapa-rodape">${rota} · Minuta de carregamento · Impresso em ${horario} · por ${impressoPor}</footer>`;
}

async function montarCabecalhoComQr(
  templateHtml: string,
  minuta: MinutaCarregamento,
  sequencia: number,
  qrConfig: QrCodeConfig,
  qrDataUri: string,
): Promise<string> {
  const qrNoHtml = qrConfig.posicao === 'no_html';
  const imgQr = montarImgQr(qrDataUri, qrConfig.tamanho);

  let cabecalhoHtml = aplicarVariaveisCabecalhoMapa(
    templateHtml,
    minuta.cabecalho,
    { sequencia },
    { preservarQrCode: qrNoHtml },
  );

  if (qrNoHtml && templateHtml.includes(QR_CODE_VARIAVEL)) {
    cabecalhoHtml = cabecalhoHtml.replaceAll(QR_CODE_VARIAVEL, imgQr);
  }

  return cabecalhoHtml;
}

function montarTabelasHtml(
  minuta: MinutaCarregamento,
  opcoes: OpcoesTabelasCarregamento,
): string {
  const partes: string[] = [];

  if (opcoes.exibirTabelaEmpresa && minuta.tabelaEmpresa.length > 0) {
    partes.push(
      montarHtmlTabelaEmpresa(minuta.tabelaEmpresa, opcoes.ordemTabelaEmpresa),
    );
  }

  if (opcoes.exibirTabelaClientes && minuta.tabelaClientes.length > 0) {
    partes.push(
      montarHtmlTabelaClientes(
        minuta.tabelaClientes,
        opcoes.ordemTabelaClientes,
      ),
    );
  }

  return partes.join('');
}

async function montarPaginaMinuta(
  templateHtml: string,
  entrada: MinutaImpressaoCarregamento,
  opcoes: OpcoesTabelasCarregamento,
  qrConfig: QrCodeConfig,
  metadados: MetadadosImpressaoPdf,
): Promise<string> {
  const qrDataUri = await gerarQrDataUri(
    entrada.minuta.cabecalho.microUuid,
    qrConfig.tamanho,
  );

  const cabecalhoHtml = await montarCabecalhoComQr(
    templateHtml,
    entrada.minuta,
    entrada.sequencia,
    qrConfig,
    qrDataUri,
  );

  const tabelasHtml = montarTabelasHtml(entrada.minuta, opcoes);

  const qrCantoHtml =
    qrConfig.posicao !== 'no_html'
      ? montarQrCantoHtml(qrConfig.posicao, qrDataUri, qrConfig.tamanho)
      : '';

  const rodapeHtml = montarRodapeHtml(entrada, metadados);

  return `<section class="mapa-page"><div class="mapa-conteudo">${qrCantoHtml}<div class="mapa-cabecalho">${cabecalhoHtml}</div>${tabelasHtml}${rodapeHtml}</div></section>`;
}

export async function montarHtmlMapaCarregamentoPdf(input: {
  minutas: MinutaImpressaoCarregamento[];
  templateHtml: string;
  opcoesTabelas: OpcoesTabelasCarregamento;
  qrConfig: QrCodeConfig;
  metadados: MetadadosImpressaoPdf;
}): Promise<string> {
  const paginas = await Promise.all(
    input.minutas.map((entrada) =>
      montarPaginaMinuta(
        input.templateHtml,
        entrada,
        input.opcoesTabelas,
        input.qrConfig,
        input.metadados,
      ),
    ),
  );

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${ESTILOS_DOCUMENTO}</style></head><body>${paginas.join('')}</body></html>`;
}

export { ESTILOS_DOCUMENTO };
