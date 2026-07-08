import type { ImpressaoConfig } from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import {
  impressaoConfigSchema,
  type ImpressaoConfigConteudo,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import {
  qrCodeConfigurado,
  TIPO_LAYOUT_MAPA_LABELS,
  type TipoLayoutMapa,
} from '@/features/expedicao-impressao-config/types/layout-mapa';

export function extrairConteudoConfig(
  config: ImpressaoConfig,
): ImpressaoConfigConteudo {
  const {
    centroId: _centroId,
    centroNome: _centroNome,
    nomeCentroSistema: _nomeCentroSistema,
    usuarioId: _usuarioId,
    ...conteudo
  } = config;

  return conteudo;
}

export function validarConfigImpressao(config: ImpressaoConfig): string | null {
  const parsed = impressaoConfigSchema.safeParse(config);

  if (!parsed.success) {
    return 'Revise os campos antes de salvar.';
  }

  if (
    !parsed.data.opcoesSeparacao.separarPaletesCompletos &&
    !parsed.data.opcoesSeparacao.separarUnidadesIndividuais &&
    !parsed.data.opcoesSeparacao.segregarFifo
  ) {
    return 'Ative ao menos uma opção de separação.';
  }

  if (
    parsed.data.opcoesSeparacao.segregarFifo &&
    parsed.data.opcoesSeparacao.faixasFifo.length === 0
  ) {
    return 'Selecione ao menos uma faixa FIFO.';
  }

  const tiposLayout: TipoLayoutMapa[] = [
    'separacao',
    'conferencia',
    'conferencia_reentrega',
    'carregamento',
  ];
  const tipoInvalido = tiposLayout.find(
    (tipo) =>
      !qrCodeConfigurado(
        parsed.data.layoutCabecalho[tipo],
        parsed.data.qrCodeMapa[tipo].posicao,
      ),
  );

  if (tipoInvalido) {
    return `QR Code obrigatório em ${TIPO_LAYOUT_MAPA_LABELS[tipoInvalido]}: escolha uma posição fixa ou inclua {{qr_code}} no HTML.`;
  }

  return null;
}
