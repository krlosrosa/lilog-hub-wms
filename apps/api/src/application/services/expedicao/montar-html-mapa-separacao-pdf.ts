import {

  QR_CODE_VARIAVEL,

  aplicarVariaveisCabecalhoMapa,

  montarHtmlTabelaItens,

  type OrdemImpressaoItem,

} from '@lilog/contracts';

import QRCode from 'qrcode';



import type { GerarMapasResponse } from '../../dtos/expedicao/gerar-mapas.dto.js';

import type { ConfiguracaoImpressaoConteudo } from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';

import type { GrupoImpressaoMapa } from './resolver-grupos-impressao-mapa.js';



type QrCodeConfig = ConfiguracaoImpressaoConteudo['qrCodeMapa']['separacao'];



export type MetadadosImpressaoPdf = {

  horarioImpressao: Date;

  impressoPor: string;

};



export const ESTILOS_DOCUMENTO = `

@page { size: A4; margin: 12mm; }

* { box-sizing: border-box; }

body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #222; }

.mapa-page { page-break-after: always; position: relative; min-height: 250mm; }

.mapa-page:last-child { page-break-after: auto; }

.mapa-conteudo { position: relative; padding-bottom: 16px; }

.mapa-rodape {

  position: absolute;

  bottom: 0;

  left: 0;

  right: 0;

  border-top: 1px solid #ccc;

  padding-top: 4px;

  font-size: 9px;

  color: #666;

}

.qr-canto { position: absolute; z-index: 10; }

.qr-superior_esquerdo { top: 0; left: 0; }

.qr-superior_direito { top: 0; right: 0; }

.qr-inferior_esquerdo { bottom: 0; left: 0; }

.qr-inferior_direito { bottom: 0; right: 0; }

`;



const formatadorHorarioImpressao = new Intl.DateTimeFormat('pt-BR', {

  dateStyle: 'short',

  timeStyle: 'short',

});



export function formatarHorarioImpressaoPtBr(date: Date): string {

  return formatadorHorarioImpressao.format(date);

}



function escapeHtml(value: string): string {

  return value

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;');

}



function montarRodapeHtml(

  entrada: GrupoImpressaoMapa,

  metadados: MetadadosImpressaoPdf,

): string {

  const rota = escapeHtml(entrada.grupo.cabecalho.transporte);

  const paginacao = `Página ${entrada.paginaTransporte}/${entrada.totalPaginasTransporte}`;

  const horario = formatarHorarioImpressaoPtBr(metadados.horarioImpressao);

  const impressoPor = escapeHtml(metadados.impressoPor);



  return `<footer class="mapa-rodape">${rota} · ${paginacao} · Impresso em ${horario} · por ${impressoPor}</footer>`;

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



async function montarCabecalhoComQr(

  templateHtml: string,

  grupo: GerarMapasResponse['grupos'][number],

  sequencia: number,

  qrConfig: QrCodeConfig,

  qrDataUri: string,

): Promise<string> {

  const qrNoHtml = qrConfig.posicao === 'no_html';

  const imgQr = montarImgQr(qrDataUri, qrConfig.tamanho);



  let cabecalhoHtml = aplicarVariaveisCabecalhoMapa(

    templateHtml,

    grupo.cabecalho,

    { sequencia, infoAdicionaisI: grupo.infoAdicionaisI, infoAdicionaisII: grupo.infoAdicionaisII },

    { preservarQrCode: qrNoHtml },

  );



  if (qrNoHtml && templateHtml.includes(QR_CODE_VARIAVEL)) {

    cabecalhoHtml = cabecalhoHtml.replaceAll(QR_CODE_VARIAVEL, imgQr);

  }



  return cabecalhoHtml;

}



function montarQrCantoHtml(

  posicao: Exclude<QrCodeConfig['posicao'], 'no_html'>,

  qrDataUri: string,

  tamanho: number,

): string {

  return `<div class="qr-canto qr-${posicao}">${montarImgQr(qrDataUri, tamanho)}</div>`;

}



async function montarPaginaGrupo(

  templateHtml: string,

  entrada: GrupoImpressaoMapa,

  ordemColunas: OrdemImpressaoItem[],

  qrConfig: QrCodeConfig,

  metadados: MetadadosImpressaoPdf,

): Promise<string> {

  const qrDataUri = await gerarQrDataUri(

    entrada.grupo.cabecalho.microUuid,

    qrConfig.tamanho,

  );



  const cabecalhoHtml = await montarCabecalhoComQr(

    templateHtml,

    entrada.grupo,

    entrada.sequencia,

    qrConfig,

    qrDataUri,

  );



  const tabelaHtml = montarHtmlTabelaItens(entrada.grupo.itens, ordemColunas);



  const qrCantoHtml =

    qrConfig.posicao !== 'no_html'

      ? montarQrCantoHtml(qrConfig.posicao, qrDataUri, qrConfig.tamanho)

      : '';



  const rodapeHtml = montarRodapeHtml(entrada, metadados);



  return `<section class="mapa-page"><div class="mapa-conteudo">${qrCantoHtml}<div class="mapa-cabecalho">${cabecalhoHtml}</div>${tabelaHtml}${rodapeHtml}</div></section>`;

}



export async function montarHtmlMapaSeparacaoPdf(input: {

  grupos: GrupoImpressaoMapa[];

  templateHtml: string;

  ordemColunas: OrdemImpressaoItem[];

  qrConfig: QrCodeConfig;

  metadados: MetadadosImpressaoPdf;

}): Promise<string> {

  const paginas = await Promise.all(

    input.grupos.map((entrada) =>

      montarPaginaGrupo(

        input.templateHtml,

        entrada,

        input.ordemColunas,

        input.qrConfig,

        input.metadados,

      ),

    ),

  );



  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${ESTILOS_DOCUMENTO}</style></head><body>${paginas.join('')}</body></html>`;

}

const MAPA_PAGE_REGEX = /<section class="mapa-page">[\s\S]*?<\/section>/g;

export function combinarDocumentosMapaPdf(htmls: string[]): string {
  const paginas = htmls.flatMap((html) => html.match(MAPA_PAGE_REGEX) ?? []);

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${ESTILOS_DOCUMENTO}</style></head><body>${paginas.join('')}</body></html>`;
}

