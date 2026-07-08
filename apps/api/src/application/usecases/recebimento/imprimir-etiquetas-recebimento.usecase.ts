import { BadRequestException, Injectable } from '@nestjs/common';

import type { ImprimirEtiquetasRecebimentoResult } from '../../dtos/recebimento/etiqueta-armazenagem.dto.js';
import { CarregarEtiquetasGeradasRecebimentoService } from '../../services/recebimento/carregar-etiquetas-geradas-recebimento.service.js';
import { montarHtmlEtiquetasPaletePdf } from '../../services/recebimento/montar-html-etiquetas-palete-pdf.js';
import type { EtiquetaPaleteGerada } from './finalizar-recebimento.usecase.js';
import { GerarPdfDeHtmlService } from '../../../infra/pdf/gerar-pdf-de-html.service.js';

export type ImprimirEtiquetasRecebimentoUseCaseInput = {
  recebimentoId: string;
  etiquetas?: EtiquetaPaleteGerada[];
};

@Injectable()
export class ImprimirEtiquetasRecebimentoUseCase {
  constructor(
    private readonly gerarPdfDeHtmlService: GerarPdfDeHtmlService,
    private readonly carregarEtiquetasGeradasRecebimentoService: CarregarEtiquetasGeradasRecebimentoService,
  ) {}

  async execute(
    input: ImprimirEtiquetasRecebimentoUseCaseInput,
  ): Promise<ImprimirEtiquetasRecebimentoResult> {
    const etiquetas =
      input.etiquetas ??
      (await this.carregarEtiquetasGeradasRecebimentoService.execute(
        input.recebimentoId,
      ));

    if (etiquetas.length === 0) {
      throw new BadRequestException(
        'Informe as etiquetas ou finalize o recebimento antes de imprimir',
      );
    }

    const html = await montarHtmlEtiquetasPaletePdf(etiquetas);
    const buffer = await this.gerarPdfDeHtmlService.gerarPdf(html);

    const numeroRecebimento = etiquetas[0]?.numeroRecebimento ?? 'recebimento';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `etiquetas-${numeroRecebimento}-${timestamp}.pdf`;

    return { buffer, filename };
  }
}
